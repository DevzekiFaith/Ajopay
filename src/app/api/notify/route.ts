import { NextRequest, NextResponse } from "next/server";

// Body: { to: string, type: 'sms' | 'push', message: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { to, type, message, from } = body || {};
    if (!to || !type || !message) {
      return NextResponse.json({ error: "to, type, and message are required" }, { status: 400 });
    }

    if (type === "sms") {
      const termiiKey = process.env.TERMII_API_KEY;
      const termiiFrom = process.env.TERMII_SENDER_ID || from || "Ajopay";
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_FROM || from;

      // Prefer Termii if configured (Nigeria-focused), else fallback to Twilio
      if (termiiKey) {
        const res = await fetch("https://api.ng.termii.com/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: termiiKey,
            to,
            from: termiiFrom,
            sms: message,
            type: "plain",
            channel: "generic",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return NextResponse.json({ error: data?.message || "Termii send failed" }, { status: 500 });
        return NextResponse.json({ status: "sent", provider: "termii", id: data?.message_id || null });
      } else if (twilioSid && twilioToken && twilioFrom) {
        const params = new URLSearchParams({ Body: message, From: twilioFrom, To: to });
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return NextResponse.json({ error: data?.message || "Twilio send failed" }, { status: 500 });
        return NextResponse.json({ status: "sent", provider: "twilio", sid: data?.sid || null });
      }
    }

    // If no provider configured or non-SMS type, accept and no-op
    return NextResponse.json({ status: "accepted" }, { status: 202 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
