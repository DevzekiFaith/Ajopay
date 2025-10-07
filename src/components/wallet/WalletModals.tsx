"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  X, 
  Send, 
  Download, 
  Upload, 
  ArrowUpRight, 
  QrCode, 
  Copy, 
  CreditCard,
  Smartphone,
  Banknote,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  Bitcoin,
  Coins
} from "lucide-react";
import { toast } from "sonner";

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
  activeWallet
}: WalletModalsProps) {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

    setIsProcessing(true);
    try {
      // For demo purposes, we'll simulate a successful deposit
      // In production, this would integrate with payment providers
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a deposit transaction record
      const response = await fetch('/api/wallet/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'deposit',
          amount: parseFloat(amount),
          method: selectedMethod,
          walletType: activeWallet,
          description: `Deposit via ${selectedMethod}`,
          status: 'completed'
        }),
      });

      if (response.ok) {
        toast.success(`Deposit of ₦${amount} completed successfully!`);
        setShowDepositModal(false);
        setAmount('');
        setSelectedMethod('');
        
        // Refresh the page to update wallet balance
        window.location.reload();
      } else {
        throw new Error('Failed to record deposit transaction');
      }
    } catch (error: unknown) {
      console.error('Deposit error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process deposit';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || !selectedMethod) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method: selectedMethod,
          walletType: activeWallet,
          accountDetails: {
            // Add account details based on method
            method: selectedMethod,
            timestamp: new Date().toISOString()
          }
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
      
      // Refresh the page to update wallet balance
      window.location.reload();
    } catch (error: unknown) {
      console.error('Withdrawal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process withdrawal';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!amount || !recipient) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate send processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Sent ₦${amount} to ${recipient} successfully!`);
      setShowSendModal(false);
      setAmount('');
      setRecipient('');
      setDescription('');
    } catch {
      toast.error('Failed to send money');
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl rounded-2xl p-4 w-full max-w-sm border border-white/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Deposit {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDepositModal(false)}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-white/20 border-white/30 focus:border-white/50 h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Deposit Method</Label>
                  <div className="space-y-1">
                    {depositMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all duration-300 ${
                          selectedMethod === method.id
                            ? 'border-white/50 bg-white/20'
                            : 'border-white/20 bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${method.color}`}>
                            <method.icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {method.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-500">
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
                  className="w-full h-9 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl rounded-2xl p-4 w-full max-w-sm border border-white/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Withdraw {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowWithdrawModal(false)}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-white/20 border-white/30 focus:border-white/50 h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Withdrawal Method</Label>
                  <div className="space-y-1">
                    {withdrawMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all duration-300 ${
                          selectedMethod === method.id
                            ? 'border-white/50 bg-white/20'
                            : 'border-white/20 bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${method.color}`}>
                            <method.icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {method.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {method.processingTime}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={isProcessing || !amount || !selectedMethod}
                  className="w-full h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm"
                >
                  {isProcessing ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Send Modal */}
      <AnimatePresence>
        {showSendModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/20 backdrop-blur-2xl rounded-2xl p-4 w-full max-w-sm border border-white/30 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Send {activeWallet === 'ngn' ? 'Naira' : 'Bitcoin'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSendModal(false)}
                  className="bg-white/20 hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-white/20 border-white/30 focus:border-white/50 h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">
                    {activeWallet === 'ngn' ? 'Recipient Email/Phone' : 'Bitcoin Address'}
                  </Label>
                  <Input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={activeWallet === 'ngn' ? 'Enter email or phone' : 'Enter Bitcoin address'}
                    className="bg-white/20 border-white/30 focus:border-white/50 h-9"
                  />
                </div>

                <div>
                  <Label className="text-sm text-gray-700 dark:text-gray-300">Description (Optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a note..."
                    className="bg-white/20 border-white/30 focus:border-white/50"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSend}
                  disabled={isProcessing || !amount || !recipient}
                  className="w-full h-9 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm"
                >
                  {isProcessing ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
