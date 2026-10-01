import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmployeeSession } from "./useEmployeeSession";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Notification sound - simple beep using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create two beeps for notification
    const playBeep = (startTime: number, frequency: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    };
    
    const now = audioContext.currentTime;
    playBeep(now, 880); // First beep (A5)
    playBeep(now + 0.35, 1046.5); // Second beep (C6)
    
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
};

export const useAppointmentNotifications = () => {
  const { employeeSession, isEmployeeLoggedIn } = useEmployeeSession();
  const isSubscribed = useRef(false);

  const showNotification = useCallback((payload: any) => {
    const appointment = payload.new;
    
    // Play sound
    playNotificationSound();
    
    // Show toast
    const scheduledDate = appointment.scheduled_date;
    const scheduledTime = appointment.scheduled_time?.slice(0, 5);
    
    const formattedDate = scheduledDate 
      ? format(new Date(scheduledDate + "T00:00:00"), "dd/MM", { locale: ptBR })
      : "";

    toast.info("Novo Agendamento!", {
      description: `${formattedDate} às ${scheduledTime}`,
      duration: 8000,
      action: {
        label: "Ver",
        onClick: () => {
          // Refresh the page to see the new appointment
          window.location.reload();
        },
      },
    });
  }, []);

  useEffect(() => {
    if (!isEmployeeLoggedIn || !employeeSession?.ownerUserId || isSubscribed.current) {
      return;
    }

    isSubscribed.current = true;
    console.log("Subscribing to appointment notifications for owner:", employeeSession.ownerUserId);

    const channel = supabase
      .channel("employee-appointment-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `user_id=eq.${employeeSession.ownerUserId}`,
        },
        (payload) => {
          console.log("New appointment received:", payload);
          showNotification(payload);
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from appointment notifications");
      isSubscribed.current = false;
      supabase.removeChannel(channel);
    };
  }, [isEmployeeLoggedIn, employeeSession?.ownerUserId, showNotification]);
};
