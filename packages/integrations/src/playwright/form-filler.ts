/**
 * AI-powered form filler.
 *
 * Strategy:
 * 1. Extract all visible form fields from the page (label, type, required, options)
 * 2. Ask Claude: given the user profile + job context, what value goes in each field?
 * 3. Apply fills: text, select, radio, checkbox, file upload
 * 4. Return a log of what was filled and what was skipped
 */

import type { Page } from "playwright";
import { callAnthropicMessages, buildAnthropicModelCandidates, resolveAnthropicApiKey } from "../ai/anthropic-messages";
import { humanDelay, humanType } from "./browser";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  yearsExperience?: number;
  currentTitle?: string;
  desiredSalary?: string;
  noticePeriod?: string;
  rightToWork?: boolean;
  requiresSponsorship?: boolean;
  cvText?: string;
  coverLetterText?: string;
}

export interface FormField {
  label: string;
  type: "text" | "number" | "textarea" | "select" | "radio" | "checkbox" | "file" | "unknown";
  required: boolean;
  options?: string[];
  selector: string;
  currentValue?: string;
  min?: string;
  max?: string;
}

export interface FillInstruction {
  selector: string;
  value: string;
  type: FormField["type"];
  label: string;
}

export interface FormFillResult {
  filled: FillInstruction[];
  skipped: string[];
  errors: string[];
}

/** Extract all visible interactive form fields from the current page */
export async function extractFormFields(page: Page): Promise<FormField[]> {
  return page.evaluate(() => {
    const fields: Array<{
      label: string;
      type: string;
      required: boolean;
      options: string[];
      selector: string;
      currentValue: string;
      min?: string;
      max?: string;
    }> = [];

    const seen = new Set<string>();

    function getLabel(el: Element): string {
      // Try aria-label
      const aria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
      if (aria) {
        const ref = document.getElementById(aria);
        if (ref) return ref.textContent?.trim() || aria;
        return aria;
      }
      // Try associated label
      const id = el.getAttribute("id");
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return label.textContent?.trim() || "";
      }
      // Try parent label
      const parentLabel = el.closest("label");
      if (parentLabel) return parentLabel.textContent?.trim() || "";
      // Try preceding sibling / parent text
      const parent = el.parentElement;
      if (parent) {
        const text = parent.textContent?.trim();
        if (text && text.length < 200) return text;
      }
      return el.getAttribute("name") || el.getAttribute("placeholder") || "";
    }

    function makeSelector(el: Element): string {
      if (el.id) return `#${CSS.escape(el.id)}`;
      if (el.getAttribute("name")) return `[name="${el.getAttribute("name")}"]`;
      const idx = Array.from(document.querySelectorAll(el.tagName)).indexOf(el as HTMLElement);
      return `${el.tagName.toLowerCase()}:nth-of-type(${idx + 1})`;
    }

    document.querySelectorAll("input, select, textarea").forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (!el.offsetParent && el.getAttribute("type") !== "hidden") return; // hidden
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const selector = makeSelector(el);
      if (seen.has(selector)) return;
      seen.add(selector);

      const tag = el.tagName.toLowerCase();
      const inputType = el instanceof HTMLInputElement ? el.type : tag;

      let type: string = "text";
      if (tag === "select") type = "select";
      else if (tag === "textarea") type = "textarea";
      else if (inputType === "radio") type = "radio";
      else if (inputType === "checkbox") type = "checkbox";
      else if (inputType === "file") type = "file";
      else if (inputType === "number") type = "number";
      else if (inputType === "hidden") return;

      const options: string[] = [];
      if (tag === "select") {
        el.querySelectorAll("option").forEach((opt) => {
          if ((opt as HTMLOptionElement).value) options.push(opt.textContent?.trim() || "");
        });
      }

      const label = getLabel(el);
      const required =
        el.hasAttribute("required") ||
        el.getAttribute("aria-required") === "true" ||
        !!el.closest("[required]");

      const currentValue =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
          ? el.value
          : el instanceof HTMLSelectElement
            ? el.options[el.selectedIndex]?.text || ""
            : "";

      const min = el.getAttribute("min") ?? undefined;
      const max = el.getAttribute("max") ?? undefined;
      fields.push({ label, type, required, options, selector, currentValue, min, max });
    });

    return fields;
  }) as Promise<FormField[]>;
}

