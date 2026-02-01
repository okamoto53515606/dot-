'use client';

import { useEffect, useRef } from 'react';
import type { PixelArtData, MovementPattern } from '@/lib/types';

type AnimationPreviewProps = {
  data: PixelArtData;
  movementPattern: MovementPattern;
};

const gridSize = 16;
const displaySize = 256; // 256x256 canvas
const pixelSize = displaySize / gridSize; // 16

export default function AnimationPreview({ data, movementPattern }: AnimationPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create an offscreen canvas to hold the static character sprite for performance
    if (!offscreenCanvas.current) {
        offscreenCanvas.current = document.createElement('canvas');
        offscreenCanvas.current.width = gridSize;
        offscreenCanvas.current.height = gridSize;
        const offCtx = offscreenCanvas.current.getContext('2d');
        if (offCtx) {
            offCtx.clearRect(0, 0, gridSize, gridSize);
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    const colorId = data.pixelMap[y]?.[x] ?? 0;
                    if (colorId !== 0 && data.palette[colorId]) {
                        offCtx.fillStyle = data.palette[colorId];
                        offCtx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
    }
    
    const sprite = offscreenCanvas.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || !sprite) return;

    let frame = 0;
    let xPos = (displaySize - (gridSize * pixelSize)) / 2;
    let yPos = (displaySize - (gridSize * pixelSize)) / 2;
    let xDirection = 1;

    const animate = () => {
      ctx.clearRect(0, 0, displaySize, displaySize);
      
      let currentX = xPos;
      let currentY = yPos;
      const characterWidth = gridSize * pixelSize;

      switch (movementPattern) {
        case 'walking':
          xPos += 0.5 * xDirection;
          if (xPos + characterWidth > displaySize || xPos < 0) {
            xDirection *= -1;
          }
          currentX = xPos;
          currentY = yPos + Math.abs(Math.sin(frame * 0.2) * 2); // Bobbing motion
          break;
        case 'jumping':
          currentY = yPos + Math.abs(Math.sin(frame * 0.07)) * 60;
          break;
        case 'idle':
          currentY = yPos + Math.sin(frame * 0.05) * 20;
          break;
      }
      
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, currentX, currentY, characterWidth, characterWidth);

      frame++;
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      // Clear sprite cache when data changes to force a redraw
      offscreenCanvas.current = null;
    };
  }, [data, movementPattern]);

  return (
    <div className="flex justify-center items-center bg-muted/50 rounded-md p-4">
      <canvas
        ref={canvasRef}
        width={displaySize}
        height={displaySize}
        className="border rounded-md bg-white"
        style={{ imageRendering: 'pixelated', width: `${displaySize}px`, height: `${displaySize}px` }}
      />
    </div>
  );
}
