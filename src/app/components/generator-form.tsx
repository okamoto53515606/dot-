'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { PixelArtInput } from '@/ai/flows';
import { MOVEMENT_PATTERNS } from '@/lib/constants';
import type { MovementPattern } from '@/lib/types';

const formSchema = z.object({
  prompt: z.string()
    .nonempty('キャラクターのモチーフは必須入力です。')
    .max(50, '50文字以内で入力してください。'),
  movement: z.string().min(1, 'アニメーションは必須入力です。'),
});

type GeneratorFormProps = {
  onGenerate: (data: PixelArtInput) => void;
  isLoading: boolean;
  onMovementChange: (pattern: MovementPattern) => void;
};

export default function GeneratorForm({ onGenerate, isLoading, onMovementChange }: GeneratorFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
      movement: 'walking',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onGenerate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 border rounded-lg shadow-sm bg-card">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>キャラクターのモチーフ</FormLabel>
              <FormControl>
                <Input placeholder="例: 猫、ロボット、魔法使い" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>どんなキャラクターを生成しますか？</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="movement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>アニメーション</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  onMovementChange(value as MovementPattern);
                }}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="動きを選択..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MOVEMENT_PATTERNS.map((pattern) => (
                    <SelectItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>キャラクターの動きを選択します。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 生成中...</> : 'ドット絵を生成'}
        </Button>
      </form>
    </Form>
  );
}
