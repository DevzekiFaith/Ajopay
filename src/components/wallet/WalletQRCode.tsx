'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';

interface WalletQRCodeProps {
  address: string;
  label?: string;
  isCrypto?: boolean;
  className?: string;
}

export function WalletQRCode({ address, label = 'Wallet Address', isCrypto = false, className = '' }: WalletQRCodeProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Generate QR code when dialog opens or address changes
  useEffect(() => {
    if (isOpen && address) {
      const generateQR = async () => {
        try {
          const url = await QRCode.toDataURL(address, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          setQrDataUrl(url);
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      };

      generateQR();
    }
  }, [address, isOpen]);

  const copyToClipboard = () => {
    if (!address) return;
    
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy address');
    });
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const fileName = `wallet-${isCrypto ? 'crypto' : 'ngn'}-${new Date().toISOString().slice(0, 10)}.png`;
    saveAs(qrDataUrl, fileName);
  };

  if (!address) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <QrCode className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label} QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {qrDataUrl ? (
            <div className="p-2 bg-white rounded-lg">
              <img 
                src={qrDataUrl} 
                alt="Wallet QR Code" 
                className="w-full max-w-xs h-auto"
              />
            </div>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="animate-pulse text-gray-400">Generating QR code...</div>
            </div>
          )}
          
          <div className="w-full relative">
            <Input 
              value={address} 
              readOnly 
              className="pr-16 font-mono text-sm"
            />
            <Button 
              size="sm" 
              variant="outline" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={copyToClipboard}
              disabled={copied}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy address</span>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to {isCrypto ? 'receive cryptocurrency' : 'receive payments'}
          </p>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={downloadQRCode}
              disabled={!qrDataUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Save QR Code
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                copyToClipboard();
                setIsOpen(false);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
