import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          response: "I'm a helpful AI assistant for Ajopay. I can help you with savings tips, account questions, and financial advice. How can I assist you today?",
          audioUrl: null
        }
      );
    }

    // Get the latest Gemini Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Create a context-aware prompt for Ajopay
    const prompt = `You are a helpful AI assistant for Ajopay, a savings and financial app. 
    
    Context: The user is asking about their savings, financial goals, or general questions.
    
    Guidelines:
    - Be encouraging and supportive about savings
    - Provide practical financial advice
    - Keep responses concise (under 150 words)
    - Use emojis sparingly but effectively
    - Focus on actionable tips
    - Be friendly and approachable
    
    User message: ${message}
    
    Respond as Ajopay's AI assistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      response: text,
      audioUrl: null // Gemini doesn't have built-in TTS, but we can add it later
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      { 
        response: "I'm having trouble connecting right now. Please try again in a moment, or contact our support team for immediate assistance.",
        audioUrl: null
      },
      { status: 500 }
    );
  }
}
