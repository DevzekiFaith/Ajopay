import { NextResponse } from "next/server";
import { paystackService } from "@/lib/paystack";

export async function POST(request: Request) {
  try {
    const { bankCode, accountNumber } = await request.json();

    if (!bankCode || !accountNumber) {
      return NextResponse.json({ error: "bankCode and accountNumber are required" }, { status: 400 });
    }

    if (!paystackService.isConfigured()) {
      return NextResponse.json({ error: "Paystack is not configured" }, { status: 500 });
    }

    const result = await paystackService.verifyBankAccount(accountNumber, bankCode);
    if (!result?.status) {
      return NextResponse.json({ error: result?.message || "Failed to resolve account" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      accountName: result.data?.account_name,
      accountNumber: result.data?.account_number,
      bankCode,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}



