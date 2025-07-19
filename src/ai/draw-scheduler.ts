
'use server';
/**
 * @fileOverview A scheduler for creating new draws.
 * This is intended to be run by a client-side timer for simulation.
 */
import type { Draw } from '@/lib/types';
import { generateLuckyNumbers } from './flows/generate-lucky-numbers-flow';

const BALL_COLORS = ["#c00", "#1E40AF", "#166534"]; // Red, Blue, Green

const getHighLowMid = (sum: number): 'High' | 'Low' | 'Mid' => {
  if (sum < 150) return 'Low';
  if (sum > 350) return 'High';
  return 'Mid';
};

// Fallback function in case the AI model fails
const generateFallbackNumbers = (): number[] => {
    const numbers = new Set<number>();
    while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 99) + 1);
    }
    return Array.from(numbers);
};

export async function generateNewDraw(): Promise<Draw> {
  let numbersArray: number[] | undefined;

  try {
      const result = await generateLuckyNumbers();
      if (result && result.numbers && result.numbers.length === 6) {
          numbersArray = result.numbers;
      } else {
          console.warn("AI result was malformed, using fallback.");
      }
  } catch (aiError) {
      console.error("AI number generation failed, using fallback.", aiError);
  }
  
  if (!numbersArray) {
      numbersArray = generateFallbackNumbers();
  }
  
  const sum = numbersArray.reduce((a, b) => a + b, 0);
  const colorsArray = Array.from({ length: 6 }, () => BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)]);
  
  const colorCounts: Record<string, number> = colorsArray.reduce((acc, color) => {
      acc[color] = (acc[color] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(0, ...Object.values(colorCounts));
  const winningColors = Object.keys(colorCounts).filter(key => colorCounts[key] === maxCount);

  const newDraw: Draw = {
      id: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      numbers: numbersArray,
      colors: colorsArray,
      sum,
      highLow: getHighLowMid(sum),
      colorCounts,
      winningColors,
      createdAt: new Date(),
  };

  return newDraw;
}
