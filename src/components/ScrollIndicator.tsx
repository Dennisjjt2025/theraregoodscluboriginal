export const ScrollIndicator = () => {
  return (
    <div className="w-full flex justify-center absolute bottom-6 md:bottom-8 left-0 right-0">
      <div className="flex flex-col items-center gap-2 animate-fade-in">
        <div className="w-7 h-11 border-2 border-muted-foreground/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-2.5 bg-muted-foreground/60 rounded-full animate-scroll-dot" />
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground/40 font-sans">
          Scroll
        </span>
      </div>
    </div>
  );
};
