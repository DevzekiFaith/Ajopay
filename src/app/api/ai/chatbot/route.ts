import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!openai) {
      return NextResponse.json({ 
        error: "OpenAI API key not configured",
        fallback: "I'm currently unavailable. Please contact support at support@ajopay.com or call +234-XXX-XXXX."
      }, { status: 503 });
    }

    // Get user context if userId is provided
    let userContext = "";
    if (userId) {
      // You can add user-specific context here
      userContext = `User ID: ${userId}. `;
    }

    const systemPrompt = `You are Ajopay AI Assistant, a helpful customer support bot for Ajopay - a microfinance savings platform in Nigeria. 

Your role:
- Help users with savings, payments, account issues, and general questions
- Provide friendly, professional responses in a conversational tone
- Be knowledgeable about microfinance, savings, and financial planning
- If you don't know something, suggest contacting support
- Keep responses concise but helpful
- Use Nigerian context when relevant (Naira currency, local banking, etc.)

Common topics you can help with:
- How to save money on Ajopay
- Payment issues and troubleshooting
- Account balance and transaction history
- Savings goals and planning
- Security and account safety
- App features and navigation

${userContext}Respond to the user's question: "${message}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";

    // Generate speech for the response
    let audioUrl = null;
    try {
      const speechResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: response,
      });

      // Convert the response to a base64 data URL for the frontend
      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      const base64Audio = audioBuffer.toString('base64');
      audioUrl = `data:audio/mp3;base64,${base64Audio}`;
    } catch (speechError) {
      console.warn("Speech generation failed:", speechError);
      // Continue without audio if speech fails
    }

    return NextResponse.json({ 
      response,
      audioUrl,
      timestamp: new Date().toISOString(),
      model: "gpt-3.5-turbo"
    });

  } catch (error: any) {
    console.error("Chatbot error:", error);
    
    // Fallback response if OpenAI is unavailable
    return NextResponse.json({ 
      error: "AI service temporarily unavailable",
      fallback: "I'm currently unavailable. Please contact our support team at support@ajopay.com or call +234-XXX-XXXX for immediate assistance.",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
