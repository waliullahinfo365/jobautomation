import { describe, it, expect } from "vitest";
import { isRealJobOpportunity } from "../ai.service";
import type { JobIntakeEmailPayload } from "@jobflow/shared/types/job";

function makePayload(overrides: Partial<JobIntakeEmailPayload>): JobIntakeEmailPayload {
  return {
    provider: "gmail",
    providerMessageId: "test-msg-id",
    providerThreadId: "test-thread-id",
    from: overrides.from ?? "sender@example.com",
    subject: overrides.subject ?? "",
    bodyText: overrides.bodyText ?? "",
    receivedAt: new Date().toISOString(),
    labels: [],
    ...overrides,
  };
}

// ─── Fixture A: LinkedIn real job alert → should be ACCEPTED ───────────────

describe("Fixture A — LinkedIn real job alert (accepted)", () => {
  const payload = makePayload({
    from: "jobalerts-noreply@linkedin.com",
    subject: "Your job alert for sales manager in Barcelona",
    bodyText: [
      "Your job alert for sales manager in Barcelona",
      "3 new jobs match your alert",
      "",
      "National Sales Manager - Spain",
      "Merlin Digital Partner",
      "Barcelona, Spain",
      "",
      "View job",
      "https://www.linkedin.com/jobs/view/3987654321/?trk=job-alert",
      "",
      "General Manager",
      "Walker Lovell",
      "London, United Kingdom",
      "",
      "View job",
      "https://www.linkedin.com/jobs/view/3987654322/?trk=job-alert",
      "",
      "Senior Account Manager (German Speaking)",
      "Perk",
      "Berlin, Germany",
      "",
      "View job",
      "https://www.linkedin.com/jobs/view/3987654323/?trk=job-alert",
    ].join("\n"),
  });

  it("should be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(true);
  });

  it("should have confidence >= 0.85", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("should detect type as job_alert", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.detectedType).toBe("job_alert");
  });
});

// ─── Fixture B: LinkedIn newsletter article → should be REJECTED ───────────

describe("Fixture B — LinkedIn newsletter article (rejected)", () => {
  const payload = makePayload({
    from: "messages-noreply@linkedin.com",
    subject: "Why Claude Code Changes More Than Software Development #162",
    bodyText: [
      "Read on LinkedIn",
      "Why Claude Code Changes More Than Software Development",
      "This week's most-read article in your network",
      "Read now on LinkedIn",
      "Unsubscribe from this newsletter",
    ].join("\n"),
  });

  it("should not be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(false);
  });

  it("should detect type as newsletter or article", () => {
    const result = isRealJobOpportunity(payload);
    expect(["newsletter", "article"]).toContain(result.detectedType);
  });
});

// ─── Fixture C: LinkedIn Sales Navigator notification → REJECTED ───────────

describe("Fixture C — LinkedIn Sales Navigator notification (rejected)", () => {
  const payload = makePayload({
    from: "inmail-noreply@linkedin.com",
    subject: "Your Sales Navigator digest for this week",
    bodyText: [
      "Sales Navigator weekly digest",
      "You have 5 new leads to review",
      "Upgrade your InMail credits",
      "View in Sales Navigator",
    ].join("\n"),
  });

  it("should not be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(false);
  });

  it("should detect type as sales_nav_notification or newsletter", () => {
    const result = isRealJobOpportunity(payload);
    expect(["sales_nav_notification", "newsletter"]).toContain(result.detectedType);
  });
});

// ─── Fixture D: LinkedIn Pulse article → REJECTED ─────────────────────────

describe("Fixture D — LinkedIn Pulse article (rejected)", () => {
  const payload = makePayload({
    from: "notifications-noreply@linkedin.com",
    subject: "The Operating Model Problem Most Companies Are Still Ignoring",
    bodyText: [
      "Someone in your network shared this article",
      "The Operating Model Problem Most Companies Are Still Ignoring",
      "Read the full article on LinkedIn",
      "https://www.linkedin.com/pulse/operating-model-problem-companies-ignoring-abc123",
      "Unsubscribe",
    ].join("\n"),
  });

  it("should not be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(false);
  });

  it("should detect type as article or linkedin_update", () => {
    const result = isRealJobOpportunity(payload);
    expect(["article", "linkedin_update", "newsletter"]).toContain(result.detectedType);
  });
});

// ─── Fixture E: Generic newsletter → REJECTED ────────────────────────────

