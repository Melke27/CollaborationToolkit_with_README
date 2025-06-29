import { Wifi, WifiOff, Lock } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
}

export default function ConnectionStatus({ 
  isConnected, 
  connectionQuality, 
  latency 
}: ConnectionStatusProps) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getQualityText = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  return (
    <>
      {/* Connection Status */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-surface shadow-lg rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-accent rounded-full connection-indicator"></div>
                <span className="text-sm text-gray-600">Connected</span>
                <div className="text-xs text-gray-500">
                  <span className={getQualityColor(connectionQuality)}>
                    {getQualityText(connectionQuality)}
                  </span>
                  {latency > 0 && (
                    <>
                      {' • '}
                      <span>{latency}ms</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Disconnected</span>
                <span className="text-xs text-red-500">Reconnecting...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Security Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-surface shadow-lg rounded-lg p-3 border border-gray-200">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-accent" />
            <span className="text-sm text-gray-600">End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </>
  );
}
