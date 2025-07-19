
import { cn } from "@/lib/utils";

type BallProps = {
  number: number;
  color: string;
  animationDelay?: string;
  isCompact?: boolean;
};

export function Ball({ number, color, animationDelay, isCompact = false }: BallProps) {
  const ballStyle = {
    backgroundColor: color,
    backgroundImage: `radial-gradient(circle at 50% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0) 60%)`,
    animationDelay: animationDelay,
  };

  const ballSize = isCompact 
    ? "h-16 w-16 sm:h-20 sm:w-20" 
    : "h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28";
  
  const textSize = isCompact
    ? "text-2xl sm:text-3xl"
    : "text-2xl sm:text-4xl md:text-5xl";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-out hover:scale-105",
        "animate-roll-in opacity-0",
        ballSize
      )}
      style={ballStyle}
    >
      <span className={cn(
          "font-bold text-white drop-shadow-md font-headline",
          textSize
        )}>
        {number}
      </span>
      <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
    </div>
  );
}
