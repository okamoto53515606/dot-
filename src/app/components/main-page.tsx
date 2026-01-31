'use client';

import { useState } from 'react';
import type { PixelArtInput } from '@/ai/flows';
import type { PixelArtData, MovementPattern } from '@/lib/types';
import { handleGenerate, handleSuggest } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import GeneratorForm from './generator-form';
import PixelArtPreview from './pixel-art-preview';
import CodeOutput from './code-output';
import { Card, CardContent } from '@/components/ui/card';

export default function MainPage() {
  const [generatedData, setGeneratedData] = useState<PixelArtData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [movementPattern, setMovementPattern] = useState<MovementPattern>('idle');
  const { toast } = useToast();

  const onGenerate = async (data: PixelArtInput) => {
    setIsLoading(true);
    setGeneratedData(null);
    setMovementPattern(data.movementPattern as MovementPattern);

    const result = await handleGenerate(data);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: result.error,
      });
    } else if (result.data) {
      setGeneratedData(result.data);
      toast({
        title: 'Generation Complete!',
        description: result.data.description,
      });
    }
  };

  const onSuggest = async () => {
    const result = await handleSuggest();
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: result.error,
      });
      return '';
    }
    return result.suggestion || '';
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
          ドット絵アニメジェネレータ
        </h1>
        <p className="text-muted-foreground md:text-lg">Pixel Art Animation Generator</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2">
          <GeneratorForm onGenerate={onGenerate} onSuggest={onSuggest} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardContent className="p-6">
              <PixelArtPreview
                data={generatedData}
                movementPattern={movementPattern}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
          {generatedData && (
            <CodeOutput
              data={generatedData}
              movementPattern={movementPattern}
            />
          )}
        </div>
      </div>
       <footer className="text-center mt-12 text-sm text-muted-foreground">
        <p>Powered by Google's Generative AI</p>
      </footer>
    </main>
  );
}
