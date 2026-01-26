import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// =============================================================================
// Gemini Chat API Route with Supabase Integration
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PropertyData {
  id: string;
  address: string;
  postcode: string;
  country: string;
  purchasePrice?: number;
  monthlyRent?: number;
  purchaseDate?: string;
  status?: string;
  floorArea?: number;
  energyRating?: string;
}

/**
 * Fetch user's property data from Supabase
 */
async function fetchUserProperties(userId: string): Promise<PropertyData[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("[Chat API] Supabase credentials not configured");
    return [];
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Set user context for RLS (if RPC exists)
    try {
      await supabase.rpc('set_user_context', { user_id_param: userId });
    } catch (rpcError) {
      // RPC might not exist, continue with service role key
      console.warn("[Chat API] set_user_context RPC not available");
    }

    // Fetch properties from properties table
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Chat API] Error fetching properties:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform property_data JSONB to PropertyData format
    const properties: PropertyData[] = data.map((row: any) => {
      const propData = row.property_data || {};
      return {
        id: row.id,
        address: propData.address || propData.name || "",
        postcode: propData.postcode || "",
        country: propData.country || "UK",
        purchasePrice: propData.purchasePrice || null,
        monthlyRent: propData.monthlyRent || null,
        purchaseDate: propData.purchaseDate || null,
        status: propData.status || "watching",
        floorArea: propData.floorArea || null,
        energyRating: propData.energyRating || null,
      };
    });

    return properties;
  } catch (error) {
    console.error("[Chat API] Failed to fetch properties:", error);
    return [];
  }
}

/**
 * Build system prompt with property data
 */
function buildSystemPrompt(properties: PropertyData[]): string {
  let prompt = `אתה עוזר השקעות נדל"ן מקצועי ומנוסה המתמחה בשוק הבריטי והבינלאומי.
תפקידך לספק ניתוח מעמיק והמלצות מבוססות נתונים למשקיעים.

הנחיות:
- ענה תמיד בעברית
- היה מקצועי ומדויק
- ציין כשמידע חסר או לא מספק
- תן המלצות מעשיות כשרלוונטי
- השתמש בנתונים הזמינים לניתוח
- אם המשתמש שואל על תיק ההשקעות כולו, השתמש בנתוני כל הנכסים
- אם המשתמש שואל על מסמכים, השתמש ברשימת המסמכים המצורפים
- אם המשתמש שואל על הכנסות/שכירות, חשב מהנתונים הזמינים

`;

  if (properties.length === 0) {
    prompt += `נתוני תיק ההשקעות:
אין נכסים בתיק כרגע. המשתמש יכול להוסיף נכסים דרך דף "הנכסים שלי".`;
  } else {
    prompt += `נתוני תיק ההשקעות (${properties.length} נכסים):\n\n`;
    
    properties.forEach((prop, index) => {
      prompt += `נכס ${index + 1}:
- כתובת: ${prop.address}
- מיקוד: ${prop.postcode}
- מדינה: ${prop.country}
- מחיר רכישה: ${prop.purchasePrice ? `£${prop.purchasePrice.toLocaleString()}` : "לא צוין"}
- שכירות חודשית: ${prop.monthlyRent ? `£${prop.monthlyRent.toLocaleString()}` : "לא צוין"}
- תאריך רכישה: ${prop.purchaseDate || "לא צוין"}
- סטטוס: ${prop.status || "watching"}
${prop.floorArea ? `- שטח: ${prop.floorArea} מ"ר` : ""}
${prop.energyRating ? `- דירוג אנרגטי: ${prop.energyRating}` : ""}

`;
    });

    // Calculate totals for quick reference
    const totalMonthlyRent = properties
      .filter(p => p.monthlyRent)
      .reduce((sum, p) => sum + (p.monthlyRent || 0), 0);
    
    const totalPurchasePrice = properties
      .filter(p => p.purchasePrice)
      .reduce((sum, p) => sum + (p.purchasePrice || 0), 0);

    const propertiesByCountry = properties.reduce((acc, p) => {
      acc[p.country] = (acc[p.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    prompt += `סיכום תיק ההשקעות:
- סה"כ שכירות חודשית: £${totalMonthlyRent.toLocaleString()}
- סה"כ שכירות שנתית: £${(totalMonthlyRent * 12).toLocaleString()}
- סה"כ הון מושקע: £${totalPurchasePrice.toLocaleString()}
- נכסים לפי מדינה: ${Object.entries(propertiesByCountry).map(([country, count]) => `${country}: ${count}`).join(", ")}

`;
  }

  prompt += `
דוגמאות לשאלות שתוכל לענות עליהן:
- "כמה שכירות אספתי ב-2024?" - חשב מהנתונים של כל הנכסים
- "מה התשואה הממוצעת שלי?" - חשב מהנתונים הפיננסיים
- "איזה נכסים יש לי בקפריסין?" - סנן לפי מדינה
- "מה סה"כ ההון שלי מושקע?" - סכום את מחירי הרכישה
- "איזה נכס הכי רווחי?" - השווה בין הנכסים בתיק`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, history = [] } = body as {
      message: string;
      userId: string;
      history?: ChatMessage[];
    };

    if (!message) {
      return NextResponse.json(
        { error: "נדרשת הודעה" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "נדרש מזהה משתמש" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!GEMINI_API_KEY) {
      console.warn("[Chat API] No GEMINI_API_KEY configured");
      return NextResponse.json(
        { error: "מפתח API לא מוגדר" },
        { status: 500 }
      );
    }

    // Fetch user's property data from Supabase
    const properties = await fetchUserProperties(userId);
    const systemPrompt = buildSystemPrompt(properties);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation history
    const chatHistory = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start chat with system prompt
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "הבנתי. אני מוכן לענות על שאלות על תיק ההשקעות שלך." }],
        },
        ...chatHistory,
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Send message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "לא התקבלה תשובה מה-AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: responseText,
      source: "gemini",
      propertiesCount: properties.length,
    });

  } catch (error: any) {
    console.error("[Chat API] Error:", error);
    
    // Handle specific Gemini API errors
    if (error.message?.includes("429")) {
      return NextResponse.json(
        { error: "חריגה ממכסת הבקשות, נסה שוב מאוחר יותר" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || "שגיאה בעיבוד הבקשה" },
      { status: 500 }
    );
  }
}
