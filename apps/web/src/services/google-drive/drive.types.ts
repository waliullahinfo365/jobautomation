export interface DriveFile {
  id:           string;
  name:         string;
  mimeType:     string;
  webViewLink:  string;
  size?:        string;
  createdTime:  string;
  modifiedTime: string;
  parents:      string[];
}

export interface DriveFolder extends DriveFile {
  mimeType: "application/vnd.google-apps.folder";
}
