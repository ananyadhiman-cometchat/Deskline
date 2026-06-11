import { GoogleGenAI } from '@google/genai';

/**
 * Generate an AI response for an information ticket.
 * If the GEMINI_API_KEY is not configured, returns a fallback response.
 */
export async function generateTicketResponse(title: string, description: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Returning fallback AI response.');
    return `**[Automated AI Response - Mock Mode]**

I understand you're asking about "${title}". 

Based on our internal policies and guidelines regarding your query:
${description}

Since the AI API key isn't configured in this environment, I cannot provide a specific answer. Please request human help if this didn't answer your question.`;
  }

  // Initialize inside the function to avoid module-level crash if key is missing
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `You are a helpful IT and HR support assistant for a company using DeskLine.
A user has submitted an "Information" ticket with the following details:

Title: ${title}
Description: ${description}

Please provide a clear, concise, and helpful response. Be polite and professional. 
Format your response nicely using Markdown (bullet points, bold text where appropriate).
If the request is vague, provide general guidance and suggest they request human help.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text ?? 'I apologize, but I was unable to generate a response at this time. Please request human help.';
  } catch (error) {
    console.error('Failed to generate AI response:', error);
    return 'I apologize, but an error occurred while connecting to the AI service. Please request human help.';
  }
}
