'use server';

/**
 * @fileOverview Generates pixel art data including pixelMap, palette, and description based on user inputs.
 *
 * - generatePixelArtData - A function that orchestrates the pixel art generation process.
 * - PixelArtInput - The input type for the generatePixelArtData function.
 * - PixelArtOutput - The return type for the generatePixelArtData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PixelArtInputSchema = z.object({
  characterMotif: z
    .string()
    .describe('The main subject or character of the pixel art.'),
  colorTone: z
    .string()
    .describe(
      'The desired color palette or tone for the pixel art (e.g., vibrant, pastel, dark).'     ),
  movementPattern: z
    .string()
    .describe(
      'The animation or movement style of the pixel art (e.g., walking, jumping, idle).'    ),
  additionalFeatures: z
    .string()
    .describe(
      'Any extra details or features to include in the pixel art (e.g., background elements, special effects).'    ),
});

export type PixelArtInput = z.infer<typeof PixelArtInputSchema>;

const PixelArtOutputSchema = z.object({
  pixelMap: z
    .array(z.array(z.number()))
    .describe(
      'A 16x16 array representing the pixel art, with each number corresponding to a color ID in the palette.'    ),
  palette: z
    .record(z.string(), z.string())
    .describe('A mapping of color IDs to HEX color codes.'),
  description: z.string().describe('A brief description of the generated pixel art.'),
});

export type PixelArtOutput = z.infer<typeof PixelArtOutputSchema>;

export async function generatePixelArtData(input: PixelArtInput): Promise<PixelArtOutput> {
  return generatePixelArtDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pixelArtPrompt',
  input: {schema: PixelArtInputSchema},
  output: {schema: PixelArtOutputSchema},
  prompt: `You are a pixel art generator that creates a 16x16 pixel map, a color palette, and a short description based on the user's input.

  Character Motif: {{{characterMotif}}}
  Color Tone: {{{colorTone}}}
  Movement Pattern: {{{movementPattern}}}
  Additional Features: {{{additionalFeatures}}}

  Instructions:
  1.  Generate a 16x16 pixel map (array of array of numbers) representing the pixel art.
  2.  Create a color palette (object/record) mapping color IDs (numbers) to HEX color codes.
  3.  Write a short description of the generated pixel art.
  4. Respond with a JSON object. The pixelMap value should be a two-dimensional array.
`,
});

const generatePixelArtDataFlow = ai.defineFlow(
  {
    name: 'generatePixelArtDataFlow',
    inputSchema: PixelArtInputSchema,
    outputSchema: PixelArtOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
