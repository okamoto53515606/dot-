import { createApiV1Handler } from '@genkit-ai/next';
import { pixelArtGenerator } from '@/ai/flows/generate-pixel-art-data';

// /api/generate へのリクエストを、指定したGenkitフローに接続する
export const { POST } = createApiV1Handler({ 
  flows: [pixelArtGenerator] 
});
