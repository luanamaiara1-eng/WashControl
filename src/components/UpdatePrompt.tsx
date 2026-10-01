import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, X, Download } from "lucide-react";

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log("SW registered:", swUrl);
      // Check for updates every 60 seconds
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  const handleForceRefresh = () => {
    // Clear caches and reload
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-primary/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Nova atualização disponível!</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Uma nova versão do sistema está pronta para ser instalada.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleUpdate} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar agora
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Standalone force refresh button component
export function ForceRefreshButton() {
  const handleForceRefresh = async () => {
    // Clear all caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    // Unregister service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }

    // Hard reload
    window.location.reload();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleForceRefresh}>
      <RefreshCw className="w-4 h-4 mr-2" />
      Forçar atualização
    </Button>
  );
}
