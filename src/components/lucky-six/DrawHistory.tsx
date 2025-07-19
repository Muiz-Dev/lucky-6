
'use client';

import type { Draw } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type DrawHistoryProps = {
  draws: Draw[];
};

const highLowColorClass = {
    'High': 'text-red-400',
    'Low': 'text-blue-400',
    'Mid': 'text-green-400'
}

export function DrawHistory({ draws }: DrawHistoryProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-2xl font-bold text-yellow-400 font-headline">Draw History</h2>
        <p className="text-sm text-foreground/60">Last 20 results</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {draws.length === 0 && (
            <p className="text-center text-foreground/60 py-8">No history yet. Waiting for the next draw...</p>
          )}
          {draws.map((draw, index) => {
            const createdAtDate = new Date(draw.createdAt);
            return (
              <div key={draw.id} className="animate-fade-in">
                <div className="grid grid-cols-3 gap-2 items-start">
                  <div className="col-span-2 space-y-2">
                    <div>
                       <p className="text-xs text-foreground/60 truncate" title={draw.id}>
                          {createdAtDate.toLocaleTimeString()} - ID: {draw.id.substring(0,6)}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {draw.numbers.map((num, i) => (
                          <div key={i} className="flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold text-white" style={{ backgroundColor: draw.colors[i] }}>
                            {num}
                          </div>
                        ))}
                      </div>
                    </div>
                     <div>
                        <p className="text-xs text-foreground/60">Color Stats</p>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          {draw.colorCounts && Object.entries(draw.colorCounts).map(([color, count]) => (
                              <div key={color} className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                  <span className="font-mono">{count}</span>
                              </div>
                          ))}
                        </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <p className="text-lg font-bold">{draw.sum}</p>
                      <p className={cn(`text-sm font-semibold`, highLowColorClass[draw.highLow])}>
                        {draw.highLow}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60">Winning Color</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {draw.winningColors.map(color => (
                          <div key={color} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {index < draws.length - 1 && <Separator className="mt-4 bg-border/50" />}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