/** Ask Claude what value to put in each form field */
async function askAiForFills(
  fields: FormField[],
  profile: UserProfile,
  jobContext: { company: string; position: string; description?: string }
): Promise<FillInstruction[]> {
  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) return [];

  const fieldsJson = JSON.stringify(
    fields.map((f) => ({
      label: f.label,
      type: f.type,
      required: f.required,
      options: f.options,
      selector: f.selector,
      current: f.currentValue,
      ...(f.min !== undefined ? { min: f.min } : {}),
      ...(f.max !== undefined ? { max: f.max } : {}),
    })),
    null,
    2
  );

  const profileText = `
Name: ${profile.firstName} ${profile.lastName}
Email: ${profile.email}
Phone: ${profile.phone ?? "not provided"}
Location: ${profile.location ?? "not provided"}
Current title: ${profile.currentTitle ?? "not provided"}
Years experience: ${profile.yearsExperience ?? "not provided"}
Desired salary: ${profile.desiredSalary ?? "negotiable"}
Notice period: ${profile.noticePeriod ?? "not provided"}
Right to work: ${profile.rightToWork !== undefined ? (profile.rightToWork ? "yes" : "no") : "yes"}
Requires sponsorship: ${profile.requiresSponsorship !== undefined ? (profile.requiresSponsorship ? "yes" : "no") : "no"}
LinkedIn: ${profile.linkedinUrl ?? "not provided"}
Website: ${profile.websiteUrl ?? "not provided"}
`;

  const prompt = `You are filling a job application form on behalf of a candidate.

JOB: ${jobContext.position} at ${jobContext.company}
${jobContext.description ? `DESCRIPTION EXCERPT: ${jobContext.description.slice(0, 800)}` : ""}

CANDIDATE PROFILE:
${profileText}

FORM FIELDS (JSON):
${fieldsJson}

TASK: For each field, decide the best value to enter. Respond ONLY with a valid JSON array:
[
  { "selector": "<exact selector from input>", "value": "<value to fill>", "reason": "<why>" }
]

Rules:
- For select/radio/checkbox: value must exactly match one of the listed options (or "yes"/"no" for checkboxes)
- For file fields: skip them (value = "__skip__")
- For fields already correctly filled (currentValue looks right): value = "__keep__"
- For fields you cannot confidently answer: value = "__skip__"
- Never invent contact details not in the profile
- For salary fields: use the desired salary or "Negotiable"
- For cover letter text fields: write a short 2-sentence summary based on the profile
- For "Are you authorized to work?" type questions: answer based on rightToWork field
- For "Do you require sponsorship?" type questions: answer based on requiresSponsorship field
- Prefer "yes" for questions like "Are you available for interview?"
- For number fields (type=number): ALWAYS provide a positive number. If the field asks for years of experience in a skill, use the candidate's total years experience or a reasonable estimate (never 0). If min is specified, the value must be >= min. Format as an integer string like "3" unless the field clearly needs a decimal.

Respond with ONLY the JSON array, no markdown, no explanation.`;

  const result = await callAnthropicMessages({
    prompt,
    apiKey,
    modelCandidates: buildAnthropicModelCandidates(),
    maxTokens: 2000,
    temperature: 0.1,
  });

  if (!result.ok) return [];

  try {
    const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ selector: string; value: string }>;
    return parsed
      .filter((p) => p.selector && p.value && p.value !== "__skip__" && p.value !== "__keep__")
      .map((p) => {
        const field = fields.find((f) => f.selector === p.selector);
        return {
          selector: p.selector,
          value: p.value,
          type: field?.type ?? "text",
          label: field?.label ?? p.selector,
        };
      });
  } catch {
    return [];
  }
}

/** Apply fill instructions to the page */
async function applyFills(page: Page, instructions: FillInstruction[]): Promise<{ filled: FillInstruction[]; errors: string[] }> {
  const filled: FillInstruction[] = [];
  const errors: string[] = [];

  for (const ins of instructions) {
    try {
      const exists = await page.locator(ins.selector).count();
      if (exists === 0) continue;

      if (ins.type === "select") {
        await page.selectOption(ins.selector, { label: ins.value }).catch(async () => {
          await page.selectOption(ins.selector, { value: ins.value });
        });
      } else if (ins.type === "radio") {
        const radios = page.locator(`input[type="radio"]`);
        const count = await radios.count();
        for (let i = 0; i < count; i++) {
          const radio = radios.nth(i);
          const label = await radio.evaluate((el: HTMLInputElement) => {
            const id = el.getAttribute("id");
            const labelEl = id ? document.querySelector(`label[for="${id}"]`) : null;
            return labelEl?.textContent?.trim() || el.getAttribute("value") || "";
          });
          if (label.toLowerCase().includes(ins.value.toLowerCase())) {
            await radio.check();
            break;
          }
        }
      } else if (ins.type === "checkbox") {
        const shouldCheck = ["yes", "true", "1", "on"].includes(ins.value.toLowerCase());
        if (shouldCheck) {
          await page.check(ins.selector).catch(() => void 0);
        } else {
          await page.uncheck(ins.selector).catch(() => void 0);
        }
      } else if (ins.type === "textarea" || ins.type === "text" || ins.type === "number") {
        await humanType(page, ins.selector, ins.value);
      }

      filled.push(ins);
      await humanDelay(200, 600);
    } catch (e) {
      errors.push(`${ins.label}: ${String(e).slice(0, 100)}`);
    }
  }

  return { filled, errors };
}

