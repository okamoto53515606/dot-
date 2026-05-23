'use client';

import { useState, useMemo } from 'react';
import { Copy, Code2, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { MovementPattern, PixelArtData } from '@/lib/types';
import { getFullJsCode, getHtmlEmbedCode } from '@/lib/code-templates';
import { ScrollArea } from '@/components/ui/scroll-area';

type CodeOutputProps = {
  data: PixelArtData;
  movementPattern: MovementPattern;
};

type CopiedState = 'js' | 'embed' | null;

export default function CodeOutput({ data, movementPattern }: CodeOutputProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<CopiedState>(null);

  const previewSvgDataUrl = useMemo(() => {
    if (!data.svgString) return '';
    const base64 = typeof window !== 'undefined' ? window.btoa(data.svgString) : '';
    return `data:image/svg+xml;base64,${base64}`;
  }, [data.svgString]);

  const jsCode = useMemo(() => getFullJsCode(data, movementPattern), [data, movementPattern]);
  const htmlEmbedCode = useMemo(() => getHtmlEmbedCode(data, movementPattern, previewSvgDataUrl), [data, movementPattern, previewSvgDataUrl]);

  const copyToClipboard = (text: string, type: CopiedState) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: 'クリップボードにコピーしました！',
        description: `コードがコピーされました。`,
      });
    }).catch(err => {
      toast({
        variant: 'destructive',
        title: 'コピーに失敗しました',
        description: 'コードをクリップボードにコピーできませんでした。',
      });
    });
  };

  const handleDownloadSvg = () => {
    if (!data.svgString) {
      toast({
        variant: 'destructive',
        title: 'ダウンロード失敗',
        description: 'SVGデータが見つかりません。',
      });
      return;
    }

    const blob = new Blob([data.svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-art.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: 'ダウンロードを開始しました',
      description: 'pixel-art.svg を保存してください。',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>生成したドット絵アニメをWEBサイトに組み込む</CardTitle>
        <CardDescription>コードをコピーして、どこでもアニメーションを使用できます。</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="embed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="js"><Code2 className="mr-2 h-4 w-4" /> JavaScript</TabsTrigger>
            <TabsTrigger value="embed"><Code2 className="mr-2 h-4 w-4" /> HTML埋め込み</TabsTrigger>
          </TabsList>
          
          <TabsContent value="js" className="min-w-0">
            <div className="mt-4">
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/50">
                <pre className="text-sm whitespace-pre-wrap break-words break-all">
                  <code>{jsCode}</code>
                </pre>
              </ScrollArea>
              <Button size="sm" onClick={() => copyToClipboard(jsCode, 'js')} className="w-full mt-2">
                {copied === 'js' ? <><Check className="mr-2 h-4 w-4" /> コピーしました</> : <><Copy className="mr-2 h-4 w-4" /> クリップボードにコピー</>}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                この&lt;script&gt;タグをブログやウェブサイトに貼り付けると、アニメーションを追加できます。
              </p>
            </div>
          </TabsContent>

          <TabsContent value="embed" className="min-w-0">
             <div className="mt-4">
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/50">
                <pre className="text-sm whitespace-pre-wrap break-words break-all">
                  <code>{htmlEmbedCode}</code>
                </pre>
              </ScrollArea>
              <Button size="sm" onClick={() => copyToClipboard(htmlEmbedCode, 'embed')} className="w-full mt-2">
                {copied === 'embed' ? <><Check className="mr-2 h-4 w-4" /> コピーしました</> : <><Copy className="mr-2 h-4 w-4" /> クリップボードにコピー</>}
              </Button>
              <div className="text-xs text-muted-foreground mt-2 text-center space-y-2">
                <p>これをブログやウェブサイトに貼り付けると、以下のようにドット絵アイコン（静止）が表示されます。クリックすると、アニメーションが開始されます。</p>
                {previewSvgDataUrl && 
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="p-2">
                      <img 
                        src={previewSvgDataUrl} 
                        alt="Pixel art preview" 
                        className="border" 
                        style={{ 
                          width: '128px', 
                          height: '128px', 
                          imageRendering: 'pixelated'
                        }} 
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={handleDownloadSvg}>
                        <Download className="mr-2 h-4 w-4" />
                        SVGをダウンロード
                    </Button>
                  </div>
                }
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
