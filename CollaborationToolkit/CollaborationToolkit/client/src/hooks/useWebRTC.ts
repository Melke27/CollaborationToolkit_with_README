import { useRef, useState, useCallback } from 'react';
import type { MediaState } from '@/types';

interface UseWebRTCProps {
  onRemoteStream?: (stream: MediaStream, userId: number) => void;
  onSignal?: (signal: any, targetUserId: number) => void;
}

export function useWebRTC({ onRemoteStream, onSignal }: UseWebRTCProps = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaState, setMediaState] = useState<MediaState>({
    audio: true,
    video: true,
    screenShare: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());
  const remoteStreams = useRef<Map<number, MediaStream>>(new Map());
  
  const pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsInitialized(true);
      return stream;
    } catch (error) {
      console.error('Failed to initialize media:', error);
      throw error;
    }
  }, []);

  const createPeerConnection = useCallback((userId: number) => {
    const pc = new RTCPeerConnection(pcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && onSignal) {
        onSignal({
          type: 'ice-candidate',
          candidate: event.candidate,
        }, userId);
      }
    };
    
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      remoteStreams.current.set(userId, remoteStream);
      if (onRemoteStream) {
        onRemoteStream(remoteStream, userId);
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`Peer connection state (${userId}):`, pc.connectionState);
    };
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }
    
    peerConnections.current.set(userId, pc);
    return pc;
  }, [localStream, onRemoteStream, onSignal]);

  const createOffer = useCallback(async (userId: number) => {
    const pc = createPeerConnection(userId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (onSignal) {
        onSignal({
          type: 'offer',
          offer: offer,
        }, userId);
      }
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }, [createPeerConnection, onSignal]);

  const handleSignal = useCallback(async (signal: any, fromUserId: number) => {
    let pc = peerConnections.current.get(fromUserId);
    
    if (!pc) {
      pc = createPeerConnection(fromUserId);
    }
    
    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(signal.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (onSignal) {
          onSignal({
            type: 'answer',
            answer: answer,
          }, fromUserId);
        }
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(signal.answer);
      } else if (signal.type === 'ice-candidate') {
        await pc.addIceCandidate(signal.candidate);
      }
    } catch (error) {
      console.error('Failed to handle WebRTC signal:', error);
    }
  }, [createPeerConnection, onSignal]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMediaState(prev => ({ ...prev, audio: audioTracks[0]?.enabled || false }));
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setMediaState(prev => ({ ...prev, video: videoTracks[0]?.enabled || false }));
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      peerConnections.current.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });
      
      // Update local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      
      videoTrack.onended = () => {
        stopScreenShare();
      };
      
      setMediaState(prev => ({ ...prev, screenShare: true }));
    } catch (error) {
      console.error('Failed to start screen share:', error);
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      
      // Replace screen share track with camera track in all peer connections
      peerConnections.current.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      });
      
      // Restore local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      
      setMediaState(prev => ({ ...prev, screenShare: false }));
    }
  }, [localStream]);

  const cleanup = useCallback(() => {
    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    remoteStreams.current.clear();
    setLocalStream(null);
    setIsInitialized(false);
  }, [localStream]);

  return {
    localStream,
    mediaState,
    isInitialized,
    localVideoRef,
    initializeMedia,
    createOffer,
    handleSignal,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    cleanup,
  };
}
