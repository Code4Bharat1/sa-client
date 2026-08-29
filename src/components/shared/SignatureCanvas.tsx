'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SignatureCanvasProps {
  value?: string | null;
  onSignatureChange?: (dataUrl: string | null) => void;
  height?: number;
}

export function SignatureCanvas({ value, onSignatureChange, height = 180 }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize canvas context style (Sharp Midnight Blue document ink)
  const applyContextStyle = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0D1A4B'; // Sharp dark blue/navy ink for high contrast
  }, []);

  const notifyChange = useCallback((emptyState: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (emptyState) {
      onSignatureChange?.(null);
    } else {
      onSignatureChange?.(canvas.toDataURL('image/png'));
    }
  }, [onSignatureChange]);

  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    applyContextStyle(ctx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1); // Draw a dot for single tap
    ctx.stroke();
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    applyContextStyle(ctx);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (isEmpty) {
      setIsEmpty(false);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      notifyChange(isEmpty);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
  };

  // Touch Handlers for Mobile & Tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.touches[0];
      startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.touches[0];
      draw(touch.clientX - rect.left, touch.clientY - rect.top);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setIsEmpty(true);
    onSignatureChange?.(null);
  };

  // Reset canvas if external value prop becomes null or empty
  useEffect(() => {
    if (!value) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      setIsEmpty(true);
    }
  }, [value]);

  // Handle responsive canvas sizing on window/container resize
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        const newWidth = container.clientWidth || 300;
        if (canvas.width !== newWidth) {
          // Save existing content before resize
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx && !isEmpty) {
            tempCtx.drawImage(canvas, 0, 0);
          }

          canvas.width = newWidth;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            applyContextStyle(ctx);
            if (!isEmpty) {
              ctx.drawImage(tempCanvas, 0, 0);
            }
          }
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [height, isEmpty, applyContextStyle]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl bg-white overflow-hidden shadow-inner cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
          className="w-full block touch-none bg-white"
          style={{ touchAction: 'none' }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 text-xs sm:text-sm font-medium px-4 text-center select-none">
            <span className="text-slate-600 font-semibold mb-0.5">✍️ Draw client digital signature</span>
            <span className="text-[11px] text-slate-400">Sign using finger (touch) or mouse</span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center text-xs text-slate-500 px-1">
        <span className={isEmpty ? 'text-slate-400' : 'text-emerald-600 font-medium flex items-center gap-1'}>
          {isEmpty ? 'Signature required' : '✓ Signature captured'}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="h-7 text-xs flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Clear Signature
        </Button>
      </div>
    </div>
  );
}
