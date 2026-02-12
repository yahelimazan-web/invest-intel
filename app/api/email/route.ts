import { NextRequest, NextResponse } from "next/server";
import {
  sendMonthlyInsightsEmail,
  sendTestEmail,
} from "../../lib/email-service";

// =============================================================================
// Email API Route
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userEmail, userName, insights } = body;

    if (action === "test") {
      if (!userEmail || !userName) {
        return NextResponse.json(
          { success: false, error: "userEmail and userName are required" },
          { status: 400 },
        );
      }

      const result = await sendTestEmail(userEmail, userName);
      return NextResponse.json(result);
    }

    if (action === "monthly") {
      if (!userEmail || !userName || !insights) {
        return NextResponse.json(
          {
            success: false,
            error: "userEmail, userName, and insights are required",
          },
          { status: 400 },
        );
      }

      const result = await sendMonthlyInsightsEmail(
        userEmail,
        userName,
        insights,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'test' or 'monthly'" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[Email API] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