describe("Fixture E — Generic newsletter email (rejected)", () => {
  const payload = makePayload({
    from: "newsletter@somesite.com",
    subject: "Why Are So Many Candidates Applying and Hearing Nothing Back?",
    bodyText: [
      "This week in hiring trends",
      "Why Are So Many Candidates Applying and Hearing Nothing Back?",
      "Read more at somesite.com",
      "To unsubscribe from this newsletter, click here.",
    ].join("\n"),
  });

  it("should not be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(false);
  });

  it("should detect type as newsletter", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.detectedType).toBe("newsletter");
  });
});

// ─── Fixture F: ATS/recruiter direct job email → ACCEPTED ────────────────

describe("Fixture F — Real company job alert via ATS (accepted)", () => {
  const payload = makePayload({
    from: "no-reply@greenhouse.io",
    subject: "New role: Senior Product Manager at Acme Corp",
    bodyText: [
      "Acme Corp is hiring a Senior Product Manager",
      "Location: Berlin, Germany (Remote OK)",
      "Salary range: €90,000 – €120,000",
      "Key responsibilities:",
      "- Lead product strategy for our core platform",
      "- Work cross-functionally with engineering and design",
      "Apply now: https://boards.greenhouse.io/acmecorp/jobs/12345",
      "Interview process: phone screen → technical → final panel",
    ].join("\n"),
  });

  it("should be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(true);
  });

  it("should have confidence >= 0.85", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("should detect type as job_alert", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.detectedType).toBe("job_alert");
  });
});

// ─── Fixture G: LinkedIn "people have updates" → REJECTED ────────────────

describe("Fixture G — LinkedIn network update (rejected)", () => {
  const payload = makePayload({
    from: "notifications-noreply@linkedin.com",
    subject: "Nico Morga Alden, Matty Schirle, and others have updates",
    bodyText: [
      "Your connections have updates",
      "Nico Morga Alden shared a post",
      "Matty Schirle commented on an article",
      "See their updates on LinkedIn",
    ].join("\n"),
  });

  it("should not be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(false);
  });

  it("should detect type as linkedin_update or newsletter", () => {
    const result = isRealJobOpportunity(payload);
    expect(["linkedin_update", "newsletter"]).toContain(result.detectedType);
  });
});

// ─── Fixture H: Stepstone job alert digest → ACCEPTED ─────────────────────

describe("Fixture H — Stepstone job alert digest (accepted)", () => {
  const payload = makePayload({
    from: "newsletter@stepstone.de",
    subject: "Passende Jobs für Sie",
    bodyText: [
      "Passende Stellen für Ihr Profil",
      "",
      "Senior Product Manager (m/w/d)",
      "Acme GmbH",
      "Berlin, Deutschland",
      "",
      "Jetzt bewerben",
      "https://www.stepstone.de/stellenangebote--123456",
      "",
      "Marketing Lead (m/w/d)",
      "Other GmbH",
      "München, Deutschland",
      "",
      "Jetzt bewerben",
    ].join("\n"),
  });

  it("should be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(true);
  });

  it("should detect type as job_alert", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.detectedType).toBe("job_alert");
  });
});

// ─── Fixture I: Indeed job alert digest → ACCEPTED ────────────────────────

describe("Fixture I — Indeed job alert digest (accepted)", () => {
  const payload = makePayload({
    from: "jobalert@indeedemail.com",
    subject: "New jobs for you",
    bodyText: [
      "Jobs matching your alert",
      "",
      "Data Analyst",
      "Global Corp - London, UK",
      "",
      "Easily apply",
      "https://www.indeed.com/viewjob?jk=abc123",
    ].join("\n"),
  });

  it("should be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(true);
  });
});

// ─── Fixture J: Meinestadt job board → ACCEPTED (not marketing blocklist) ─

describe("Fixture J — Meinestadt job alert (accepted)", () => {
  const payload = makePayload({
    from: "jobs@meinestadt.de",
    subject: "Neue Stellenangebote in Berlin",
    bodyText: [
      "Passende Jobs in Berlin",
      "",
      "Office Manager (m/w/d)",
      "City Services GmbH",
      "Berlin",
      "",
      "Zur Stellenanzeige",
    ].join("\n"),
  });

  it("should be classified as a job", () => {
    const result = isRealJobOpportunity(payload);
    expect(result.isJob).toBe(true);
  });
});
