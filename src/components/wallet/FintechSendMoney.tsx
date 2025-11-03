'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Send, 
  User, 
  Shield, 
  CheckCircle, 
  Loader2,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { UserSearch } from './UserSearch';
import { BankSelector } from './BankSelector';
import { AccountVerification } from './AccountVerification';
import type { NigerianBank } from '@/lib/banks';

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
}

interface FintechSendMoneyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  walletBalance: number;
  activeWallet: 'ngn' | 'crypto';
}

export function FintechSendMoney({ 
  isOpen, 
  onClose, 
  onSuccess, 
  walletBalance, 
  activeWallet 
}: FintechSendMoneyProps) {
  const [step, setStep] = useState<'recipient' | 'amount' | 'confirm' | 'processing'>('recipient');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [recipientInput, setRecipientInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bank transfer mode (via Paystack)
  const [transferMethod, setTransferMethod] = useState<'user' | 'bank'>('user');
  const [selectedBank, setSelectedBank] = useState<NigerianBank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [verifiedAccountName, setVerifiedAccountName] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('recipient');
      setAmount('');
      setDescription('');
      setSelectedRecipient(null);
      setRecipientInput('');
      setErrors({});
      setTransferMethod('user');
      setSelectedBank(null);
      setAccountNumber('');
      setVerifiedAccountName('');
    }
  }, [isOpen]);

  const validateRecipient = () => {
    const newErrors: Record<string, string> = {};
    
    if (transferMethod === 'user') {
      if (!selectedRecipient && !recipientInput.trim()) {
        newErrors.recipient = 'Please select or enter a recipient';
      } else if (!selectedRecipient && recipientInput.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientInput.trim())) {
          newErrors.recipient = 'Please enter a valid email address';
        }
      }
    } else {
      // bank
      if (!accountNumber || accountNumber.length !== 10) {
        newErrors.bank = 'Enter a valid 10-digit account number';
      }
      if (!selectedBank) {
        newErrors.bank = (newErrors.bank ? newErrors.bank + ' and select bank' : 'Select a bank');
      }
      if (!verifiedAccountName) {
        newErrors.bank = (newErrors.bank ? newErrors.bank + ' and verify account' : 'Verify account');
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAmount = () => {
    const newErrors: Record<string, string> = {};
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (numAmount < 1) {
      newErrors.amount = 'Minimum transfer amount is ₦1';
    } else if (numAmount > 1000000) {
      newErrors.amount = 'Maximum transfer amount is ₦1,000,000';
    } else if (numAmount > walletBalance) {
      newErrors.amount = 'Insufficient balance';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRecipientNext = () => {
    if (validateRecipient()) {
      setStep('amount');
    }
  };

  const handleAmountNext = () => {
    if (validateAmount()) {
      setStep('confirm');
    }
  };

  const handleSendMoney = async () => {
    setIsProcessing(true);
    setStep('processing');
    
    try {
      let response: Response;
      let data: any;

      if (transferMethod === 'user') {
        const requestBody = {
          amount: parseFloat(amount),
          recipient: selectedRecipient?.email || recipientInput.trim(),
          description: description || `Transfer to ${selectedRecipient?.full_name || selectedRecipient?.email || recipientInput.trim()}`,
          walletType: activeWallet
        };
        response = await fetch('/api/wallet/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });
      } else {
        // Bank transfer path uses withdraw-to-bank
        const requestBody = {
          amount: parseFloat(amount),
          bankCode: selectedBank?.code,
          accountNumber,
          narration: description || `Transfer to ${verifiedAccountName}`
        };
        response = await fetch('/api/wallet/withdraw-to-bank', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });
      }

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send money');
      }

      if (transferMethod === 'user') {
        toast.success(data.message || `Successfully sent ₦${amount} to ${selectedRecipient?.full_name || recipientInput}!`);
      } else {
        toast.success(data.message || `Withdrawal of ₦${amount} to ${verifiedAccountName} initiated`);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: unknown) {
      console.error('Send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send money';
      toast.error(errorMessage);
      setStep('confirm'); // Go back to confirm step
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return numericValue;
  };

  const getStepIcon = (stepName: string) => {
    const isActive = step === stepName;
    const isCompleted = ['recipient', 'amount', 'confirm'].indexOf(step) > ['recipient', 'amount', 'confirm'].indexOf(stepName);
    
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (isActive) {
      return <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
        <div className="h-2 w-2 bg-white rounded-full" />
      </div>;
    }
    return <div className="h-5 w-5 rounded-full bg-gray-300" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {transferMethod === 'bank' ? 'Send to Bank' : 'Send Money'}
          </DialogTitle>
          <DialogDescription>
            {transferMethod === 'bank' ? 'Instant bank transfer via Paystack' : 'Transfer money securely to friends and family'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {getStepIcon('recipient')}
            <span className="text-sm font-medium">Recipient</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-2">
            {getStepIcon('amount')}
            <span className="text-sm font-medium">Amount</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-2">
            {getStepIcon('confirm')}
            <span className="text-sm font-medium">Confirm</span>
          </div>
        </div>

        {/* Step 1: Recipient / Destination */}
        {step === 'recipient' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Button variant={transferMethod === 'user' ? 'default' : 'outline'} onClick={() => setTransferMethod('user')}>Ajo user</Button>
              <Button variant={transferMethod === 'bank' ? 'default' : 'outline'} onClick={() => setTransferMethod('bank')}>Bank account</Button>
            </div>

            {transferMethod === 'user' ? (
              <div>
                <Label htmlFor="recipient">Send to</Label>
                <div className="mt-2">
                  <UserSearch
                    onUserSelect={(user) => {
                      setSelectedRecipient(user);
                      setRecipientInput(user?.email || '');
                    }}
                    selectedUser={selectedRecipient}
                    placeholder="Search by email or phone number"
                  />
                </div>
                {errors.recipient && (
                  <p className="text-sm text-red-500 mt-1">{errors.recipient}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Account number</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => { setAccountNumber(e.target.value.replace(/[^0-9]/g, '').slice(0,10)); setVerifiedAccountName(''); }}
                    placeholder="10-digit NUBAN"
                  />
                </div>
                <BankSelector
                  selectedBank={selectedBank}
                  onBankSelect={(bank) => { setSelectedBank(bank); setVerifiedAccountName(''); }}
                  placeholder="Select bank"
                />
                <AccountVerification
                  accountNumber={accountNumber}
                  selectedBank={selectedBank}
                  onVerificationComplete={setVerifiedAccountName}
                />
                {verifiedAccountName && (
                  <div className="text-sm text-green-700">Verified: {verifiedAccountName}</div>
                )}
                {errors.bank && (
                  <p className="text-sm text-red-500">{errors.bank}</p>
                )}
              </div>
            )}

            {selectedRecipient && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedRecipient.full_name || selectedRecipient.email}</p>
                      <p className="text-sm text-gray-600">{selectedRecipient.email}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual email entry fallback */}
            {transferMethod === 'user' && !selectedRecipient && (
              <div>
                <Label htmlFor="manual-email">Or enter email manually</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="Enter recipient email"
                  className="mt-2"
                />
              </div>
            )}

              <Button 
              onClick={() => {
                console.log('Continue clicked, selectedRecipient:', selectedRecipient, 'recipientInput:', recipientInput);
                handleRecipientNext();
              }} 
              className="w-full"
              disabled={transferMethod === 'user' ? (!selectedRecipient && !recipientInput.trim()) : !(accountNumber.length === 10 && selectedBank)}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 'amount' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(formatAmount(e.target.value))}
                  className="pl-10 text-lg"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What&apos;s this for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2"
                rows={2}
              />
            </div>

            {/* Balance Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Balance</span>
                  <span className="font-medium">₦{walletBalance.toLocaleString()}</span>
                </div>
                {parseFloat(amount) > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">After Transfer</span>
                    <span className="font-medium">
                      ₦{(walletBalance - parseFloat(amount || '0')).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('recipient')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleAmountNext} 
                className="flex-1"
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Confirm Transfer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">To</span>
                  <div className="text-right">
                    {transferMethod === 'user' ? (
                      <>
                        <p className="font-medium">{selectedRecipient?.full_name || recipientInput}</p>
                        <p className="text-sm text-gray-500">{selectedRecipient?.email || recipientInput}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{verifiedAccountName || 'Unverified account'}</p>
                        <p className="text-sm text-gray-500">{selectedBank?.name} • {accountNumber}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount</span>
                  <span className="text-2xl font-bold">₦{parseFloat(amount).toLocaleString()}</span>
                </div>
                
                {description && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Description</span>
                      <span className="text-right">{description}</span>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fee</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Your transfer is secure and encrypted</span>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('amount')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleSendMoney} 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Send Money
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-medium mb-2">Processing Transfer</h3>
            <p className="text-gray-600 mb-4">
              Sending ₦{parseFloat(amount).toLocaleString()} to {selectedRecipient?.full_name || recipientInput}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>This usually takes a few seconds</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
