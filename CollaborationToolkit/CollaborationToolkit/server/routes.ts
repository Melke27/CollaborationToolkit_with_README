import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertUserSchema, insertRoomSchema, insertMessageSchema, insertFileSchema, insertWhiteboardStrokeSchema } from "@shared/schema";
import { z } from "zod";
import "./types";

const upload = multer({ dest: 'uploads/' });

interface WebSocketClient extends WebSocket {
  userId?: number;
  roomId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<number, Set<WebSocketClient>>();
  
  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            ws.userId = message.userId;
            ws.roomId = message.roomId;
            
            if (!clients.has(message.roomId)) {
              clients.set(message.roomId, new Set());
            }
            clients.get(message.roomId)!.add(ws);
            
            // Add participant to room
            await storage.addParticipant(message.roomId, message.userId);
            
            // Broadcast participant joined
            broadcastToRoom(message.roomId, {
              type: 'participant-joined',
              userId: message.userId,
            }, ws);
            
            // Send current participants
            const participants = await storage.getRoomParticipants(message.roomId);
            ws.send(JSON.stringify({
              type: 'participants-list',
              participants,
            }));
            break;
            
          case 'leave':
            if (ws.roomId && ws.userId) {
              await storage.removeParticipant(ws.roomId, ws.userId);
              broadcastToRoom(ws.roomId, {
                type: 'participant-left',
                userId: ws.userId,
              }, ws);
              
              const roomClients = clients.get(ws.roomId);
              if (roomClients) {
                roomClients.delete(ws);
              }
            }
            break;
            
          case 'chat-message':
            if (ws.roomId && ws.userId) {
              const chatMessage = await storage.createMessage({
                roomId: ws.roomId,
                userId: ws.userId,
                content: message.content,
                messageType: 'text',
              });
              
              const user = await storage.getUser(ws.userId);
              broadcastToRoom(ws.roomId, {
                type: 'chat-message',
                message: { ...chatMessage, user },
              });
            }
            break;
            
          case 'whiteboard-stroke':
            if (ws.roomId && ws.userId) {
              const stroke = await storage.createWhiteboardStroke({
                roomId: ws.roomId,
                userId: ws.userId,
                strokeData: message.strokeData,
              });
              
              broadcastToRoom(ws.roomId, {
                type: 'whiteboard-stroke',
                stroke,
              }, ws);
            }
            break;
            
          case 'webrtc-signal':
            if (ws.roomId) {
              // Forward WebRTC signaling messages
              broadcastToRoom(ws.roomId, {
                type: 'webrtc-signal',
                from: ws.userId,
                to: message.to,
                signal: message.signal,
              }, ws);
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', async () => {
      if (ws.roomId && ws.userId) {
        await storage.removeParticipant(ws.roomId, ws.userId);
        broadcastToRoom(ws.roomId, {
          type: 'participant-left',
          userId: ws.userId,
        }, ws);
        
        const roomClients = clients.get(ws.roomId);
        if (roomClients) {
          roomClients.delete(ws);
        }
      }
    });
  });
  
  function broadcastToRoom(roomId: number, message: any, sender?: WebSocketClient) {
    const roomClients = clients.get(roomId);
    if (roomClients) {
      roomClients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }
  
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };
  
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const user = await storage.createUser(userData);
      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get user' });
    }
  });
  
  // Room routes
  app.post('/api/rooms', requireAuth, async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse({
        ...req.body,
        hostId: req.session.userId,
      });
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid room data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create room' });
    }
  });
  
  app.get('/api/rooms/:id', requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      const participants = await storage.getRoomParticipants(roomId);
      res.json({ ...room, participants });
    } catch (error) {
      res.status(500).json({ message: 'Failed to get room' });
    }
  });
  
  app.get('/api/rooms/:id/messages', requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const messages = await storage.getRoomMessages(roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get messages' });
    }
  });
  
  // File upload/download routes
  app.post('/api/rooms/:id/files', requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const roomId = parseInt(req.params.id);
      const fileData = insertFileSchema.parse({
        roomId,
        userId: req.session.userId!,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });
      
      const file = await storage.createFile(fileData);
      const user = await storage.getUser(req.session.userId!);
      
      // Broadcast file upload to room
      broadcastToRoom(roomId, {
        type: 'file-uploaded',
        file: { ...file, user },
      });
      
      res.json({ ...file, user });
    } catch (error) {
      res.status(500).json({ message: 'File upload failed' });
    }
  });
  
  app.get('/api/rooms/:id/files', requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const files = await storage.getRoomFiles(roomId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get files' });
    }
  });
  
  app.get('/api/files/:id/download', requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file || !fs.existsSync(file.path)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      res.download(file.path, file.originalName);
    } catch (error) {
      res.status(500).json({ message: 'File download failed' });
    }
  });
  
  // Whiteboard routes
  app.get('/api/rooms/:id/whiteboard', requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const strokes = await storage.getRoomWhiteboardStrokes(roomId);
      res.json(strokes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get whiteboard data' });
    }
  });
  
  app.delete('/api/rooms/:id/whiteboard', requireAuth, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      await storage.clearRoomWhiteboard(roomId);
      
      // Broadcast whiteboard clear to room
      broadcastToRoom(roomId, {
        type: 'whiteboard-cleared',
      });
      
      res.json({ message: 'Whiteboard cleared' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear whiteboard' });
    }
  });
  
  return httpServer;
}
