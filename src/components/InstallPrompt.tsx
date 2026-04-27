import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show if not dismissed recently
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed || Date.now() - Number(dismissed) > 86400000) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS banner if not installed and not dismissed
    if (ios && !standalone) {
      const dismissed = localStorage.getItem("pwa_install_dismissed");
      if (!dismissed || Date.now() - Number(dismissed) > 86400000) {
        setShowBanner(true);
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || !showBanner) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa_install_dismissed", String(Date.now()));
  };

  // iOS instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] safe-area-bottom animate-in slide-in-from-bottom duration-300">
        <div className="mx-3 mb-3 bg-card rounded-2xl shadow-2xl border p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">Instalar SINDSPAG</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Toque em <span className="font-semibold">Compartilhar</span> (ícone ↑) e depois em <span className="font-semibold">"Adicionar à Tela de Início"</span>
              </p>
            </div>
            <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-muted shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome install prompt
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] safe-area-bottom animate-in slide-in-from-bottom duration-300">
      <div className="mx-3 mb-3 bg-card rounded-2xl shadow-2xl border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">Instalar SINDSPAG</p>
            <p className="text-xs text-muted-foreground mt-0.5">Acesse direto da tela inicial</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleDismiss} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
              Depois
            </button>
            <Button onClick={handleInstall} size="sm" className="rounded-xl gradient-primary border-0 font-bold text-xs h-8 px-4">
              Instalar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
