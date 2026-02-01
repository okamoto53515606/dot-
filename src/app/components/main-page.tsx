'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import GeneratorForm from '@/app/components/generator-form';
import CodeOutput from '@/app/components/code-output';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import type { PixelArtData, MovementPattern, PixelArtInput } from '@/lib/types';
import { getFullJsCode } from '@/lib/code-templates';

// PixelArtDataの初期状態を定義
const defaultPixelArtData: PixelArtData = {
  pixelMap: [],
  palette: [],
  description: '',
  svgString: '',
};

export default function MainPage() {
  const [pixelArtData, setPixelArtData] = useState<PixelArtData>(defaultPixelArtData);
  const [isLoading, setIsLoading] = useState(false);
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('walking');
  const { toast } = useToast();

  useEffect(() => {
    // If there's no data, remove any existing animation and do nothing else.
    const canvasElement = document.getElementById('pixel-art-animation-from-script');
    if (canvasElement) {
      canvasElement.remove();
    }
    const injectorScript = document.getElementById('dynamic-pixel-art-script');
    if (injectorScript) {
      injectorScript.remove();
    }
    if (!pixelArtData || pixelArtData.pixelMap.length === 0) {
      return;
    }
  
    // Get the code. The code itself handles removing previous canvases.
    const scriptTagString = getFullJsCode(pixelArtData, movementPattern);
    const scriptContent = scriptTagString.replace(/<script>|<\/script>/g, '');
  
    // Create and append the new injector script
    const newScript = document.createElement('script');
    newScript.id = 'dynamic-pixel-art-script';
    newScript.textContent = scriptContent;
    document.body.appendChild(newScript);
  
    // Return a cleanup function to run when the component unmounts
    return () => {
      const injector = document.getElementById('dynamic-pixel-art-script');
      if (injector) {
        injector.remove();
      }
      const canvas = document.getElementById('pixel-art-animation-from-script');
      if (canvas) {
        canvas.remove();
      }
    };
  }, [pixelArtData, movementPattern]);

  const handleGenerate = async (data: PixelArtInput) => {
    setIsLoading(true);
    setPixelArtData(defaultPixelArtData); // This will trigger the cleanup in useEffect

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
      <header className="pt-6 px-4 md:px-6">
        <div className="container mx-auto">
          <h1 className="font-pixel text-3xl md:text-4xl tracking-tighter text-accent">ドット絵アニメジェネレータ</h1>
          <p className="text-muted-foreground mt-2">
            あなたの考えたキャラクターがドット絵アニメになります。WEBサイト内でドット絵をアニメーションさせるためのJavascriptコードやリンクタグも生成します。
          </p>
        </div>
      </header>

      <main className="container mx-auto pt-4 px-4 md:px-6">
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
              <CodeOutput data={pixelArtData} movementPattern={movementPattern} />
            ) : (
              <Card className="flex items-center justify-center text-center min-h-[400px]">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">フォームに入力して「ドット絵を生成」ボタンを押すと、<br />ここにコードが表示されます。</p>
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
