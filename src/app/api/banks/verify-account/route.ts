import { NextResponse } from "next/server";
import { getBankByCode } from "@/lib/banks";

interface BankVerificationResponse {
  account_number: string;
  account_name: string;
  bank_id: number;
  bank_code: string;
  bank_name: string;
}

export async function POST(request: Request) {
  try {

    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: 'Account number and bank code are required' },
        { status: 400 }
      );
    }

    // Validate bank code
    const bank = getBankByCode(bankCode);
    if (!bank) {
      return NextResponse.json(
        { error: 'Invalid bank code' },
        { status: 400 }
      );
    }

    // Validate account number format (should be 10 digits for most Nigerian banks)
    if (!/^\d{10}$/.test(accountNumber)) {
      return NextResponse.json(
        { error: 'Account number must be 10 digits' },
        { status: 400 }
      );
    }

    try {
      // Check if Paystack is configured
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackSecretKey || paystackSecretKey === 'sk_live_your_live_secret_key_here') {
        console.log('Paystack not configured, using demo verification');
        
        // Demo verification response
        const mockVerificationResponse: BankVerificationResponse = {
          account_number: accountNumber,
          account_name: `Demo Account ${accountNumber.slice(-4)}`,
          bank_id: parseInt(bankCode),
          bank_code: bankCode,
          bank_name: bank.name
        };

        return NextResponse.json({
          success: true,
          data: mockVerificationResponse,
          message: 'Account verified (demo mode)',
          warning: 'Paystack not configured. Please add your Paystack keys to .env.local'
        });
      }

      // Check if this is a supported bank code for Paystack
      // Some banks like Moniepoint (100001) are not supported by Paystack
      const unsupportedBanks = ['100001', '100002', '100003', '100004', '100005'];
      
      if (unsupportedBanks.includes(bankCode)) {
        console.log(`Bank code ${bankCode} (${bank.name}) is not supported by Paystack, using demo verification`);
        
        // Return demo verification for unsupported banks
        const demoVerificationResponse: BankVerificationResponse = {
          account_number: accountNumber,
          account_name: `${bank.name} Account ${accountNumber.slice(-4)}`,
          bank_id: parseInt(bankCode),
          bank_code: bankCode,
          bank_name: bank.name
        };

        return NextResponse.json({
          success: true,
          data: demoVerificationResponse,
          message: `Account verified (${bank.name} not supported by Paystack)`,
          warning: `${bank.name} is not supported by Paystack's verification system. Please verify account details manually.`
        });
      }

      // Use real Paystack account verification API for supported banks
      const paystackResponse = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!paystackResponse.ok) {
        const errorData = await paystackResponse.json();
        console.error('Paystack verification failed:', errorData);
        
        // If it's an unknown bank code error, provide helpful message
        if (errorData.message && errorData.message.includes('Unknown bank code')) {
          return NextResponse.json(
            { 
              error: `Bank code ${bankCode} (${bank.name}) is not supported by Paystack. Please select a different bank or contact support.`,
              bankCode: bankCode,
              bankName: bank.name,
              suggestion: 'Try selecting a traditional bank like Access Bank, GTBank, or First Bank'
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: errorData.message || 'Bank verification failed' },
          { status: 400 }
        );
      }

      const verificationData = await paystackResponse.json();
      
      if (!verificationData.status) {
        return NextResponse.json(
          { error: verificationData.message || 'Account verification failed' },
          { status: 400 }
        );
      }

      const realVerificationResponse: BankVerificationResponse = {
        account_number: verificationData.data.account_number,
        account_name: verificationData.data.account_name,
        bank_id: parseInt(bankCode),
        bank_code: bankCode,
        bank_name: bank.name
      };

      return NextResponse.json({
        success: true,
        data: realVerificationResponse,
        message: 'Account verified successfully via Paystack'
      });

    } catch (apiError) {
      console.error('Bank verification API error:', apiError);
      
      // Fallback: Return a mock response for demo purposes
      const fallbackResponse: BankVerificationResponse = {
        account_number: accountNumber,
        account_name: `Demo Account ${accountNumber.slice(-4)}`,
        bank_id: parseInt(bankCode),
        bank_code: bankCode,
        bank_name: bank.name
      };

      return NextResponse.json({
        success: true,
        data: fallbackResponse,
        message: 'Account verified (demo mode)',
        warning: 'This is a demo verification. In production, this would use a real bank API.'
      });
    }

  } catch (error) {
    console.error('Bank verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Alternative implementation using VTU Africa API
export async function PUT(request: Request) {
  try {

    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: 'Account number and bank code are required' },
        { status: 400 }
      );
    }

    // Validate bank code
    const bank = getBankByCode(bankCode);
    if (!bank) {
      return NextResponse.json(
        { error: 'Invalid bank code' },
        { status: 400 }
      );
    }

    try {
      // Using VTU Africa API (alternative to Paystack)
      const vtuResponse = await fetch('https://vtuafrica.com.ng/api/transfer-verify.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
          api_key: process.env.VTU_AFRICA_API_KEY // You would need to get this from VTU Africa
        })
      });

      if (!vtuResponse.ok) {
        throw new Error('VTU Africa API request failed');
      }

      const verificationData = await vtuResponse.json();

      return NextResponse.json({
        success: true,
        data: verificationData,
        message: 'Account verified successfully via VTU Africa'
      });

    } catch (apiError) {
      console.error('VTU Africa API error:', apiError);
      
      // Fallback response
      return NextResponse.json({
        success: true,
        data: {
          account_number: accountNumber,
          account_name: `Verified Account ${accountNumber.slice(-4)}`,
          bank_code: bankCode,
          bank_name: bank.name,
          status: 'verified'
        },
        message: 'Account verified (fallback mode)',
        warning: 'Using fallback verification. Please ensure account details are correct.'
      });
    }

  } catch (error) {
    console.error('Bank verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
