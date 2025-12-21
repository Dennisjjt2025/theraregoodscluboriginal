import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpCircle } from 'lucide-react';

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
  isAdmin?: boolean;
}

export function OnboardingTour({ run, onComplete, isAdmin = false }: OnboardingTourProps) {
  const { t } = useLanguage();
  const [stepIndex, setStepIndex] = useState(0);

  const baseSteps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center py-2">
          <h3 className="font-serif text-xl mb-2">{t.tour.welcome}</h3>
          <p className="text-muted-foreground">{t.tour.welcomeDesc}</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="drops-tab"]',
      content: (
        <div>
          <h4 className="font-serif text-lg mb-1">{t.tour.dropsTab}</h4>
          <p className="text-sm text-muted-foreground">{t.tour.dropsTabDesc}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="overview-tab"]',
      content: (
        <div>
          <h4 className="font-serif text-lg mb-1">{t.tour.overviewTab}</h4>
          <p className="text-sm text-muted-foreground">{t.tour.overviewTabDesc}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="orders-tab"]',
      content: (
        <div>
          <h4 className="font-serif text-lg mb-1">{t.tour.ordersTab}</h4>
          <p className="text-sm text-muted-foreground">{t.tour.ordersTabDesc}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="profile-tab"]',
      content: (
        <div>
          <h4 className="font-serif text-lg mb-1">{t.tour.profileTab}</h4>
          <p className="text-sm text-muted-foreground">{t.tour.profileTabDesc}</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
  ];

  const adminStep: Step = {
    target: '[data-tour="admin-button"]',
    content: (
      <div>
        <h4 className="font-serif text-lg mb-1">{t.tour.adminButton}</h4>
        <p className="text-sm text-muted-foreground">{t.tour.adminButtonDesc}</p>
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  };

  const steps = isAdmin ? [...baseSteps, adminStep] : baseSteps;

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, type, index } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onComplete();
      setStepIndex(0);
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }
  };

  useEffect(() => {
    if (run) {
      setStepIndex(0);
    }
  }, [run]);

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      scrollOffset={100}
      callback={handleJoyrideCallback}
      locale={{
        back: t.tour.back,
        next: t.tour.next,
        skip: t.tour.skip,
        last: t.tour.finish,
      }}
      styles={{
        options: {
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        tooltipTitle: {
          fontFamily: 'var(--font-serif)',
          fontSize: '18px',
        },
        tooltipContent: {
          padding: '10px 0',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: '4px',
          color: 'hsl(var(--primary-foreground))',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '10px',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '14px',
        },
        spotlight: {
          borderRadius: '8px',
        },
        overlay: {
          mixBlendMode: 'normal' as const,
        },
      }}
      floaterProps={{
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
    />
  );
}

interface TourButtonProps {
  onClick: () => void;
}

export function TourButton({ onClick }: TourButtonProps) {
  const { t } = useLanguage();
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      title={t.tour.restartTour}
    >
      <HelpCircle className="w-4 h-4" />
      <span className="hidden sm:inline">{t.tour.restartTour}</span>
    </button>
  );
}
