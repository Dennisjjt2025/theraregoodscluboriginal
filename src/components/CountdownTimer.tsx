import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  function calculateTimeLeft(): TimeLeft {
    const difference = targetDate.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeBlocks = [
    { value: timeLeft.days, label: t.landing.days },
    { value: timeLeft.hours, label: t.landing.hours },
    { value: timeLeft.minutes, label: t.landing.minutes },
    { value: timeLeft.seconds, label: t.landing.seconds },
  ];

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {timeBlocks.map((block, index) => (
          <div key={block.label} className="flex items-center gap-2 sm:gap-4">
            <div className="text-center">
              <div className="bg-card border border-border px-3 py-2 sm:px-5 sm:py-3 min-w-[60px] sm:min-w-[80px]">
                <span className="font-serif text-2xl sm:text-4xl md:text-5xl font-medium tabular-nums">
                  {String(block.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-sans text-muted-foreground uppercase tracking-wider mt-2 block">
                {block.label}
              </span>
            </div>
            {index < timeBlocks.length - 1 && (
              <span className="font-serif text-2xl sm:text-4xl text-muted-foreground animate-pulse-slow">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
