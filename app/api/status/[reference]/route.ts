import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/lenco-module/lib/lenco";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    if (!reference) {
      return NextResponse.json(
        { status: false, message: "Payment reference is required" },
        { status: 400 }
      );
    }

    const result = await getPaymentStatus(reference);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[/api/status] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ status: false, message }, { status: 500 });
  }
}
