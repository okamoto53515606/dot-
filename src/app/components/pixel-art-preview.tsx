'use client';

import { useEffect, useRef } from 'react';
import type { PixelArtData, MovementPattern } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type PixelArtPreviewProps = {
  data: PixelArtData | null;
  movementPattern: MovementPattern;
  isLoading: boolean;
};

const GRID_SIZE = 16;
const PIXEL_SIZE = 16;

export default function PixelArtPreview({ data, movementPattern, isLoading }: PixelArtPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.imageSmoothingEnabled = false;
    const { pixelMap, palette } = data;
    let frame = 0;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      let xOffset = 0;
      let yOffset = 0;

      switch (movementPattern) {
        case 'walking':
          xOffset = Math.floor(frame / 4) % GRID_SIZE;
          break;
        case 'idle':
          yOffset = Math.sin(frame * 0.05) * 2;
          break;
        case 'jumping':
          yOffset = Math.abs(Math.sin(frame * 0.07)) * (-GRID_SIZE / 2);
          break;
      }

      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const colIndex = (x + xOffset) % GRID_SIZE;
          const colorId = pixelMap[y][colIndex];
          if (palette[colorId] && colorId !== 0) {
            context.fillStyle = palette[colorId];
            context.fillRect(x * PIXEL_SIZE, (y * PIXEL_SIZE) + yOffset, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
      }
    };

    const animate = () => {
      frame++;
      draw();
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [data, movementPattern]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full max-w-[256px] mx-auto rounded-lg" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="aspect-square w-full max-w-[256px] mx-auto rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-center p-4">
        <p>Your generated animation will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * PIXEL_SIZE}
        height={GRID_SIZE * PIXEL_SIZE}
        className="rounded-lg border bg-card shadow-sm"
        style={{ imageRendering: 'pixelated', width: '256px', height: '256px' }}
      />
      <p className="text-center text-sm text-muted-foreground italic">&quot;{data.description}&quot;</p>
    </div>
  );
}
