'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest pixel art character motifs.
 *
 * The flow `suggestPixelArtIdeas` takes no input and returns a suggestion for a pixel art character motif.
 * - `suggestPixelArtIdeas`: An exported function that calls the Genkit flow.
 * - `SuggestPixelArtIdeasOutput`: The output type for the `suggestPixelArtIdeas` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPixelArtIdeasOutputSchema = z.object({
  suggestion: z
    .string()
    .describe(
      'A creative suggestion for a pixel art character motif, such as a specific animal, object, or fantasy creature.'
    ),
});
export type SuggestPixelArtIdeasOutput = z.infer<typeof SuggestPixelArtIdeasOutputSchema>;

export async function suggestPixelArtIdeas(): Promise<SuggestPixelArtIdeasOutput> {
  return suggestPixelArtIdeasFlow({});
}

const prompt = ai.definePrompt({
  name: 'suggestPixelArtIdeasPrompt',
  output: {schema: SuggestPixelArtIdeasOutputSchema},
  prompt: `You are a creative assistant helping users generate pixel art.

  Suggest a unique and interesting character motif for pixel art. The suggestion should be specific, such as "a robotic frog", "a steampunk butterfly", or "a crystal golem". The user is looking for inspiration.

  Return ONLY the character motif suggestion. Do not include any additional text or explanation.
  `,
});

const suggestPixelArtIdeasFlow = ai.defineFlow(
  {
    name: 'suggestPixelArtIdeasFlow',
    inputSchema: z.object({}),
    outputSchema: SuggestPixelArtIdeasOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
