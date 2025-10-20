"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  User,
  Building2,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { NigerianBank } from "@/lib/banks";

interface AccountVerificationProps {
  accountNumber: string;
  selectedBank: NigerianBank | null;
  onVerificationComplete: (accountName: string) => void;
  className?: string;
}

interface VerificationResult {
  account_number: string;
  account_name: string;
  bank_id: number;
  bank_code: string;
  bank_name: string;
}

export function AccountVerification({ 
  accountNumber, 
  selectedBank, 
  onVerificationComplete,
  className = ""
}: AccountVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const canVerify = accountNumber.length === 10 && selectedBank;

  const verifyAccount = async () => {
    if (!canVerify) return;

    setIsVerifying(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/banks/resolve-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: accountNumber,
          bankCode: selectedBank.code
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Support both new and fallback shapes
      const success = data.success === true;
      const account_name = data.accountName || data.data?.account_name;
      const account_number = data.accountNumber || data.data?.account_number;
      const bank_code = data.bankCode || data.data?.bank_code || selectedBank.code;
      const bank_name = selectedBank.name;

      if (success && account_name && account_number) {
        setVerificationResult({
          account_name,
          account_number,
          bank_code,
          bank_id: 0,
          bank_name
        });
        onVerificationComplete(account_name);
        toast.success(`Account verified: ${account_name}`);
      } else {
        setVerificationError(data.error || 'Verification failed');
        toast.error(data.error || 'Account verification failed');
      }
    } catch (error) {
      console.error('Account verification error:', error);
      setVerificationError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setVerificationError(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Verification Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={verifyAccount}
          disabled={!canVerify || isVerifying}
          className="flex-1 h-8 sm:h-9 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs sm:text-sm"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Verify Account
            </>
          )}
        </Button>
        
        {verificationResult && (
          <Button
            type="button"
            onClick={resetVerification}
            variant="outline"
            className="h-8 sm:h-9 bg-white/20 border-white/30 hover:bg-white/30 text-xs sm:text-sm"
          >
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Verification Status */}
      {verificationResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 dark:text-green-200 text-sm mb-2">
                Account Verified Successfully
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    <strong>Account Name:</strong> {verificationResult.account_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    <strong>Account Number:</strong> {verificationResult.account_number}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    <strong>Bank:</strong> {verificationResult.bank_name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {verificationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-200 text-sm mb-1">
                Verification Failed
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                {verificationError}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Please check your account number and bank selection, then try again.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Help Text */}
      {!canVerify && accountNumber.length > 0 && (
        <div className="p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            {accountNumber.length < 10 
              ? `Account number must be 10 digits (${accountNumber.length}/10)`
              : !selectedBank 
                ? "Please select a bank to verify the account"
                : "Ready to verify account"
            }
          </p>
        </div>
      )}
    </div>
  );
}
