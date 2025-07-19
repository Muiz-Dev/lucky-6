// This file is not currently in use, but is kept for potential future AI features.
'use server';
/**
 * @fileOverview An AI flow for generating lucky numbers for the game.
 *
 * - generateLuckyNumbers - A function that returns 6 "lucky" numbers.
 * - LuckyNumbersOutput - The return type for the generateLuckyNumbers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LuckyNumbersOutputSchema = z.object({
  numbers: z.array(z.number()).length(6).describe('An array of 6 unique lucky numbers.'),
});
export type LuckyNumbersOutput = z.infer<typeof LuckyNumbersOutputSchema>;


export async function generateLuckyNumbers(): Promise<LuckyNumbersOutput> {
  return generateLuckyNumbersFlow();
}

const prompt = ai.definePrompt({
  name: 'generateLuckyNumbersPrompt',
  output: {schema: LuckyNumbersOutputSchema},
  prompt: `You are a sophisticated AI for a "Lucky Six" lottery game. Your task is to generate a set of 6 unique numbers from 1 to 99.

Your primary directive is to "favor the house". This means you should generate numbers that feel random to humans but subtly avoid common patterns that people tend to bet on.

Here are your guidelines:
1.  **Avoid Common "Lucky" Numbers**: Humans often pick numbers based on birthdays (1-31), anniversaries, or superstitions (like 7, 11). Generate numbers that are well-distributed and less frequently include these common choices.
2.  **Break Obvious Patterns**: Avoid simple arithmetic sequences (e.g., 10, 20, 30, 40, 50, 60), clusters of numbers in the same decade (e.g., 21, 22, 25, 26, 28, 29), or visually appealing patterns on a grid.
3.  **Maintain Illusion of Randomness**: The numbers must still appear completely random. Occasionally, you can include a number like 7 or a pair of numbers from the teens to make it believable, but the overall set should be statistically less likely to match a typical human's selection.
4.  **Ensure Uniqueness**: All 6 numbers in the output array must be unique.
5.  **Full Range**: Use the entire range from 1 to 99, but with a bias towards less "popular" numbers like those in the high 40s, 60s, or 80s.

Generate a set of 6 numbers now that adheres to these principles.`,
});

const generateLuckyNumbersFlow = ai.defineFlow(
  {
    name: 'generateLuckyNumbersFlow',
    outputSchema: LuckyNumbersOutputSchema,
  },
  async () => {
    const {output} = await prompt();
    return output!;
  }
);
