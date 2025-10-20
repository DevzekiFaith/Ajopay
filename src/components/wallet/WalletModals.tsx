"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  QrCode, 
  Copy, 
  CreditCard,
  Smartphone,
  Banknote,
  Shield,
  Bitcoin
} from "lucide-react";
import { toast } from "sonner";
import { BankSelector } from "./BankSelector";
import { AccountVerification } from "./AccountVerification";
import { UserSearch } from "./UserSearch";
import { FintechSendMoney } from "./FintechSendMoney";
import { NigerianBank } from "@/lib/banks";

interface WalletModalsProps {
  showDepositModal: boolean;
  setShowDepositModal: (show: boolean) => void;
  showWithdrawModal: boolean;
  setShowWithdrawModal: (show: boolean) => void;
  showSendModal: boolean;
  setShowSendModal: (show: boolean) => void;
  showReceiveModal: boolean;
  setShowReceiveModal: (show: boolean) => void;
  activeWallet: 'ngn' | 'crypto';
  walletBalance: number;
  onWalletUpdate?: () => void; // Callback to refresh wallet data
  user?: { id: string; email?: string } | null;
}

export function WalletModals({
  showDepositModal,
  setShowDepositModal,
  showWithdrawModal,
  setShowWithdrawModal,
  showSendModal,
  setShowSendModal,
  showReceiveModal,
  setShowReceiveModal,
  activeWallet,
  walletBalance,
  onWalletUpdate,
  user
}: WalletModalsProps) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [description, setDescription] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Bank account details for withdrawals
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState<NigerianBank | null>(null);
  const [verifiedAccountName, setVerifiedAccountName] = useState('');

  const depositMethods = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Banknote,
      description: 'Transfer from your bank account',
      processingTime: '1-3 business days',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Instant deposit with your card',
      processingTime: 'Instant',
      color: 'from-purple-500 to-violet-500'
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'Deposit via mobile money',
      processingTime: 'Instant',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const withdrawMethods = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Banknote,
      description: 'Transfer to your bank account',
      processingTime: '1-3 business days',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'Withdraw to mobile money',
      processingTime: 'Instant',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'crypto_exchange',
      name: 'Crypto Exchange',
      icon: Bitcoin,
      description: 'Convert to crypto and withdraw',
      processingTime: '1-2 hours',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleDeposit = async () => {
    if (!amount || !selectedMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Use existing Paystack integration for deposits
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are included
        body: JSON.stringify({
          amount_kobo: Math.round(parseFloat(amount) * 100), // Convert to kobo
          user_id: user?.id || 'current_user',
          email: user?.email || 'user@example.com',
          metadata: {
            type: 'wallet_deposit',
            method: selectedMethod,
            wallet_type: activeWallet
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
      
    } catch (error: unknown) {
      console.error('Deposit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process deposit';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !selectedMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate bank account details for bank transfers
    if (selectedMethod === 'bank_transfer') {
      if (!accountNumber || !selectedBank) {
        toast.error('Please fill in account number and select a bank');
        return;
      }
      
      if (!verifiedAccountName) {
        toast.error('Please verify your account details before proceeding');
        return;
      }
    }

    // Validate phone number for mobile money
    if (selectedMethod === 'mobile_money') {
      if (!phoneNumber) {
        toast.error('Please enter your phone number');
        return;
      }
    }

    setIsProcessing(true);
    try {
      // Use new withdraw-to-bank API
      const response = await fetch('/api/wallet/withdraw-to-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are included
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankCode: selectedMethod === 'bank_transfer' ? selectedBank?.code : undefined,
          accountNumber: selectedMethod === 'bank_transfer' ? accountNumber : undefined,
          narration: `Withdraw to ${selectedBank?.name || 'bank account'}`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      toast.success(data.message || `Withdrawal of ₦${amount} initiated successfully!`);
      setShowWithdrawModal(false);
      setAmount('');
      setSelectedMethod('');
      setAccountNumber('');
      setBankName('');
      setAccountName('');
      setPhoneNumber('');
      setSelectedBank(null);
      setVerifiedAccountName('');
      
      // Refresh wallet data
      if (onWalletUpdate) {
        onWalletUpdate();
      } else {
        // Fallback to page reload if no callback provided
        window.location.reload();
      }
    } catch (error: unknown) {
      console.error('Withdrawal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process withdrawal';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    // Validate based on wallet type
    if (activeWallet === 'ngn') {
      if (!amount || (!selectedRecipient && !recipient)) {
        toast.error('Please fill in all required fields and select a recipient or enter email manually');
        return;
      }
    } else {
      if (!amount || !recipient) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    if (parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/wallet/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are included
        body: JSON.stringify({
          amount: parseFloat(amount),
          recipient: activeWallet === 'ngn' ? (selectedRecipient?.email || recipient) : recipient,
          description: description || `Transfer to ${activeWallet === 'ngn' ? (selectedRecipient?.full_name || selectedRecipient?.email || recipient) : recipient}`,
          walletType: activeWallet
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send money');
      }

      const recipientName = activeWallet === 'ngn' 
        ? (selectedRecipient?.full_name || selectedRecipient?.email || recipient)
        : recipient;

      toast.success(data.message || `Successfully sent ₦${amount} to ${recipientName}!`);
      setShowSendModal(false);
      setAmount('');
      setRecipient('');
      setSelectedRecipient(null);
      setDescription('');
      
      // Refresh wallet data
      if (onWalletUpdate) {
        onWalletUpdate();
      } else {
        // Fallback to page reload if no callback provided
        window.location.reload();
      }
    } catch (error: unknown) {
      console.error('Send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send money';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const walletAddress = activeWallet === 'ngn' 
    ? 'NGN_WALLET_1234567890ABCDEF'
    : '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

  return (
    <>
      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-3 sm:p-4 w-full max-w-sm border border-white/30 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                  Deposit {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDepositModal(false)}
                  className="bg-white/20 hover:bg-white/30 h-6 w-6 sm:h-8 sm:w-8"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div>
                  <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-white/20 border-white/30 focus:border-white/50 h-8 sm:h-9 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Deposit Method</Label>
                  <div className="space-y-1">
                    {depositMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
                          selectedMethod === method.id
                            ? 'border-white/50 bg-white/20'
                            : 'border-white/20 bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gradient-to-br ${method.color}`}>
                            <method.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white">
                              {method.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 hidden sm:block">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-500 hidden sm:block">
                              {method.processingTime}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={isProcessing || !amount || !selectedMethod}
                  className="w-full h-8 sm:h-9 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs sm:text-sm"
                >
                  {isProcessing ? 'Processing...' : 'Deposit'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-3 sm:p-4 w-full max-w-sm border border-white/30 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
                  Withdraw {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowWithdrawModal(false)}
                  className="bg-white/20 hover:bg-white/30 h-6 w-6 sm:h-8 sm:w-8"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div>
                  <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-white/20 border-white/30 focus:border-white/50 h-8 sm:h-9 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Withdrawal Method</Label>
                  <div className="space-y-1">
                    {withdrawMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 ${
                          selectedMethod === method.id
                            ? 'border-white/50 bg-white/20'
                            : 'border-white/20 bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gradient-to-br ${method.color}`}>
                            <method.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-white">
                              {method.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 hidden sm:block">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-500 hidden sm:block">
                              {method.processingTime}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Account Details Form */}
                {selectedMethod === 'bank_transfer' && (
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Account Number</Label>
                      <Input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(e.target.value);
                          setVerifiedAccountName(''); // Reset verification when account number changes
                        }}
                        placeholder="Enter 10-digit account number"
                        maxLength={10}
                        className="bg-white/20 border-white/30 focus:border-white/50 h-8 sm:h-9 text-sm"
                      />
                    </div>
                    
                    <BankSelector
                      selectedBank={selectedBank}
                      onBankSelect={(bank) => {
                        setSelectedBank(bank);
                        setVerifiedAccountName(''); // Reset verification when bank changes
                      }}
                      placeholder="Select your bank"
                    />

                    <AccountVerification
                      accountNumber={accountNumber}
                      selectedBank={selectedBank}
                      onVerificationComplete={setVerifiedAccountName}
                    />
                  </div>
                )}

                {/* Mobile Money Details */}
                {selectedMethod === 'mobile_money' && (
                  <div>
                    <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Phone Number</Label>
                    <Input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter phone number"
                      className="bg-white/20 border-white/30 focus:border-white/50 h-8 sm:h-9 text-sm"
                    />
                  </div>
                )}

                <Button
                  onClick={handleWithdraw}
                  disabled={
                    isProcessing || 
                    !amount || 
                    !selectedMethod || 
                    (selectedMethod === 'bank_transfer' && (!accountNumber || !selectedBank || !verifiedAccountName)) ||
                    (selectedMethod === 'mobile_money' && !phoneNumber)
                  }
                  className="w-full h-8 sm:h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs sm:text-sm disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Modal - New Fintech Style */}
      <FintechSendMoney
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSuccess={onWalletUpdate}
        walletBalance={walletBalance}
        activeWallet={activeWallet}
      />

      {/* Receive Modal */}
      <AnimatePresence>
        {showReceiveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl rounded-2xl p-4 w-full max-w-sm border border-white/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Receive {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowReceiveModal(false)}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* QR Code */}
                <div className="text-center">
                  <div className="bg-white/20 rounded-xl p-4 mb-3">
                    <QrCode className="h-20 w-20 mx-auto text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Scan QR code to send {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'}
                  </p>
                </div>

                {/* Wallet Address */}
                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">
                    {activeWallet === 'ngn' ? 'Wallet Address' : 'Bitcoin Address'}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={walletAddress}
                      readOnly
                      className="bg-white/20 border-white/30 text-xs font-mono h-9"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(walletAddress)}
                      className="bg-white/20 border-white/30 hover:bg-white/30 h-9 w-9"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Security Note */}
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                        Security Notice
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        Only send {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'} to this address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
