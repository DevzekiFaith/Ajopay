"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  User, 
  Mail, 
  Phone,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

interface UserSearchProps {
  onUserSelect: (user: User | null) => void;
  selectedUser: User | null;
  placeholder?: string;
  className?: string;
}

export function UserSearch({ 
  onUserSelect, 
  selectedUser,
  placeholder = "Search by email or phone number",
  className = ""
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(searchQuery.trim());
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchUsers = async (query: string) => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.users || []);
        setShowResults(true);
      } else {
        setSearchError(data.error || 'Search failed');
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('User search error:', error);
      setSearchError('Network error. Please try again.');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setSearchQuery(user.email);
    setShowResults(false);
    setSearchResults([]);
  };

  const clearSelection = () => {
    onUserSelect(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const getDisplayName = (user: User) => {
    return user.full_name || user.email.split('@')[0];
  };

  const getDisplayInfo = (user: User) => {
    if (user.full_name) {
      return user.email;
    }
    return user.phone ? `Phone: ${user.phone}` : 'No additional info';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Label className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 block">
        Recipient
      </Label>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-white/20 border-white/30 focus:border-white/50 h-8 sm:h-9 text-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
        {selectedUser && !isSearching && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-white/20"
          >
            ×
          </Button>
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl max-h-60 overflow-hidden"
          >
            {searchError ? (
              <div className="p-4 text-center">
                <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-600">{searchError}</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center">
                <User className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No users found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching by email or phone number
                </p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <motion.button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/20 transition-colors border-b border-white/10 last:border-b-0"
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-800 dark:text-white text-sm">
                          {getDisplayName(user)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {getDisplayInfo(user)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected User Display */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-green-500/20 border border-green-500/30 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200 text-sm">
                {getDisplayName(selectedUser)}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {selectedUser.email}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
              Selected
            </Badge>
          </div>
        </motion.div>
      )}
    </div>
  );
}
