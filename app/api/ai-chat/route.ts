import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// AI Chat API Route (Gemini)
// =============================================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, history } = body as {
      message: string;
      context: string;
      history: ChatMessage[];
    };

    if (!message) {
      return NextResponse.json(
        { error: "נדרשת הודעה" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!GEMINI_API_KEY) {
      console.warn("[AI Chat] No GEMINI_API_KEY configured, using fallback response");
      
      // Return a helpful fallback response
      return NextResponse.json({
        response: generateFallbackResponse(message, context),
        source: "fallback",
      });
    }

    // Build the prompt
    const systemPrompt = `אתה אנליסט נדל"ן מקצועי ומנוסה המתמחה בשוק הבריטי.
תפקידך לספק ניתוח מעמיק והמלצות מבוססות נתונים למשקיעים.

הנחיות:
- ענה תמיד בעברית
- היה מקצועי ומדויק
- ציין כשמידע חסר או לא מספק
- תן המלצות מעשיות כשרלוונטי
- השתמש בנתונים הזמינים לניתוח

נתוני הנכס הנוכחי:
${context}`;

    // Build conversation history
    const conversationParts = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Add current message
    conversationParts.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }],
          },
          ...conversationParts,
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Chat] Gemini API Error:", response.status, errorText);
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: "חריגה ממכסת הבקשות, נסה שוב מאוחר יותר" },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: `שגיאת API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      console.error("[AI Chat] No response text in Gemini response:", data);
      return NextResponse.json({
        response: "לא התקבלה תשובה מה-AI. נסה שוב.",
        source: "error",
      });
    }

    return NextResponse.json({
      response: responseText,
      source: "gemini",
    });

  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json(
      { error: "שגיאה בעיבוד הבקשה" },
      { status: 500 }
    );
  }
}

// =============================================================================
// Fallback Response Generator (when no API key)
// =============================================================================

function generateFallbackResponse(message: string, context: string): string {
  const messageLower = message.toLowerCase();
  
  // Extract some data from context
  const epcMatch = context.match(/דירוג אנרגטי: ([A-G])/);
  const priceMatch = context.match(/מחיר ממוצע.*?: £([\d,]+)/);
  const areaMatch = context.match(/שטח כולל: (\d+)/);
  const crimeMatch = context.match(/רמת סיכון: (\S+)/);
  
  const epc = epcMatch?.[1];
  const avgPrice = priceMatch?.[1];
  const area = areaMatch?.[1];
  const crimeRisk = crimeMatch?.[1];
  
  // Generate contextual response
  if (messageLower.includes("השקעה") || messageLower.includes("פוטנציאל")) {
    let response = "**ניתוח פוטנציאל ההשקעה:**\n\n";
    
    if (epc) {
      response += `דירוג ה-EPC הנוכחי הוא ${epc}. `;
      if (["E", "F", "G"].includes(epc)) {
        response += "זהו דירוג נמוך שעשוי להצריך השקעה בשיפור יעילות אנרגטית, אך מציע פוטנציאל לעליית ערך לאחר שיפוץ.\n\n";
      } else if (["A", "B", "C"].includes(epc)) {
        response += "זהו דירוג טוב שמעיד על נכס יעיל אנרגטית ואטרקטיבי לשוכרים.\n\n";
      }
    }
    
    if (crimeRisk) {
      response += `רמת הפשיעה באזור: ${crimeRisk}. `;
      if (crimeRisk === "נמוך") {
        response += "זהו יתרון משמעותי להשכרה לטווח ארוך.\n\n";
      }
    }
    
    response += "\n*שים לב: להפעלת ניתוח AI מלא, הוסף מפתח GEMINI_API_KEY לקובץ .env.local*";
    return response;
  }
  
  if (messageLower.includes("מחיר") || messageLower.includes("שוק")) {
    let response = "**ניתוח מחירים:**\n\n";
    if (avgPrice) {
      response += `המחיר הממוצע באזור הוא £${avgPrice}.\n`;
      if (area) {
        const priceNum = parseInt(avgPrice.replace(/,/g, ""));
        const areaNum = parseInt(area);
        if (priceNum && areaNum) {
          response += `מחיר למ"ר: £${Math.round(priceNum / areaNum).toLocaleString()}\n`;
        }
      }
    } else {
      response += "לא נמצאו נתוני מחירים עדכניים עבור אזור זה.\n";
    }
    return response;
  }
  
  if (messageLower.includes("סיכון") || messageLower.includes("בעיה")) {
    let response = "**ניתוח סיכונים:**\n\n";
    
    if (crimeRisk) {
      response += `- **פשיעה**: רמת סיכון ${crimeRisk}\n`;
    }
    if (epc && ["E", "F", "G"].includes(epc)) {
      response += `- **אנרגיה**: דירוג EPC נמוך (${epc}) עלול להשפיע על ערך הנכס ועלויות תפעול\n`;
    }
    
    response += "\n*להפעלת ניתוח מקיף יותר, הוסף מפתח Gemini API*";
    return response;
  }
  
  if (messageLower.includes("epc") || messageLower.includes("אנרגיה")) {
    if (epc) {
      const epcInfo: Record<string, string> = {
        "A": "מעולה - הנכס יעיל מאוד אנרגטית, עלויות חימום/קירור נמוכות",
        "B": "טוב מאוד - יעילות גבוהה עם מקום קטן לשיפור",
        "C": "טוב - יעילות סבירה, מתאים לרוב הדיירים",
        "D": "בינוני - ממוצע ארצי, יש מקום לשיפור",
        "E": "נמוך - עלויות אנרגיה גבוהות, מומלץ לשפר",
        "F": "חלש - דורש שיפוץ אנרגטי משמעותי",
        "G": "חלש מאוד - עלויות גבוהות, חובה לשפר לפני השכרה",
      };
      return `**דירוג EPC: ${epc}**\n\n${epcInfo[epc] || "לא ידוע"}\n\n${area ? `שטח הנכס: ${area} מ"ר` : ""}`;
    }
    return "לא נמצאו נתוני EPC עבור נכס זה.";
  }
  
  // Default response
  return `אני יכול לעזור לך לנתח את הנכס!

**נתונים זמינים:**
${epc ? `- דירוג EPC: ${epc}` : ""}
${avgPrice ? `- מחיר ממוצע: £${avgPrice}` : ""}
${area ? `- שטח: ${area} מ"ר` : ""}
${crimeRisk ? `- רמת פשיעה: ${crimeRisk}` : ""}

**שאלות מומלצות:**
- מה הפוטנציאל להשקעה בנכס זה?
- האם המחיר תואם את השוק?
- מהם הסיכונים העיקריים?

*להפעלת ניתוח AI מתקדם, הוסף GEMINI_API_KEY לקובץ .env.local*`;
}
