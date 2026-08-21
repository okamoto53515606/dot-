import { NextResponse } from 'next/server';
import { generatePixelArtData } from '@/ai/flows/generate-pixel-art-data';

/**
 * @swagger
 * /api/generate:
 *   post:
 *     summary: Generates pixel art data based on a user prompt.
 *     description: This endpoint receives a user's prompt, invokes Gemini via @google/genai to generate pixel art, and returns the generated data including a pixel map, color palette, and SVG string.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The user's instruction for the pixel art design (e.g., 'a cat wearing sunglasses').
 *               movement:
 *                 type: string
 *                 description: The movement pattern for the pixel art (e.g., 'move up and down').
 *     responses:
 *       200:
 *         description: Successfully generated pixel art data.
 *       400:
 *         description: Invalid input provided by the user.
 *       500:
 *         description: Internal server error with detailed error information.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Gemini 呼び出し。入力スキーマの検証は generatePixelArtData 内で行う。
    const result = await generatePixelArtData(body);

    // 成功した結果を返します。
    return NextResponse.json(result);

  } catch (e: any) {
    // エラー発生時は、詳細な情報をログに出力します。
    console.error('[API /api/generate] Error:', e);

    const status = e.message?.includes('Invalid input') || e.message?.includes('Schema validation failed') ? 400 : 500;

    //【ご要望の修正】
    // フロントエンドでのデバッグを容易にするため、エラーオブジェクトの
    // message, stack, details を含む詳細な情報をレスポンスとして返します。
    return NextResponse.json(
      {
        error: {
          message: e.message || 'An unknown error occurred.',
          stack: e.stack,
          details: e.details, // ZodErrorなどの詳細情報が含まれる場合があります
        },
      },
      { status }
    );
  }
}
