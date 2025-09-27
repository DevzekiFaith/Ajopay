"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NotificationPermission {
  permission: NotificationPermission | 'default' | 'granted' | 'denied';
  isSupported: boolean;
}

export function useBrowserNotifications() {
  const [notificationState, setNotificationState] = useState<NotificationPermission>({
    permission: 'default',
    isSupported: false
  });

  useEffect(() => {
    // Check if notifications are supported
    const isSupported = 'Notification' in window;
    const permission = isSupported ? Notification.permission : 'denied';
    
    setNotificationState({
      permission,
      isSupported
    });
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!notificationState.isSupported) {
      toast.error('Browser notifications are not supported on this device');
      return false;
    }

    if (notificationState.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast.success('Notifications enabled! You\'ll now receive alerts for deposits and transactions.');
        return true;
      } else if (permission === 'denied') {
        toast.error('Notifications were denied. You can enable them in your browser settings.');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!notificationState.isSupported || notificationState.permission !== 'granted') {
      return false;
    }

    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  const showDepositNotification = (amount: number, isLargeDeposit = false) => {
    const title = isLargeDeposit ? 'AjoPay - Large Deposit! 🎉' : 'AjoPay - Money Received! 💰';
    const body = `₦${amount.toLocaleString()} has been added to your wallet`;
    
    return showNotification(title, {
      body,
      tag: isLargeDeposit ? 'large-deposit' : 'deposit-received',
      requireInteraction: isLargeDeposit, // Large deposits require user interaction
      silent: false
    });
  };

  return {
    ...notificationState,
    requestPermission,
    showNotification,
    showDepositNotification
  };
}
