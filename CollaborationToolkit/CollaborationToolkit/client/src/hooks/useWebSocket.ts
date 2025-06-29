import { useEffect, useRef, useState } from 'react';
import type { WebSocketMessage } from '@/types';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  const [latency, setLatency] = useState(0);
  const ws = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());
  const pingInterval = useRef<NodeJS.Timeout>();
  const lastPingTime = useRef<number>(0);

  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Start ping/pong for latency measurement
      pingInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          lastPingTime.current = Date.now();
          send({ type: 'ping', timestamp: lastPingTime.current });
        }
      }, 5000);
    };

    ws.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle pong for latency calculation
        if (message.type === 'pong') {
          const currentLatency = Date.now() - lastPingTime.current;
          setLatency(currentLatency);
          
          // Update connection quality based on latency
          if (currentLatency < 50) setConnectionQuality('excellent');
          else if (currentLatency < 150) setConnectionQuality('good');
          else if (currentLatency < 300) setConnectionQuality('fair');
          else setConnectionQuality('poor');
          
          return;
        }
        
        const handler = messageHandlers.current.get(message.type);
        if (handler) {
          handler(message);
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          connect();
        }
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const disconnect = () => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  };

  const send = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const on = (type: string, handler: (data: any) => void) => {
    messageHandlers.current.set(type, handler);
  };

  const off = (type: string) => {
    messageHandlers.current.delete(type);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionQuality,
    latency,
    connect,
    disconnect,
    send,
    on,
    off,
  };
}
