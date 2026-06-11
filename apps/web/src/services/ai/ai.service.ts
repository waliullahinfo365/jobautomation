// TODO: Implement with Anthropic SDK.
// Supports Anthropic only; switch via env.

import type { AIProvider, AICompletionOptions, AICompletionResult } from "./ai.types";

export class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider = "anthropic") {
    this.provider = provider;
  }

  /**
   * TODO: Generate text completion (cover letter, research summary, email draft).
   */
  async complete(_prompt: string, _options?: AICompletionOptions): Promise<AICompletionResult> {
    // TODO: Route to anthropic.messages.create
    throw new Error(`AIService.complete not implemented for provider: ${this.provider}`);
  }

  /**
   * TODO: Extract structured data from unstructured job posting text.
   */
  async extractJobData(_rawText: string): Promise<Record<string, unknown>> {
    // TODO: Use function calling / structured output to parse job details
    throw new Error("AIService.extractJobData not implemented");
  }

  /**
   * TODO: Generate a tailored CV summary for a specific job.
   */
  async tailorCVSummary(_jobDescription: string, _baseCVText: string): Promise<string> {
    // TODO: Prompt: given the job description and CV, rewrite the summary
    throw new Error("AIService.tailorCVSummary not implemented");
  }

  /**
   * TODO: Generate a cover letter draft.
   */
  async generateCoverLetter(_jobDescription: string, _candidateContext: string): Promise<string> {
    // TODO: Structured prompt with job + candidate info
    throw new Error("AIService.generateCoverLetter not implemented");
  }

  /**
   * TODO: Summarise company research into a concise report.
   */
  async generateResearchSummary(_companyName: string, _rawResearch: string): Promise<string> {
    throw new Error("AIService.generateResearchSummary not implemented");
  }
}
