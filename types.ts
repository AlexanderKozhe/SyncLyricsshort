export interface SyncedLine {
  id: string;
  text: string;
  begin: number | null;
  end: number | null;
}

export enum Tab {
  Audio = 'audio',
  Text = 'text',
  Sync = 'sync',
  Result = 'result',
  Player = 'player',
  Admin = 'admin',
  Profile = 'profile',

}

export type IssueType = 'doubleSpaces' | 'capitalization' | 'trim' | 'punctuation' | 'symbols' | 'emptyLines' | 'startEmpty' | 'endEmpty' | 'tags';

export interface AnalysisIssue {
  type: IssueType;
  lineIndex: number;
  lineId: string;
  text: string;
  message: string;
}

export interface AnalysisResult {
  [key: string]: AnalysisIssue[];
}

export enum Role {
  User = 'user',
  Admin = 'admin',
  Curator = 'curator',
}

export interface User {
  uid: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  photoURL: string | null;
}
