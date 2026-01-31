import type { PixelArtOutput as GenkitPixelArtOutput } from '@/ai/flows/generate-pixel-art-data';

export type PixelArtData = GenkitPixelArtOutput;

export const movementPatterns = ['none', 'idle', 'walking', 'jumping'] as const;
export type MovementPattern = (typeof movementPatterns)[number];

export const colorTones = ['vibrant', 'pastel', 'dark', 'monochrome', 'earthy'] as const;
export type ColorTone = (typeof colorTones)[number];
