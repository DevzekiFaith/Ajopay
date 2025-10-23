"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { playDepositNotification } from '@/lib/sounds';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { Plus, Volume2, Bell, TestTube } from 'lucide-react';

export function NotificationTest() {
  const [testAmount, setTestAmount] = useState('10000'); // 100 NGN in kobo
  const { requestPermission, showDepositNotification, permission, isSupported } = useBrowserNotifications();

  const testDepositSound = () => {
    const amount = parseInt(testAmount) || 10000;
    const isLargeDeposit = amount >= 50000;
    playDepositNotification(amount, isLargeDeposit);
    
    toast.success(
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
          <Volume2 className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <div className="font-semibold">Sound Test</div>
          <div className="text-sm opacity-80">
            Playing {isLargeDeposit ? 'large deposit' : 'regular deposit'} sound
          </div>
        </div>
      </div>,
      { duration: 3000 }
    );
  };

  const testNotification = () => {
    const amount = parseInt(testAmount) || 10000;
    const isLargeDeposit = amount >= 50000;
    
    // Show toast notification
    toast.success(
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20">
          <Plus className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <div className="font-semibold">
            {isLargeDeposit ? "Large Deposit Received! 🎉" : "Money Received! 💰"}
          </div>
          <div className="text-sm opacity-80">₦{(amount / 100).toLocaleString()} added to your wallet</div>
        </div>
      </div>,
      {
        duration: isLargeDeposit ? 7000 : 5000,
        className: isLargeDeposit 
          ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
          : "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20",
      }
    );

    // Play sound
    playDepositNotification(amount, isLargeDeposit);

    // Show browser notification
    showDepositNotification(amount / 100, isLargeDeposit);
  };

  const testBrowserNotification = async () => {
    const granted = await requestPermission();
    if (granted) {
      showDepositNotification(parseInt(testAmount) / 100, parseInt(testAmount) >= 50000);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Notification & Sound Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Test Amount (in kobo)</Label>
          <Input
            id="amount"
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            placeholder="10000"
          />
          <p className="text-sm text-muted-foreground">
            ₦{(parseInt(testAmount) / 100).toLocaleString()} 
            {parseInt(testAmount) >= 50000 && ' (Large Deposit)'}
          </p>
        </div>

        <div className="space-y-2">
          <Button onClick={testDepositSound} className="w-full" variant="outline">
            <Volume2 className="w-4 h-4 mr-2" />
            Test Deposit Sound
          </Button>

          <Button onClick={testNotification} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Test Full Notification
          </Button>

          <Button 
            onClick={testBrowserNotification} 
            className="w-full" 
            variant="secondary"
            disabled={!isSupported}
          >
            <Bell className="w-4 h-4 mr-2" />
            Test Browser Notification
          </Button>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Browser Notifications: {isSupported ? 'Supported' : 'Not Supported'}</p>
          <p>Permission: {String(permission)}</p>
          {!isSupported && (
            <p className="text-amber-600">Browser notifications are not supported on this device</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
