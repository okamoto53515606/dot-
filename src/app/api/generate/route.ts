import { NextResponse } from 'next/server';
import { generatePixelArtData } from '@/ai/flows/generate-pixel-art-data';
import type { PixelArtInput } from '@/ai/flows';

// POSTリクエストを処理するAPIルート
export async function POST(request: Request) {
  try {
    // リクエストボディから、ユーザーが入力したプロンプトなどを取得
    const body: PixelArtInput = await request.json();

    // AIを呼び出してドット絵データを生成
    const pixelArtData = await generatePixelArtData(body);

    // 生成されたデータをJSON形式でクライアントに返す
    return NextResponse.json(pixelArtData);
  } catch (error) {
    console.error('API Error:', error);
    // エラーが発生した場合は、サーバーエラーとして返す
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
