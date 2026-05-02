export interface GmailMessageHeader {
  name:  string;
  value: string;
}

export interface GmailMessagePart {
  mimeType: string;
  body: {
    data?:       string;
    attachmentId?: string;
    size:        number;
  };
  parts?: GmailMessagePart[];
  headers?: GmailMessageHeader[];
}

export interface GmailMessage {
  id:        string;
  threadId:  string;
  snippet:   string;
  subject:   string;
  from:      string;
  to:        string;
  date:      string;
  body:      string;
  labelIds:  string[];
  payload?:  GmailMessagePart;
}

export interface GmailThread {
  id:       string;
  messages: GmailMessage[];
}

export interface GmailLabel {
  id:   string;
  name: string;
  type: "system" | "user";
}
