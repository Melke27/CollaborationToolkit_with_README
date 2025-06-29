import { 
  users, rooms, roomParticipants, messages, files, whiteboardStrokes,
  type User, type InsertUser, type Room, type InsertRoom, 
  type Message, type InsertMessage, type File, type InsertFile,
  type WhiteboardStroke, type InsertWhiteboardStroke, type RoomParticipant
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Room operations
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomsByHost(hostId: number): Promise<Room[]>;
  updateRoomStatus(id: number, isActive: boolean): Promise<void>;
  
  // Room participants
  addParticipant(roomId: number, userId: number): Promise<void>;
  removeParticipant(roomId: number, userId: number): Promise<void>;
  getRoomParticipants(roomId: number): Promise<(RoomParticipant & { user: User })[]>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getRoomMessages(roomId: number, limit?: number): Promise<(Message & { user: User })[]>;
  
  // Files
  createFile(file: InsertFile): Promise<File>;
  getRoomFiles(roomId: number): Promise<(File & { user: User })[]>;
  getFile(id: number): Promise<File | undefined>;
  
  // Whiteboard
  createWhiteboardStroke(stroke: InsertWhiteboardStroke): Promise<WhiteboardStroke>;
  getRoomWhiteboardStrokes(roomId: number): Promise<WhiteboardStroke[]>;
  clearRoomWhiteboard(roomId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private rooms: Map<number, Room> = new Map();
  private roomParticipants: Map<string, RoomParticipant> = new Map();
  private messages: Map<number, Message> = new Map();
  private files: Map<number, File> = new Map();
  private whiteboardStrokes: Map<number, WhiteboardStroke> = new Map();
  
  private currentUserId = 1;
  private currentRoomId = 1;
  private currentMessageId = 1;
  private currentFileId = 1;
  private currentStrokeId = 1;
  private currentParticipantId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      avatar: insertUser.avatar || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      ...insertRoom,
      id: this.currentRoomId++,
      isActive: insertRoom.isActive ?? true,
      maxParticipants: insertRoom.maxParticipants ?? 10,
      createdAt: new Date(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async getRoomsByHost(hostId: number): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.hostId === hostId);
  }

  async updateRoomStatus(id: number, isActive: boolean): Promise<void> {
    const room = this.rooms.get(id);
    if (room) {
      this.rooms.set(id, { ...room, isActive });
    }
  }

  async addParticipant(roomId: number, userId: number): Promise<void> {
    const key = `${roomId}-${userId}`;
    const participant: RoomParticipant = {
      id: this.currentParticipantId++,
      roomId,
      userId,
      joinedAt: new Date(),
      leftAt: null,
      isActive: true,
    };
    this.roomParticipants.set(key, participant);
  }

  async removeParticipant(roomId: number, userId: number): Promise<void> {
    const key = `${roomId}-${userId}`;
    const participant = this.roomParticipants.get(key);
    if (participant) {
      this.roomParticipants.set(key, {
        ...participant,
        leftAt: new Date(),
        isActive: false,
      });
    }
  }

  async getRoomParticipants(roomId: number): Promise<(RoomParticipant & { user: User })[]> {
    const participants = Array.from(this.roomParticipants.values())
      .filter(p => p.roomId === roomId && p.isActive);
    
    return participants.map(p => ({
      ...p,
      user: this.users.get(p.userId)!,
    }));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: this.currentMessageId++,
      messageType: insertMessage.messageType ?? 'text',
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async getRoomMessages(roomId: number, limit = 50): Promise<(Message & { user: User })[]> {
    const messages = Array.from(this.messages.values())
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit);
    
    return messages.map(m => ({
      ...m,
      user: this.users.get(m.userId)!,
    }));
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const file: File = {
      ...insertFile,
      id: this.currentFileId++,
      uploadedAt: new Date(),
    };
    this.files.set(file.id, file);
    return file;
  }

  async getRoomFiles(roomId: number): Promise<(File & { user: User })[]> {
    const files = Array.from(this.files.values())
      .filter(f => f.roomId === roomId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    
    return files.map(f => ({
      ...f,
      user: this.users.get(f.userId)!,
    }));
  }

  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async createWhiteboardStroke(insertStroke: InsertWhiteboardStroke): Promise<WhiteboardStroke> {
    const stroke: WhiteboardStroke = {
      ...insertStroke,
      id: this.currentStrokeId++,
      createdAt: new Date(),
    };
    this.whiteboardStrokes.set(stroke.id, stroke);
    return stroke;
  }

  async getRoomWhiteboardStrokes(roomId: number): Promise<WhiteboardStroke[]> {
    return Array.from(this.whiteboardStrokes.values())
      .filter(s => s.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async clearRoomWhiteboard(roomId: number): Promise<void> {
    const strokesToRemove = Array.from(this.whiteboardStrokes.entries())
      .filter(([_, stroke]) => stroke.roomId === roomId);
    
    strokesToRemove.forEach(([id]) => {
      this.whiteboardStrokes.delete(id);
    });
  }
}

export const storage = new MemStorage();
