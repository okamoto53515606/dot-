import { createApiV1Handler } from '@genkit-ai/next';
import { pixelArtGenerator } from '@/ai/flows/generate-pixel-art-data';

/**
 * GenkitのフローをNext.jsのAPIルートとして公開するためのハンドラを生成します。
 * 
 * createApiV1Handlerは、指定されたGenkitのフロー（この場合はpixelArtGenerator）を
 * HTTPリクエスト経由で実行できるようにするためのAPIエンドポイントを作成します。
 * これにより、フロントエンドから `/api/generate` へPOSTリクエストを送信するだけで、
 * 安全かつ簡単にGenkitのフローを呼び出すことができます。
 *
 * 生成されるのは、Next.jsのRoute Handler（この場合はPOST）です。
 */
export const { POST } = createApiV1Handler({ 
  // ここで公開したいGenkitフローのリストを渡します。
  flows: [pixelArtGenerator] 
});
