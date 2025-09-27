"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to customer page since agent system was removed
    router.replace("/customer");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Agent System Removed</h1>
        <p className="text-gray-600 dark:text-gray-400">
          The agent system has been removed. Redirecting to customer dashboard...
        </p>
      </div>
    </div>
  );
}