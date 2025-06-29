import type { User, Room, Message, File, WhiteboardStroke } from "@shared/schema";

export interface Participant {
  id: number;
  user: User;
  joinedAt: Date;
  isActive: boolean;
  mediaState: MediaState;
}

export interface MediaState {
  audio: boolean;
  video: boolean;
  screenShare: boolean;
}

export interface ChatMessage extends Message {
  user: User;
}

export interface SharedFile extends File {
  user: User;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: number;
  to: number;
  signal: any;
}

export interface DrawingTool {
  type: 'pen' | 'eraser' | 'shape' | 'text';
  color: string;
  width: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingStroke {
  points: DrawingPoint[];
  tool: DrawingTool;
  timestamp: number;
}

export interface RoomState {
  room: Room | null;
  participants: Participant[];
  messages: ChatMessage[];
  files: SharedFile[];
  whiteboardStrokes: WhiteboardStroke[];
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
}
