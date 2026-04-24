const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export interface SMSOptions {
  to: string;
  body: string;
  from?: string;
}

export async function sendSMS(options: SMSOptions): Promise<{ success: boolean; sid?: string }> {
  const from = options.from || TWILIO_PHONE_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !from) {
    console.log('=== SMS (dev mode) ===');
    console.log(`To: ${options.to}`);
    console.log(`Body: ${options.body}`);
    console.log('======================');
    return { success: true, sid: `dev-sms-${Date.now()}` };
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const message = await client.messages.create({
      to: options.to,
      from,
      body: options.body,
    });

    console.log(`[SMS] Sent to ${options.to}: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error(`[SMS] Failed to send to ${options.to}:`, error.message);
    return { success: false };
  }
}
