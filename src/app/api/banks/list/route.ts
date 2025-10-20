import { NextResponse } from "next/server";
import { NIGERIAN_BANKS, searchBanks } from "@/lib/banks";

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let banks = NIGERIAN_BANKS;

    // If search query is provided, filter banks
    if (search) {
      banks = searchBanks(search);
    }

    return NextResponse.json({
      success: true,
      data: banks,
      count: banks.length,
      message: search ? `Found ${banks.length} banks matching "${search}"` : 'All Nigerian banks retrieved successfully'
    });

  } catch (error) {
    console.error('Banks list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
