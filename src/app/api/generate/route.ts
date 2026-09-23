import { NextResponse } from 'next/server';
import { generatePixelArtData } from '@/ai/flows/generate-pixel-art-data';
import { ModerationBlockedError, isModerationBlockedError } from '@/lib/moderation';

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
/**
 * 捕捉した値（unknown）からレスポンス表示用の情報を安全に取り出す。
 * Error / ZodError 以外が throw されても例外を投げない。
 */
function toErrorInfo(error: unknown): { message?: string; stack?: string; details?: unknown } {
  if (typeof error !== 'object' || error === null) {
    return {};
  }
  const { message, stack, details } = error as {
    message?: unknown;
    stack?: unknown;
    details?: unknown;
  };
  return {
    message: typeof message === 'string' ? message : undefined,
    stack: typeof stack === 'string' ? stack : undefined,
    details,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Gemini 呼び出し。入力スキーマの検証は generatePixelArtData 内で行う。
    const result = await generatePixelArtData(body);

    // 成功した結果を返します。
    return NextResponse.json(result);

  } catch (e: unknown) {
    // エラー発生時は、詳細な情報をログに出力します。
    console.error('[API /api/generate] Error:', e);

    // 入力モデレーションによるブロックは、利用者側の入力の問題なので 400 を返します。
    const blocked = isModerationBlockedError(e);
    const { message, stack, details } = toErrorInfo(e);

    const status = blocked || message?.includes('Invalid input') || message?.includes('Schema validation failed') ? 400 : 500;

    //【ご要望の修正】
    // フロントエンドでのデバッグを容易にするため、エラーオブジェクトの
    // message, stack, details を含む詳細な情報をレスポンスとして返します。
    return NextResponse.json(
      {
        error: {
          code: blocked ? ModerationBlockedError.code : undefined,
          message: message || 'An unknown error occurred.',
          stack,
          details, // ZodErrorなどの詳細情報が含まれる場合があります
        },
      },
      { status }
    );
  }
}
