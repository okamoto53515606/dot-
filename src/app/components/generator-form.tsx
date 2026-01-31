'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wand2, Loader2 } from 'lucide-react';
import type { PixelArtInput } from '@/ai/flows';
import { movementPatterns, colorTones } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  characterMotif: z.string().min(2, 'Please enter a character motif.').max(50),
  colorTone: z.string().min(1, 'Please select a color tone.'),
  movementPattern: z.string().min(1, 'Please select a movement pattern.'),
  additionalFeatures: z.string().max(100).optional(),
});

type GeneratorFormProps = {
  onGenerate: (data: PixelArtInput) => void;
  onSuggest: () => Promise<string>;
  isLoading: boolean;
};

export default function GeneratorForm({ onGenerate, onSuggest, isLoading }: GeneratorFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      characterMotif: '',
      colorTone: 'vibrant',
      movementPattern: 'idle',
      additionalFeatures: '',
    },
  });

  const handleSuggestClick = async () => {
    const suggestion = await onSuggest();
    if (suggestion) {
      form.setValue('characterMotif', suggestion, { shouldValidate: true });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Animation</CardTitle>
        <CardDescription>Describe your character and watch it come to life.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onGenerate)} className="space-y-6">
            <FormField
              control={form.control}
              name="characterMotif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Motif</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g., A robotic frog" {...field} />
                    </FormControl>
                    <Button variant="outline" size="icon" type="button" onClick={handleSuggestClick} aria-label="Suggest a motif">
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>What is the main subject?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="colorTone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colorTones.map((tone) => (
                          <SelectItem key={tone} value={tone} className="capitalize">
                            {tone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="movementPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a movement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {movementPatterns.map((pattern) => (
                          <SelectItem key={pattern} value={pattern} className="capitalize">
                            {pattern}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="additionalFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Wearing a top hat, space background" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Animation'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
