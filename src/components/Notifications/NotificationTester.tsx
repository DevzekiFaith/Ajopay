"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function NotificationTester() {
  const [isLoading, setIsLoading] = useState(false);

  const testRegularNotification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'test' }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Regular test notification created!");
      } else {
        toast.error("Failed to create test notification");
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast.error("Error creating test notification");
    } finally {
      setIsLoading(false);
    }
  };

  const testSmartNotification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/smart-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'savings_reminder' }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Smart test notification created!");
      } else {
        toast.error("Failed to create smart test notification");
      }
    } catch (error) {
      console.error('Error creating smart test notification:', error);
      toast.error("Error creating smart test notification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Notification Tester</CardTitle>
        <CardDescription>
          Test the notification system to verify content is displayed properly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testRegularNotification}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          Test Regular Notification
        </Button>
        
        <Button 
          onClick={testSmartNotification}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          Test Smart Notification
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          Check your notifications panel to see if the content appears correctly
        </p>
      </CardContent>
    </Card>
  );
}
