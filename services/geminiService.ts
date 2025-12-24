import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    let apiKey = '';
    // Safely access process.env to avoid ReferenceError in some environments
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            // @ts-ignore
            apiKey = process.env.API_KEY || '';
        }
    } catch (e) {
        console.warn("Could not access process.env");
    }

    if (!apiKey) {
        console.warn("API Key not found. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const draftLetterWithAI = async (topic: string, senderName: string, receiverName: string): Promise<string> => {
  const client = getClient();
  if (!client) return "خطا: کلید API تنظیم نشده است. لطفاً تنظیمات سیستم را بررسی کنید.";

  const prompt = `
    You are an expert secretary in a formal Iranian office.
    Please write a formal business letter in Persian (Farsi).
    
    Details:
    Sender: ${senderName}
    Receiver: ${receiverName}
    Topic: ${topic}
    
    The tone should be very polite, formal, and strictly professional using standard administrative terminology (e.g., 'احتراماً', 'به استحضار می‌رساند', 'مزید امتنان').
    Do not include placeholders like [Date] or [Signature], just the body and closing.
    Return ONLY the text of the letter.
  `;

  try {
    const response = await client.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    return response.text || "خطا در تولید متن.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "خطا در ارتباط با هوش مصنوعی. لطفاً اتصال اینترنت خود را بررسی کنید.";
  }
};