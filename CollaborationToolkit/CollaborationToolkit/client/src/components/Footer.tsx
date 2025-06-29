import { Camera } from "lucide-react";

export default function Footer() {
  return (
    <footer className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
        <div className="flex items-center space-x-2 text-xs">
          <Camera className="h-3 w-3" />
          <span>Photo by Melkamu Wako</span>
        </div>
      </div>
    </footer>
  );
}