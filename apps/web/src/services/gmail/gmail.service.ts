// TODO: Implement using googleapis (gmail_v1).
// Reference: https://developers.google.com/gmail/api/reference/rest

import type { GmailMessage, GmailThread, GmailLabel } from "./gmail.types";

export class GmailService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * TODO: Fetch recent emails matching a query string.
   * e.g. query = "from:recruiter subject:interview"
   */
  async searchMessages(_query: string, _maxResults = 20): Promise<GmailMessage[]> {
    // TODO: GET /gmail/v1/users/me/messages?q={query}
    throw new Error("GmailService.searchMessages not implemented");
  }

  /**
   * TODO: Fetch a single message by ID.
   */
  async getMessage(_messageId: string): Promise<GmailMessage> {
    // TODO: GET /gmail/v1/users/me/messages/{id}
    throw new Error("GmailService.getMessage not implemented");
  }

  /**
   * TODO: Fetch a full thread to detect reply chains.
   */
  async getThread(_threadId: string): Promise<GmailThread> {
    // TODO: GET /gmail/v1/users/me/threads/{id}
    throw new Error("GmailService.getThread not implemented");
  }

  /**
   * TODO: Send an email via the Gmail API.
   */
  async sendMessage(_to: string, _subject: string, _body: string): Promise<void> {
    // TODO: POST /gmail/v1/users/me/messages/send
    throw new Error("GmailService.sendMessage not implemented");
  }

  /**
   * TODO: List labels for routing / detection logic.
   */
  async listLabels(): Promise<GmailLabel[]> {
    // TODO: GET /gmail/v1/users/me/labels
    throw new Error("GmailService.listLabels not implemented");
  }
}
