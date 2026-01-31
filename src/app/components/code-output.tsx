'use client';

import { useState, useMemo, useEffect } from 'react';
import { Copy, Bookmark, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import type { MovementPattern, PixelArtData } from '@/lib/types';
import { getFullJsCode, getBookmarkletCode, getHtmlEmbedCode } from '@/lib/code-templates';
import { ScrollArea } from '@/components/ui/scroll-area';

type CodeOutputProps = {
  data: PixelArtData;
  movementPattern: MovementPattern;
};

export default function CodeOutput({ data, movementPattern }: CodeOutputProps) {
  const { toast } = useToast();
  const [previewDataUrl, setPreviewDataUrl] = useState('');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gridSize = 16;
    const pixelSize = 16;
    canvas.width = gridSize * pixelSize;
    canvas.height = gridSize * pixelSize;

    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      const { pixelMap, palette } = data;
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const colorId = pixelMap[y][x];
          if (palette[colorId] && colorId !== 0) {
            ctx.fillStyle = palette[colorId];
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          }
        }
      }
      setPreviewDataUrl(canvas.toDataURL('image/png'));
    }
  }, [data]);
  
  const jsCode = useMemo(() => getFullJsCode(data, movementPattern), [data, movementPattern]);
  const bookmarkletCode = useMemo(() => getBookmarkletCode(data, movementPattern), [data, movementPattern]);
  const htmlEmbedCode = useMemo(() => getHtmlEmbedCode(data, movementPattern, previewDataUrl), [data, movementPattern, previewDataUrl]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard!',
        description: `${type} code has been copied.`,
      });
    }).catch(err => {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not copy code to clipboard.',
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Your Creation</CardTitle>
        <CardDescription>Copy the code to use your animation anywhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="js" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="js"><Copy className="mr-2 h-4 w-4" /> Minified JS</TabsTrigger>
            <TabsTrigger value="bookmarklet"><Bookmark className="mr-2 h-4 w-4" /> Bookmarklet</TabsTrigger>
            <TabsTrigger value="embed"><Code2 className="mr-2 h-4 w-4" /> HTML Embed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="js">
            <div className="relative mt-4">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(jsCode, 'JavaScript')}>
                <Copy className="h-4 w-4" />
              </Button>
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/50">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  <code>{jsCode}</code>
                </pre>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-2">Paste this into your browser's developer console to run the animation.</p>
            </div>
          </TabsContent>

          <TabsContent value="bookmarklet">
            <div className="mt-4 flex flex-col items-center justify-center text-center p-4 border rounded-lg bg-muted/50">
              <p className="mb-4 text-sm">Drag this link to your bookmarks bar to create a bookmarklet.</p>
              <a 
                href={bookmarkletCode} 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={(e) => e.preventDefault()}
              >
                <Bookmark className="mr-2 h-4 w-4" /> Drag Me
              </a>
            </div>
          </TabsContent>

          <TabsContent value="embed">
             <div className="relative mt-4">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => copyToClipboard(htmlEmbedCode, 'HTML Embed')}>
                <Copy className="h-4 w-4" />
              </Button>
              <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/50">
                <pre className="text-xs whitespace-pre-wrap break-all">
                  <code>{htmlEmbedCode}</code>
                </pre>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-2">Paste this into your blog or website. The animation starts on click.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
