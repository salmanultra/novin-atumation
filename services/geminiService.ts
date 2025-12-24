
export const draftLetterWithAI = async (topic: string, senderName: string, receiverName: string): Promise<string> => {
  // Pollinations AI does not require an API Key.
  // It functions via a simple HTTP GET/POST request.

  const prompt = `
    You are an expert secretary in a formal Iranian office.
    Please write a formal business letter in Persian (Farsi).
    
    Details:
    Sender: ${senderName}
    Receiver: ${receiverName}
    Topic: ${topic}
    
    The tone should be very polite, formal, and strictly professional using standard administrative terminology (e.g., 'احتراماً', 'به استحضار می‌رساند', 'مزید امتنان').
    Do not include placeholders like [Date] or [Signature], just the body and closing.
    Return ONLY the text of the letter. Do not add any English introduction.
  `;

  try {
    // Using 'openai' model via Pollinations for better reasoning capabilities in Persian
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const text = await response.text();
    return text || "خطا در تولید متن.";
  } catch (error) {
    console.error("Pollinations AI Error:", error);
    return "خطا در ارتباط با هوش مصنوعی. لطفاً اتصال اینترنت خود را بررسی کنید (ممکن است نیاز به تغییر IP باشد).";
  }
};
