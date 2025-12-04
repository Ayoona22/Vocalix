export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  voiceVerificationUrl?: string; // URL/Base64 of the recorded signup audio
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  audioUrl?: string;
  timestamp: number;
  isPersonalized?: boolean;
}

export interface ChatSession {
  contactId: string;
  messages: Message[];
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}

export enum RecorderStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  STOPPED = 'stopped',
}
