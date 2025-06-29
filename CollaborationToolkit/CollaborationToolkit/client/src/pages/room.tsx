import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWebRTC } from "@/hooks/useWebRTC";
import Header from "@/components/Header";
import ParticipantsPanel from "@/components/ParticipantsPanel";
import ChatPanel from "@/components/ChatPanel";
import VideoCallInterface from "@/components/VideoCallInterface";
import ControlPanel from "@/components/ControlPanel";
import WhiteboardPanel from "@/components/WhiteboardPanel";
import FileSharePanel from "@/components/FileSharePanel";
import ConnectionStatus from "@/components/ConnectionStatus";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import type { Participant, ChatMessage, SharedFile, RoomState } from "@/types";

export default function Room() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roomState, setRoomState] = useState<RoomState>({
    room: null,
    participants: [],
    messages: [],
    files: [],
    whiteboardStrokes: [],
    isConnected: false,
    connectionQuality: 'excellent',
    latency: 0,
  });
  
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Create or join room
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; maxParticipants: number }) => {
      const response = await apiRequest("POST", "/api/rooms", roomData);
      return response.json();
    },
    onSuccess: (room) => {
      setCurrentRoomId(room.id);
      setRoomState(prev => ({ ...prev, room }));
    },
  });

  // WebSocket connection
  const webSocket = useWebSocket('/ws');
  
  // WebRTC for video calling
  const webRTC = useWebRTC({
    onRemoteStream: (stream, userId) => {
      // Handle remote video stream
      console.log('Received remote stream from user:', userId);
    },
    onSignal: (signal, targetUserId) => {
      webSocket.send({
        type: 'webrtc-signal',
        to: targetUserId,
        signal,
      });
    },
  });

  // Initialize room on component mount
  useEffect(() => {
    if (!currentRoomId && user) {
      // Create a default room for demo purposes
      createRoomMutation.mutate({
        name: 'Design Review Meeting',
        maxParticipants: 10,
      });
    }
  }, [user, currentRoomId]);

  // WebSocket event handlers
  useEffect(() => {
    if (!webSocket.isConnected) return;

    webSocket.on('participants-list', (data) => {
      setRoomState(prev => ({
        ...prev,
        participants: data.participants.map((p: any) => ({
          ...p,
          mediaState: { audio: true, video: true, screenShare: false },
        })),
      }));
    });

    webSocket.on('participant-joined', (data) => {
      setRoomState(prev => ({
        ...prev,
        participants: [...prev.participants, {
          id: data.userId,
          user: data.user,
          joinedAt: new Date(),
          isActive: true,
          mediaState: { audio: true, video: true, screenShare: false },
        }],
      }));
      
      // Initiate WebRTC connection with new participant
      if (data.userId !== user?.user?.id) {
        webRTC.createOffer(data.userId);
      }
    });

    webSocket.on('participant-left', (data) => {
      setRoomState(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.user.id !== data.userId),
      }));
    });

    webSocket.on('chat-message', (data) => {
      setRoomState(prev => ({
        ...prev,
        messages: [...prev.messages, data.message],
      }));
    });

    webSocket.on('file-uploaded', (data) => {
      setRoomState(prev => ({
        ...prev,
        files: [data.file, ...prev.files],
      }));
      
      toast({
        title: "File uploaded",
        description: `${data.file.user.displayName} shared ${data.file.originalName}`,
      });
    });

    webSocket.on('whiteboard-stroke', (data) => {
      setRoomState(prev => ({
        ...prev,
        whiteboardStrokes: [...prev.whiteboardStrokes, data.stroke],
      }));
    });

    webSocket.on('whiteboard-cleared', () => {
      setRoomState(prev => ({
        ...prev,
        whiteboardStrokes: [],
      }));
    });

    webSocket.on('webrtc-signal', (data) => {
      webRTC.handleSignal(data.signal, data.from);
    });

    return () => {
      webSocket.off('participants-list');
      webSocket.off('participant-joined');
      webSocket.off('participant-left');
      webSocket.off('chat-message');
      webSocket.off('file-uploaded');
      webSocket.off('whiteboard-stroke');
      webSocket.off('whiteboard-cleared');
      webSocket.off('webrtc-signal');
    };
  }, [webSocket.isConnected, user, webRTC, toast]);

  // Connect to WebSocket when room is ready
  useEffect(() => {
    if (currentRoomId && user?.user && !webSocket.isConnected) {
      webSocket.connect();
      webSocket.send({
        type: 'join',
        roomId: currentRoomId,
        userId: user.user.id,
      });
    }
  }, [currentRoomId, user, webSocket]);

  // Initialize WebRTC media
  useEffect(() => {
    if (currentRoomId && !webRTC.isInitialized) {
      webRTC.initializeMedia().catch(console.error);
    }
  }, [currentRoomId, webRTC]);

  // Session duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (content: string) => {
    if (currentRoomId && user?.user) {
      webSocket.send({
        type: 'chat-message',
        content,
      });
    }
  };

  const handleWhiteboardStroke = (strokeData: any) => {
    if (currentRoomId && user?.user) {
      webSocket.send({
        type: 'whiteboard-stroke',
        strokeData,
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!currentRoomId) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await apiRequest("POST", `/api/rooms/${currentRoomId}/files`, formData);
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${currentRoomId}/files`] });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  if (!user?.user || !currentRoomId || !roomState.room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user.user}
        room={roomState.room}
        sessionDuration={formatDuration(sessionDuration)}
      />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen max-h-[calc(100vh-120px)]">
            
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <ParticipantsPanel 
                participants={roomState.participants}
                currentUserId={user.user.id}
              />
              <ChatPanel
                messages={roomState.messages}
                currentUser={user.user}
                onSendMessage={handleSendMessage}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              <VideoCallInterface
                localVideoRef={webRTC.localVideoRef}
                mediaState={webRTC.mediaState}
                participants={roomState.participants}
                currentUser={user.user}
              />
              <ControlPanel
                mediaState={webRTC.mediaState}
                onToggleAudio={webRTC.toggleAudio}
                onToggleVideo={webRTC.toggleVideo}
                onToggleScreenShare={() => {
                  if (webRTC.mediaState.screenShare) {
                    webRTC.stopScreenShare();
                  } else {
                    webRTC.startScreenShare();
                  }
                }}
                onEndCall={() => {
                  if (confirm('Are you sure you want to leave the meeting?')) {
                    webSocket.disconnect();
                    webRTC.cleanup();
                    window.location.reload();
                  }
                }}
              />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <WhiteboardPanel
                strokes={roomState.whiteboardStrokes}
                onStroke={handleWhiteboardStroke}
                roomId={currentRoomId}
              />
              <FileSharePanel
                files={roomState.files}
                onFileUpload={handleFileUpload}
              />
            </div>
          </div>
        </div>
      </div>

      <ConnectionStatus
        isConnected={webSocket.isConnected}
        connectionQuality={webSocket.connectionQuality}
        latency={webSocket.latency}
      />
      
      <Footer />
    </div>
  );
}
