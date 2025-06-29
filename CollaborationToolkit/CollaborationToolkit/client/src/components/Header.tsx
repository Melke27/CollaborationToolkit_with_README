import { Clock, Users, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User, Room } from "@shared/schema";
import melkamuProfile from "@/assets/melkamu-profile.jpg";

interface HeaderProps {
  user: User;
  room: Room;
  sessionDuration: string;
}

export default function Header({ user, room, sessionDuration }: HeaderProps) {
  const userInitials = user.displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-surface shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">CollabSpace</h1>
          </div>

          {/* Room Info */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm text-gray-600">{room.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{sessionDuration}</span>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2 p-2"
              >
                <img 
                  src={melkamuProfile} 
                  alt="Melkamu Wako"
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                />
                <span className="hidden md:block text-sm font-medium text-gray-900">
                  {user.displayName}
                </span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
