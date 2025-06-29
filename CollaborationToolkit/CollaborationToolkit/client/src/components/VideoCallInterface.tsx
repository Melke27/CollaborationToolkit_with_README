import { useRef, useEffect } from "react";
import { Monitor } from "lucide-react";
import type { Participant, MediaState } from "@/types";
import type { User } from "@shared/schema";
import melkamuProfile from "@/assets/melkamu-profile.jpg";

interface VideoCallInterfaceProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  mediaState: MediaState;
  participants: Participant[];
  currentUser: User;
}

export default function VideoCallInterface({ 
  localVideoRef, 
  mediaState, 
  participants, 
  currentUser 
}: VideoCallInterfaceProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: number) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-500'
    ];
    return colors[userId % colors.length];
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-200 h-2/3 relative overflow-hidden">
      {/* Recording Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full recording-indicator"></div>
          <span>Recording</span>
        </div>
      </div>
      
      {/* Main Video Stream */}
      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative video-container">
        {mediaState.screenShare ? (
          // Screen sharing view
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-center">
              <Monitor className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg">Screen sharing active</p>
            </div>
          </div>
        ) : (
          // Main video or placeholder
          <div className="w-full h-full relative">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="video-element"
            />
            {!mediaState.video && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <img 
                  src={melkamuProfile} 
                  alt="Melkamu Wako"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white"
                />
              </div>
            )}
          </div>
        )}
        
        {/* Screen Share Indicator */}
        {mediaState.screenShare && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
            <Monitor className="h-4 w-4 text-blue-400" />
            <span className="text-sm">You are sharing screen</span>
          </div>
        )}
      </div>

      {/* Participant Video Thumbnails */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        {participants
          .filter(p => p.user.id !== currentUser.id)
          .slice(0, 4)
          .map((participant) => (
            <div 
              key={participant.user.id}
              className={`w-24 h-18 bg-gray-800 rounded-lg overflow-hidden border-2 participant-video ${
                participant.mediaState.audio ? 'border-accent' : 'border-transparent'
              }`}
            >
              {participant.mediaState.video ? (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <div className={`w-8 h-8 ${getAvatarColor(participant.user.id)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-xs font-medium">
                      {getInitials(participant.user.displayName)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className={`w-8 h-8 ${getAvatarColor(participant.user.id)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-xs font-medium">
                      {getInitials(participant.user.displayName)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
