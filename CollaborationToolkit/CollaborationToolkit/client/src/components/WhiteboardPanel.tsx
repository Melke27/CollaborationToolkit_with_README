import { useRef, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Pen, Eraser, Square, Type, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WhiteboardStroke } from "@shared/schema";
import type { DrawingTool, DrawingPoint } from "@/types";

interface WhiteboardPanelProps {
  strokes: WhiteboardStroke[];
  onStroke: (strokeData: any) => void;
  roomId: number;
}

export default function WhiteboardPanel({ strokes, onStroke, roomId }: WhiteboardPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    width: 2,
  });
  const [currentStroke, setCurrentStroke] = useState<DrawingPoint[]>([]);
  const queryClient = useQueryClient();

  const clearWhiteboardMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/rooms/${roomId}/whiteboard`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/${roomId}/whiteboard`] });
    },
  });

  const colors = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    strokes.forEach((stroke) => {
      const data = stroke.strokeData as any;
      if (data.points && data.points.length > 0) {
        drawStroke(ctx, data.points, data);
      }
    });
  }, [strokes]);

  const drawStroke = (ctx: CanvasRenderingContext2D, points: DrawingPoint[], tool: any) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = tool.color || '#000000';
    ctx.lineWidth = tool.width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = tool.width * 2 || 10;
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  };

  const getPointFromEvent = (e: React.MouseEvent | React.TouchEvent): DrawingPoint => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number;
    let clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const point = getPointFromEvent(e);
    setCurrentStroke([point]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const point = getPointFromEvent(e);
    const newStroke = [...currentStroke, point];
    setCurrentStroke(newStroke);

    // Draw current stroke in real-time
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx && newStroke.length > 1) {
        drawStroke(ctx, newStroke, currentTool);
      }
    }
  };

  const handleEnd = () => {
    if (!isDrawing || currentStroke.length < 2) {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    setIsDrawing(false);
    
    // Send stroke to server
    const strokeData = {
      points: currentStroke,
      tool: currentTool,
      timestamp: Date.now(),
    };
    
    onStroke(strokeData);
    setCurrentStroke([]);
  };

  const handleClearWhiteboard = () => {
    if (confirm('Are you sure you want to clear the whiteboard?')) {
      clearWhiteboardMutation.mutate();
    }
  };

  const handleSaveWhiteboard = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'whiteboard.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-gray-200 h-1/2">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Whiteboard</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearWhiteboard}
              disabled={clearWhiteboardMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveWhiteboard}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Drawing Tools */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <Button
            variant={currentTool.type === 'pen' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentTool(prev => ({ ...prev, type: 'pen' }))}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool.type === 'eraser' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentTool(prev => ({ ...prev, type: 'eraser' }))}
          >
            <Eraser className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool.type === 'shape' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentTool(prev => ({ ...prev, type: 'shape' }))}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool.type === 'text' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentTool(prev => ({ ...prev, type: 'text' }))}
          >
            <Type className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Color Picker */}
        <div className="flex items-center space-x-1">
          {colors.map((color) => (
            <button
              key={color}
              className={`w-6 h-6 rounded border-2 cursor-pointer ${
                currentTool.color === color ? 'border-primary' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentTool(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative h-48 p-3">
        <canvas
          ref={canvasRef}
          className="w-full h-full bg-gray-50 rounded border-2 border-dashed border-gray-300 whiteboard-canvas"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-500">
              <Pen className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">Start drawing or writing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
