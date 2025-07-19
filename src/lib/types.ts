
export type Draw = {
  numbers: number[];
  colors: string[];
  id: string;
  sum: number;
  highLow: 'High' | 'Low' | 'Mid';
  colorCounts: Record<string, number>;
  winningColors: string[];
  createdAt: Date;
};
