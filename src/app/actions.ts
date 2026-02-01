'use server';

import { generatePixelArtData } from '@/ai/flows';
import type { PixelArtInput, PixelArtOutput } from '@/ai/flows';

interface ActionResult {
  data?: PixelArtOutput;
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
