import { NextResponse } from "next/server";

export async function GET() {
  try {

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey || paystackSecretKey === 'sk_live_your_live_secret_key_here') {
      return NextResponse.json({
        success: false,
        error: 'Paystack not configured',
        supportedBanks: [],
        message: 'Please configure your Paystack keys to fetch supported banks'
      });
    }

    // Fetch supported banks from Paystack
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Paystack banks API error:', errorData);
      return NextResponse.json(
        { 
          success: false,
          error: errorData.message || 'Failed to fetch supported banks',
          supportedBanks: []
        },
        { status: 400 }
      );
    }

    const data = await response.json();
    
    if (!data.status) {
      return NextResponse.json(
        { 
          success: false,
          error: data.message || 'Failed to fetch supported banks',
          supportedBanks: []
        },
        { status: 400 }
      );
    }

    // Format the banks data
    const supportedBanks = data.data.map((bank: { name: string; code: string; slug: string; longcode: string; gateway: string; pay_with_bank: boolean; active: boolean; is_deleted: boolean; type: string; id: number; createdAt: string; updatedAt: string }) => ({
      name: bank.name,
      code: bank.code,
      slug: bank.slug,
      longcode: bank.longcode,
      gateway: bank.gateway,
      pay_with_bank: bank.pay_with_bank,
      active: bank.active,
      is_deleted: bank.is_deleted,
      country: bank.country,
      currency: bank.currency,
      type: bank.type
    }));

    return NextResponse.json({
      success: true,
      supportedBanks,
      count: supportedBanks.length,
      message: 'Supported banks fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching supported banks:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        supportedBanks: []
      },
      { status: 500 }
    );
  }
}
