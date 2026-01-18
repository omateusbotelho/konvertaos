import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  canInstall: boolean;
}

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    deferredPrompt: null,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    canInstall: false,
  });

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    setState(prev => ({
      ...prev,
      isInstalled: isStandalone,
      isIOS,
      isAndroid,
    }));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        deferredPrompt: e as BeforeInstallPromptEvent,
        canInstall: true,
      }));
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        deferredPrompt: null,
        canInstall: false,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!state.deferredPrompt) return false;

    await state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        deferredPrompt: null,
        canInstall: false,
      }));
      return true;
    }

    setState(prev => ({
      ...prev,
      deferredPrompt: null,
      canInstall: false,
    }));
    return false;
  }, [state.deferredPrompt]);

  return {
    ...state,
    install,
  };
}
