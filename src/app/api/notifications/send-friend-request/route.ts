import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { to, from_user_id, friend_name, app_url } = await request.json();

    if (!to || !from_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    
    // Get the sender's information
    const { data: senderData, error: senderError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', from_user_id)
      .single();

    if (senderError || !senderData) {
      console.error('Error fetching sender data:', senderError);
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    const senderName = senderData.full_name || 'AjoPay User';
    const recipientName = friend_name || 'Friend';

    // Email content
    const emailSubject = `🎉 ${senderName} wants to be friends on AjoPay!`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Friend Request on AjoPay</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
          .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 Friend Request!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Join the savings challenge!</p>
          </div>
          
          <div class="content">
            <h2>Hi ${recipientName}! 👋</h2>
            
            <p><strong>${senderName}</strong> wants to be friends with you on AjoPay and start some amazing savings challenges together!</p>
            
            <div class="highlight">
              <strong>🚀 What you can do together:</strong>
              <ul>
                <li>Create savings challenges and compete with friends</li>
                <li>Track progress and celebrate achievements</li>
                <li>Earn rewards and bonuses together</li>
                <li>Build better financial habits as a team</li>
              </ul>
            </div>
            
            <p>Click the button below to accept the friend request and start your savings journey:</p>
            
            <div style="text-align: center;">
              <a href="${app_url}/peer-challenges" class="button">Accept Friend Request</a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
              If you don't have an AjoPay account yet, you can sign up for free and start saving with friends immediately!
            </p>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="${app_url}/sign-up" class="button" style="background: #10b981;">Sign Up for Free</a>
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent because ${senderName} wants to connect with you on AjoPay.</p>
            <p>If you didn't expect this email, you can safely ignore it.</p>
            <p style="margin-top: 20px;">
              <strong>AjoPay</strong> - Empowering Africa's Future through Savings<br>
              <a href="${app_url}" style="color: #8B5CF6;">Visit AjoPay</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // For now, we'll simulate email sending
    // In production, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    
    console.log('📧 Friend Request Email Details:');
    console.log('To:', to);
    console.log('From:', senderName);
    console.log('Subject:', emailSubject);
    console.log('App URL:', app_url);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, you would send the email here:
    /*
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to, name: recipientName }],
          subject: emailSubject,
        }],
        from: { email: 'noreply@ajopay.com', name: 'AjoPay' },
        content: [{
          type: 'text/html',
          value: emailBody,
        }],
      }),
    });
    */

    return NextResponse.json({ 
      success: true, 
      message: 'Friend request email sent successfully',
      recipient: to,
      sender: senderName
    });

  } catch (error) {
    console.error('Friend request email error:', error);
    return NextResponse.json({ 
      error: 'Failed to send friend request email' 
    }, { status: 500 });
  }
}
