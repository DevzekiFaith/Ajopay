"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Check, 
  ChevronDown, 
  Building2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { NigerianBank } from "@/lib/banks";

interface BankSelectorProps {
  selectedBank: NigerianBank | null;
  onBankSelect: (bank: NigerianBank) => void;
  placeholder?: string;
  className?: string;
}

export function BankSelector({ 
  selectedBank, 
  onBankSelect, 
  placeholder = "Select a bank",
  className = ""
}: BankSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [banks, setBanks] = useState<NigerianBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredBanks, setFilteredBanks] = useState<NigerianBank[]>([]);
  const [supportedBanks, setSupportedBanks] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load banks on component mount
  useEffect(() => {
    loadBanks();
    loadSupportedBanks();
  }, []);

  // Filter banks based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBanks(banks);
    } else {
      const filtered = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.code.includes(searchQuery) ||
        bank.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBanks(filtered);
    }
  }, [searchQuery, banks]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/banks/list');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBanks(data.data);
        setFilteredBanks(data.data);
      } else {
        toast.error('Failed to load banks');
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      toast.error('Failed to load banks');
    } finally {
      setLoading(false);
    }
  };

  const loadSupportedBanks = async () => {
    try {
      const response = await fetch('/api/banks/paystack-supported');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const supportedCodes = data.supportedBanks.map((bank: any) => bank.code);
        setSupportedBanks(supportedCodes);
      }
    } catch (error) {
      console.error('Error loading supported banks:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  const handleBankSelect = (bank: NigerianBank) => {
    onBankSelect(bank);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 block">
        Bank
      </Label>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between bg-white/20 border-white/30 hover:bg-white/30 h-8 sm:h-9 text-sm"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-600" />
          <span className="truncate">
            {selectedBank ? selectedBank.name : placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl max-h-80 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-white/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search banks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/20 border-white/30 focus:border-white/50 h-8 text-sm"
                />
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-500 text-white">Paystack ✓</Badge>
                  <span>Auto-verified</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-orange-500 text-orange-500">Manual</Badge>
                  <span>Manual verification</span>
                </div>
              </div>
            </div>

            {/* Banks List */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading banks...</span>
                </div>
              ) : filteredBanks.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No banks found matching "{searchQuery}"
                </div>
              ) : (
                filteredBanks.map((bank) => (
                  <motion.button
                    key={bank.code}
                    onClick={() => handleBankSelect(bank)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/20 transition-colors border-b border-white/10 last:border-b-0"
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800 dark:text-white text-sm">
                          {bank.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {bank.code}
                          </Badge>
                          {supportedBanks.includes(bank.code) ? (
                            <Badge variant="default" className="text-xs px-2 py-0.5 bg-green-500 text-white">
                              Paystack ✓
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 border-orange-500 text-orange-500">
                              Manual
                            </Badge>
                          )}
                          {bank.ussd && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                              {bank.ussd}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedBank?.code === bank.code && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
