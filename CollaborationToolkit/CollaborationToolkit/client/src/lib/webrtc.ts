export class WebRTCManager {
  private peerConnections: Map<number, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream, userId: number) => void;
  private onSignalCallback?: (signal: any, targetUserId: number) => void;
  
  private pcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  constructor(
    onRemoteStream?: (stream: MediaStream, userId: number) => void,
    onSignal?: (signal: any, targetUserId: number) => void
  ) {
    this.onRemoteStreamCallback = onRemoteStream;
    this.onSignalCallback = onSignal;
  }

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      // Replace video track in all existing connections
      const videoTrack = screenStream.getVideoTracks()[0];
      this.peerConnections.forEach(async (pc) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      });
      
      return screenStream;
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      throw error;
    }
  }

  createPeerConnection(userId: number): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.pcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onSignalCallback) {
        this.onSignalCallback({
          type: 'ice-candidate',
          candidate: event.candidate,
        }, userId);
      }
    };
    
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(remoteStream, userId);
      }
    };
    
    // Add local stream if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }
    
    this.peerConnections.set(userId, pc);
    return pc;
  }

  async createOffer(userId: number): Promise<void> {
    const pc = this.createPeerConnection(userId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (this.onSignalCallback) {
        this.onSignalCallback({
          type: 'offer',
          offer: offer,
        }, userId);
      }
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  async handleSignal(signal: any, fromUserId: number): Promise<void> {
    let pc = this.peerConnections.get(fromUserId);
    
    if (!pc) {
      pc = this.createPeerConnection(fromUserId);
    }
    
    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(signal.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (this.onSignalCallback) {
          this.onSignalCallback({
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
      console.error('Failed to handle signal:', error);
    }
  }

  toggleAudio(enabled?: boolean): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      const isEnabled = enabled !== undefined ? enabled : !audioTracks[0]?.enabled;
      audioTracks.forEach(track => {
        track.enabled = isEnabled;
      });
      return isEnabled;
    }
    return false;
  }

  toggleVideo(enabled?: boolean): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      const isEnabled = enabled !== undefined ? enabled : !videoTracks[0]?.enabled;
      videoTracks.forEach(track => {
        track.enabled = isEnabled;
      });
      return isEnabled;
    }
    return false;
  }

  cleanup(): void {
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getPeerConnection(userId: number): RTCPeerConnection | undefined {
    return this.peerConnections.get(userId);
  }
}