/** Upload a file to a file input. Downloads from URL if needed. */
export async function uploadFile(page: Page, fileSelector: string, fileUrlOrPath: string): Promise<boolean> {
  try {
    let filePath = fileUrlOrPath;

    // If it's a URL, download it to a temp file
    if (fileUrlOrPath.startsWith("http")) {
      const ext = fileUrlOrPath.includes(".pdf") ? ".pdf" : ".pdf";
      const tmpPath = path.join(os.tmpdir(), `apply-attach-${Date.now()}${ext}`);
      const resp = await fetch(fileUrlOrPath);
      if (!resp.ok) return false;
      const buf = await resp.arrayBuffer();
      fs.writeFileSync(tmpPath, Buffer.from(buf));
      filePath = tmpPath;
    }

    const input = page.locator(fileSelector);
    await input.setInputFiles(filePath);
    await humanDelay(800, 1500);
    return true;
  } catch {
    return false;
  }
}

/** Main entry point — analyse page, ask AI, fill fields */
export async function fillFormPage(input: {
  page: Page;
  profile: UserProfile;
  jobContext: { company: string; position: string; description?: string };
  cvPath?: string;
  coverLetterPath?: string;
}): Promise<FormFillResult> {
  const fields = await extractFormFields(input.page);
  if (fields.length === 0) return { filled: [], skipped: [], errors: [] };

  const nonFileFields = fields.filter((f) => f.type !== "file");
  const fileFields = fields.filter((f) => f.type === "file");

  // AI fills text/select/radio/checkbox/number
  const instructions = await askAiForFills(nonFileFields, input.profile, input.jobContext);
  const { filled, errors } = await applyFills(input.page, instructions);

  // Safety pass: check ALL number fields after AI fills — including AI-filled ones.
  // If value is 0, empty, or below min, override with yearsExperience or fallback.
  const numberFields = nonFileFields.filter((f) => f.type === "number");
  for (const nf of numberFields) {
    const currentVal = await input.page.locator(nf.selector).inputValue().catch(() => "");
    const numVal = parseFloat(currentVal);
    const minVal = nf.min !== undefined ? parseFloat(nf.min) : 0.1;
    if (!currentVal || isNaN(numVal) || numVal <= 0 || numVal < minVal) {
      const fallback = String(input.profile.yearsExperience ?? 3);
      await humanType(input.page, nf.selector, fallback).catch(() => void 0);
      // Update filled list — replace if already there, else push
      const existingIdx = filled.findIndex((f) => f.selector === nf.selector);
      const entry = { selector: nf.selector, value: fallback, type: "number" as const, label: nf.label };
      if (existingIdx >= 0) filled[existingIdx] = entry;
      else filled.push(entry);
    }
  }

  // Handle file uploads separately
  const skipped: string[] = [];
  for (const ff of fileFields) {
    const label = ff.label.toLowerCase();
    let uploaded = false;

    if ((label.includes("cv") || label.includes("resume")) && input.cvPath) {
      uploaded = await uploadFile(input.page, ff.selector, input.cvPath);
    } else if ((label.includes("cover") || label.includes("letter")) && input.coverLetterPath) {
      uploaded = await uploadFile(input.page, ff.selector, input.coverLetterPath);
    }

    if (!uploaded) skipped.push(ff.label || ff.selector);
  }

  // Fields AI skipped
  const filledSelectors = new Set(filled.map((f) => f.selector));
  for (const f of nonFileFields) {
    if (!filledSelectors.has(f.selector) && !f.currentValue) {
      skipped.push(f.label || f.selector);
    }
  }

  return { filled, skipped, errors };
}
