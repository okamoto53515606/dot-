'use server';

import { generatePixelArtData, suggestPixelArtIdeas } from '@/ai/flows';
import type { PixelArtInput } from '@/ai/flows';
import type { PixelArtData } from '@/lib/types';

interface ActionResult {
  data?: PixelArtData;
  error?: string;
}

export async function handleGenerate(input: PixelArtInput): Promise<ActionResult> {
  try {
    const result = await generatePixelArtData(input);

    // Ensure pixelMap is a 16x16 grid, padding if necessary
    const pixelMap = Array.from({ length: 16 }, (_, i) =>
      result.pixelMap[i] || Array(16).fill(0)
    ).map(row => 
      (row.length >= 16) ? row.slice(0, 16) : [...row, ...Array(16 - row.length).fill(0)]
    );

    // Ensure palette has a fallback for color ID 0 (transparent)
    if (!result.palette[0]) {
      result.palette[0] = 'transparent';
    }

    return { data: { ...result, pixelMap } };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'An unknown error occurred.' };
  }
}

interface SuggestionResult {
  suggestion?: string;
  error?: string;
}

export async function handleSuggest(): Promise<SuggestionResult> {
  try {
    const result = await suggestPixelArtIdeas();
    return { suggestion: result.suggestion };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'Failed to get a suggestion.' };
  }
}
