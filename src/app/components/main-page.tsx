'use client';

import { useState } from 'react';
import GeneratorForm from '@/app/components/generator-form';
import CodeOutput from '@/app/components/code-output';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import type { PixelArtData, MovementPattern } from '@/lib/types';
import type { PixelArtInput } from '@/ai/flows';

// PixelArtDataの初期状態を定義
const defaultPixelArtData: PixelArtData = {
  pixelMap: [],
  palette: [],
  description: '',
  svgString: '', // svgStringを初期化
};

export default function MainPage() {
  const [pixelArtData, setPixelArtData] = useState<PixelArtData>(defaultPixelArtData);
  const [isLoading, setIsLoading] = useState(false);
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('walking');
  const { toast } = useToast();

  const handleGenerate = async (data: PixelArtInput) => {
    setIsLoading(true);
    setPixelArtData(defaultPixelArtData); // 生成中は一度リセット

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // APIからのエラーレスポンスをテキストとして取得
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`生成に失敗しました。サーバーがエラーを返しました。`);
      }

      const result: PixelArtData = await response.json();
      setPixelArtData(result);

      // トースト通知にAIが生成したdescriptionを表示
      toast({
        title: '生成が完了しました！',
        description: result.description, 
      });

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      toast({
        variant: 'destructive',
        title: 'エラー',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-6 px-4 md:px-6 border-b">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">AIドット絵アニメジェネレーター</h1>
          <p className="text-muted-foreground mt-2">
            あなたの考えたキャラクターがドット絵アニメになります。WEBサイト内でドット絵をアニメーションさせるためのJavascriptコードやリンクタグも生成します。
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8 md:py-12 px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            <GeneratorForm 
              onGenerate={handleGenerate} 
              isLoading={isLoading} 
              onMovementChange={setMovementPattern} 
            />
          </div>
          {/* pixelMapが存在し、かつ要素が1つ以上ある場合にのみCodeOutputを表示 */}
          {pixelArtData.pixelMap && pixelArtData.pixelMap.length > 0 && (
            <CodeOutput data={pixelArtData} movementPattern={movementPattern} />
          )}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
