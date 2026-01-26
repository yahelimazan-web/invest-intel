"use server";

// Note: This file uses "use server" for Resend email service
// Make sure to install: npm install resend

// =============================================================================
// Email Service using Resend
// =============================================================================

interface MonthlyInsights {
  portfolioGrowth: number;
  portfolioValue: number;
  newInfrastructureAlert?: {
    propertyAddress: string;
    infrastructureType: string;
    distance: string;
  };
  soldNearbyAlert?: {
    propertyAddress: string;
    soldPrice: number;
    soldDate: string;
    distance: string;
  };
  month: string;
  year: number;
}

/**
 * Send monthly insights email to user
 */
export async function sendMonthlyInsightsEmail(
  userEmail: string,
  userName: string,
  insights: MonthlyInsights
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("[Email] RESEND_API_KEY not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    // Dynamic import of Resend
    const { Resend } = await import("resend");
    const resend = new Resend(resendApiKey);

    // Hebrew month names
    const monthNames: Record<string, string> = {
      "01": "ינואר",
      "02": "פברואר",
      "03": "מרץ",
      "04": "אפריל",
      "05": "מאי",
      "06": "יוני",
      "07": "יולי",
      "08": "אוגוסט",
      "09": "ספטמבר",
      "10": "אוקטובר",
      "11": "נובמבר",
      "12": "דצמבר",
    };

    const monthName = monthNames[insights.month] || insights.month;
    const subject = `📊 הדוח החודשי שלך ל-InvestIntel - ${monthName} ${insights.year}`;

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("he-IL", {
        style: "currency",
        currency: "ILS",
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>דוח חודשי - InvestIntel</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0B0E14; color: #E8EAED; margin: 0; padding: 0; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #151921; border: 1px solid #2D333F;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00C805 0%, #00A004 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">InvestIntel</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">מודיעין נדלן מקצועי</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <h2 style="color: #00C805; margin: 0 0 20px 0; font-size: 20px;">שלום ${userName},</h2>
      
      <p style="color: #E8EAED; line-height: 1.6; margin: 0 0 25px 0;">
        הנה סיכום החודש שלך:
      </p>

      <!-- Portfolio Growth -->
      <div style="background-color: #1D2430; border: 1px solid #2D333F; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #00C805; margin: 0 0 10px 0; font-size: 16px;">📈 צמיחת תיק</h3>
        <p style="color: #E8EAED; margin: 5px 0; font-size: 14px;">
          <strong>שווי תיק:</strong> ${formatCurrency(insights.portfolioValue)}
        </p>
        <p style="color: ${insights.portfolioGrowth >= 0 ? '#00C805' : '#ef4444'}; margin: 5px 0; font-size: 18px; font-weight: bold;">
          ${insights.portfolioGrowth >= 0 ? '+' : ''}${insights.portfolioGrowth.toFixed(1)}% החודש
        </p>
      </div>

      ${insights.newInfrastructureAlert ? `
      <!-- Infrastructure Alert -->
      <div style="background-color: #1D2430; border: 1px solid #2D333F; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #00C805; margin: 0 0 10px 0; font-size: 16px;">🏗️ תשתית חדשה</h3>
        <p style="color: #E8EAED; margin: 5px 0; font-size: 14px; line-height: 1.6;">
          <strong>${insights.newInfrastructureAlert.propertyAddress}</strong><br>
          ${insights.newInfrastructureAlert.infrastructureType} במרחק ${insights.newInfrastructureAlert.distance}
        </p>
      </div>
      ` : ''}

      ${insights.soldNearbyAlert ? `
      <!-- Sold Nearby Alert -->
      <div style="background-color: #1D2430; border: 1px solid #2D333F; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #00C805; margin: 0 0 10px 0; font-size: 16px;">💰 מכירה קרובה</h3>
        <p style="color: #E8EAED; margin: 5px 0; font-size: 14px; line-height: 1.6;">
          <strong>${insights.soldNearbyAlert.propertyAddress}</strong><br>
          נמכר ב-${formatCurrency(insights.soldNearbyAlert.soldPrice)} (${insights.soldNearbyAlert.soldDate})<br>
          במרחק ${insights.soldNearbyAlert.distance}
        </p>
      </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://investintel.com'}/dashboard" 
           style="display: inline-block; background: linear-gradient(135deg, #00C805 0%, #00A004 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          צפה בדוח המלא →
        </a>
      </div>

      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 30px 0 0 0; line-height: 1.6;">
        זהו דוח אוטומטי מ-InvestIntel<br>
        לקבלת עדכונים נוספים, בקר באתר שלנו
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #0B0E14; padding: 20px; text-align: center; border-top: 1px solid #2D333F;">
      <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
        © 2026 InvestIntel. כל הזכויות שמורות.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    const result = await resend.emails.send({
      from: "InvestIntel <onboarding@resend.dev>",
      to: userEmail,
      subject: subject,
      html: htmlContent,
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Monthly insights sent successfully to:", userEmail);
    return { success: true };
  } catch (error: any) {
    console.error("[Email] Failed to send email:", error);
    return { success: false, error: error?.message || "Unknown error" };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(userEmail: string, userName: string): Promise<{ success: boolean; error?: string }> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const testInsights: MonthlyInsights = {
    portfolioGrowth: 2.5,
    portfolioValue: 2500000,
    newInfrastructureAlert: {
      propertyAddress: "רחוב דוגמה 12, תל אביב",
      infrastructureType: "תחנת רכבת חדשה",
      distance: "800 מטר",
    },
    soldNearbyAlert: {
      propertyAddress: "רחוב דוגמה 15, תל אביב",
      soldPrice: 3200000,
      soldDate: "15.01.2026",
      distance: "200 מטר",
    },
    month,
    year,
  };

  return await sendMonthlyInsightsEmail(userEmail, userName, testInsights);
}
