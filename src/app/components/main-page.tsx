'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import GeneratorForm from '@/app/components/generator-form';
import CodeOutput from '@/app/components/code-output';
import AnimationPreview from '@/app/components/animation-preview';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PixelArtData, MovementPattern, PixelArtInput } from '@/lib/types';

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
        let errorMessage;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('API Error (JSON):', errorData);
            errorMessage = errorData.error?.message || `An unexpected JSON error occurred. Status: ${response.status}`;
        } else {
            const errorText = await response.text();
            console.error('API Error (HTML/Text):', errorText);
            errorMessage = errorText;
        }
        throw new Error(errorMessage);
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
        description: (
           <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words">{errorMessage}</pre>
        ),
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
          <div className="space-y-8">
            {isLoading ? (
              <Card className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </Card>
            ) : pixelArtData.pixelMap && pixelArtData.pixelMap.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>アニメーションプレビュー</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnimationPreview data={pixelArtData} movementPattern={movementPattern} />
                  </CardContent>
                </Card>
                <CodeOutput data={pixelArtData} movementPattern={movementPattern} />
              </>
            ) : (
              <Card className="flex items-center justify-center text-center min-h-[400px]">
                <CardContent>
                  <p className="text-muted-foreground">フォームに入力して「ドット絵を生成」ボタンを押すと、<br />ここにプレビューが表示されます。</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
