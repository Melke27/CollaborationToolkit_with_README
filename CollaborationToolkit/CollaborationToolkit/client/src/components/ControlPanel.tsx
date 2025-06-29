import { Mic, MicOff, Video, VideoOff, Monitor, Square, Settings, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaState } from "@/types";

interface ControlPanelProps {
  mediaState: MediaState;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export default function ControlPanel({
  mediaState,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
}: ControlPanelProps) {
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-center space-x-4">
        {/* Microphone Control */}
        <Button
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full ${
            mediaState.audio 
              ? 'bg-accent hover:bg-green-600 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {mediaState.audio ? (
            <Mic className="h-5 w-5" />
          ) : (
            <MicOff className="h-5 w-5" />
          )}
        </Button>

        {/* Video Control */}
        <Button
          onClick={onToggleVideo}
          className={`w-12 h-12 rounded-full ${
            mediaState.video 
              ? 'bg-accent hover:bg-green-600 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {mediaState.video ? (
            <Video className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </Button>

        {/* Screen Share */}
        <Button
          onClick={onToggleScreenShare}
          className={`w-12 h-12 rounded-full ${
            mediaState.screenShare 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {mediaState.screenShare ? (
            <Square className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
          )}
        </Button>

        {/* Record */}
        <Button
          className="w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600"
        >
          <div className="w-3 h-3 bg-white rounded-full recording-indicator"></div>
        </Button>

        {/* Settings */}
        <Button
          className="w-12 h-12 bg-gray-500 text-white rounded-full hover:bg-gray-600"
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* End Call */}
        <Button
          onClick={onEndCall}
          className="w-12 h-12 bg-red-600 text-white rounded-full hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
