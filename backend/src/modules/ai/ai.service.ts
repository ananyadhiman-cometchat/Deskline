import OpenAI from 'openai';

/**
 * Generate an AI response for an information ticket using Groq.
 * Uses Groq's OpenAI-compatible API with llama-3.3-70b-versatile.
 */
export async function generateTicketResponse(title: string, description: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn('[AI] GROQ_API_KEY is not set. Returning fallback response.');
    return `**[Automated AI Response - Mock Mode]**

I understand you're asking about "${title}".

Based on our internal policies and guidelines regarding your query:
${description}

Since the AI API key isn't configured in this environment, I cannot provide a specific answer. Please request human help if this didn't answer your question.`;
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a helpful IT and HR support assistant for a company using DeskLine. 
Provide clear, concise, and helpful responses. Be polite and professional.
Keep responses brief (2-4 paragraphs max). Use plain text formatting.
If the request is vague, provide general guidance and suggest they request human help.`,
        },
        {
          role: 'user',
          content: `Ticket Title: ${title}\n\n${description}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content ?? 'I was unable to generate a response. Please request human help.';
  } catch (error) {
    console.error('[AI] Groq API error:', error instanceof Error ? error.message : error);
    return 'I apologize, but an error occurred while connecting to the AI service. Please request human help.';
  }
}
