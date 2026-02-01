'use server';

import { generatePixelArtData } from '@/ai/flows';
import type { PixelArtInput, PixelArtData } from '@/lib/types';

interface ActionResult {
  data?: PixelArtData;
  error?: string;
}

export async function handleGenerate(input: PixelArtInput): Promise<ActionResult> {
  try {
    const result = await generatePixelArtData(input);
    return { data: result };
  } catch (e) {
    console.error(e);
    return { error: e instanceof Error ? e.message : 'An unknown error occurred.' };
  }
}
