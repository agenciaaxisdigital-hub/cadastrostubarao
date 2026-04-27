const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(10,85%,48%)] via-[hsl(15,80%,42%)] to-[hsl(0,60%,30%)]">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            <span className="text-4xl font-extrabold text-white tracking-tight">S</span>
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-white/10 animate-pulse" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">SINDSPAG</h1>
          <p className="text-white/60 text-xs mt-1">Sistema de Gestão</p>
        </div>
        <div className="mt-4 flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
