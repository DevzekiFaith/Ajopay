import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format amount in kobo to Naira or crypto amount
 * @param amountKobo Amount in kobo (1 NGN = 100 kobo)
 * @param isCrypto Whether the amount is in crypto (default: false)
 * @param decimals Number of decimal places to show (for crypto)
 * @returns Formatted amount string
 */
export function formatAmount(
  amountKobo: number,
  isCrypto = false,
  decimals = 8
): string {
  if (isCrypto) {
    // For crypto, we treat the amount as the smallest unit (like satoshis for BTC)
    const cryptoAmount = amountKobo / 100000000; // Assuming 8 decimal places for most cryptos
    return cryptoAmount.toFixed(decimals);
  }
  
  // For fiat (NGN)
  return (amountKobo / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date consistently across the app
 * @param date Date string or Date object
 * @param formatStr Format string (default: 'MMM d, yyyy h:mm a')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Truncate a string in the middle with ellipsis
 * @param str String to truncate
 * @param startChars Number of characters to show at the start
 * @param endChars Number of characters to show at the end
 * @returns Truncated string with ellipsis in the middle
 */
export function truncateMiddle(
  str: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!str || str.length <= startChars + endChars) return str;
  return `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`;
}

/**
 * Format a number with commas as thousand separators
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}
