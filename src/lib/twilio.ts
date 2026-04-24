import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  return twilio(accountSid, authToken);
}

export function getTwilioPhoneNumber(): string {
  if (!twilioPhoneNumber) {
    throw new Error('TWILIO_PHONE_NUMBER not configured');
  }
  return twilioPhoneNumber;
}

export async function makeCall(
  to: string,
  answerUrl: string,
  statusUrl: string
): Promise<{ sid: string; status: string }> {
  const client = getClient();
  const from = getTwilioPhoneNumber();

  const call = await client.calls.create({
    to,
    from,
    url: answerUrl,
    method: 'POST',
    statusCallback: statusUrl,
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallbackMethod: 'POST',
  });

  return { sid: call.sid, status: call.status };
}

export { twilio };
