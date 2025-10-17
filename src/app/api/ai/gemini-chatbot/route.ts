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

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      // Provide contextual responses based on common questions
      const lowerMessage = message.toLowerCase();
      
      if (lowerMessage.includes('savings') || lowerMessage.includes('save money') || lowerMessage.includes('saving goals')) {
        return NextResponse.json({
          response: "Great question about savings! 💰 Ajopay helps you save money through digital microfinance. You can set savings goals, join savings circles, and track your progress. Would you like to know more about any specific feature?",
          audioUrl: null
        });
      } else if (lowerMessage.includes('payment') || lowerMessage.includes('pay for') || lowerMessage.includes('transaction')) {
        return NextResponse.json({
          response: "For payment-related questions, Ajopay supports secure digital payments. You can make contributions, pay for subscriptions, and manage your transactions safely. Need help with a specific payment issue?",
          audioUrl: null
        });
      } else if (lowerMessage.includes('account') || lowerMessage.includes('balance') || lowerMessage.includes('dashboard')) {
        return NextResponse.json({
          response: "To check your account balance and details, please log into your Ajopay dashboard. You'll see your savings progress, transaction history, and account information there. Need help accessing your account?",
          audioUrl: null
        });
      } else if (lowerMessage.includes('trial') || lowerMessage.includes('subscription') || lowerMessage.includes('free trial')) {
        return NextResponse.json({
          response: "Ajopay offers a free trial to get you started! You can explore all features during your trial period. After that, you can subscribe to continue using the full platform. Ready to start your savings journey?",
          audioUrl: null
        });
      } else if (lowerMessage.includes('what is ajopay') || lowerMessage.includes('about ajopay') || lowerMessage.includes('ajopay is')) {
        return NextResponse.json({
          response: "Ajopay is a digital microfinance platform that helps you save money, set financial goals, and manage your finances effectively. It's designed to make saving easier and more accessible for everyone. Ready to start your savings journey? 💪",
          audioUrl: null
        });
      } else {
        return NextResponse.json({
          response: "Hi! I'm Ajopay AI Assistant. I can help you with savings tips, account questions, and financial advice. Ask me about savings goals, payments, or how to get started with Ajopay! 💪",
          audioUrl: null
        });
      }
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
