
'use client';

import type { Draw } from '@/lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { Ball } from './Ball';

type LiveDrawProps = {
  currentDraw: Draw | null;
  timeToNextDraw: number;
  isLoading: boolean;
  error: string | null;
  key?: number;
  isCompact?: boolean;
};

export function LiveDraw({ currentDraw, timeToNextDraw, isLoading, error, isCompact = false }: LiveDrawProps) {
  const headerTextSize = isCompact ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-5xl sm:text-6xl md:text-7xl';
  const subTextSize = isCompact ? 'text-base md:text-lg' : 'text-lg md:text-xl';
  const ballContainerMargin = isCompact ? 'my-6' : 'my-8 sm:my-12';
  const ballGap = isCompact ? 'gap-2 sm:gap-3 md:gap-4' : 'gap-2 sm:gap-4 md:gap-6';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <>
      <div className="text-center">
        <h1 className={`${headerTextSize} font-bold tracking-tighter text-yellow-400 font-headline`}>
          Lucky Six
        </h1>
        <p className={`mt-2 ${subTextSize} text-foreground/80`}>
          New draw every 3 minutes. Good luck!
        </p>
      </div>

      <div className={`relative ${ballContainerMargin} flex min-h-[120px] w-full max-w-4xl items-center justify-center`}>
        {isLoading || !currentDraw ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-red-400 text-center">{error}</div>
        ) : (
          <div className={`flex flex-wrap items-center justify-center ${ballGap}`}>
            {currentDraw.numbers.map((num, index) => (
              <Ball
                key={`${currentDraw.id}-${index}`}
                number={num}
                color={currentDraw.colors[index]}
                animationDelay={`${index * 100}ms`}
                isCompact={isCompact}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        {currentDraw && !isLoading && !error && (
          <>
            <p className="text-sm text-foreground/60">Draw ID</p>
            <p className="font-mono text-lg text-yellow-400/80 truncate max-w-xs sm:max-w-md mx-auto">{currentDraw.id}</p>
          </>
        )}
        {error && <div className="h-12" />}
        <div className="mt-4">
          <p className="text-sm text-foreground/60">Next draw in:</p>
          <p className="text-3xl font-bold text-foreground font-mono tracking-wider">{formatTime(timeToNextDraw)}</p>
        </div>
      </div>
    </>
  );
}
