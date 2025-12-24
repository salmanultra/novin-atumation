export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum LetterStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SEEN = 'SEEN', // For Viewers
}

export type RecipientRole = 'SIGNER' | 'VIEWER';

export interface LetterRecipient {
  userId: string;
  userName: string;
  role: RecipientRole;
  status: LetterStatus;
  actionDate?: number;
  comment?: string;
  signatureImage?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: Role;
  position: string;
  signatureImage?: string;
  avatarUrl?: string; // Added for Profile Picture
}

export interface Attachment {
  name: string;
  type: string;
  data: string;
  size: number;
}

export interface Letter {
  id: string;
  subject: string;
  content: string;
  senderId: string;
  senderName: string;
  recipients: LetterRecipient[]; // Changed from single receiver to array
  status: LetterStatus; // Overall status (derived from signers)
  createdAt: number;
  attachment?: Attachment;
}

export interface Log {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface SystemSettings {
  siteName: string;
  logoUrl?: string; // Base64 or URL
  themeColor: string; // Hex color
}