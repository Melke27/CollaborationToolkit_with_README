import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import type { Participant } from "@/types";

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId: number;
}

export default function ParticipantsPanel({ participants, currentUserId }: ParticipantsPanelProps) {
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
    <div className="bg-surface rounded-xl shadow-sm border border-gray-200 h-1/2">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Participants</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {participants.length}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto max-h-64 scrollbar-thin">
        {participants.map((participant) => (
          <div key={participant.user.id} className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-10 h-10 ${getAvatarColor(participant.user.id)} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">
                  {getInitials(participant.user.displayName)}
                </span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${participant.isActive ? 'bg-accent' : 'bg-gray-400'} rounded-full border-2 border-white`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {participant.user.displayName}
                {participant.user.id === currentUserId && ' (You)'}
              </p>
              <div className="flex items-center space-x-2">
                {participant.mediaState.audio ? (
                  <Mic className="h-3 w-3 text-accent" />
                ) : (
                  <MicOff className="h-3 w-3 text-red-500" />
                )}
                {participant.mediaState.video ? (
                  <Video className="h-3 w-3 text-accent" />
                ) : (
                  <VideoOff className="h-3 w-3 text-red-500" />
                )}
                {!participant.isActive && (
                  <span className="text-xs text-gray-500">Away</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {participants.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">No participants yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
