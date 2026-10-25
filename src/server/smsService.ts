import { normalizePhone } from './utils/phone';

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  provider: 'twilio' | 'http_gateway' | 'development_fallback';
  delivered: boolean;
  notice?: string;
  error?: string;
}

export function isTwilioConfigured(): boolean {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;
  return Boolean(sid && token && from && !sid.includes('YOUR_') && !token.includes('YOUR_'));
}

export function isSmsGatewayConfigured(): boolean {
  return isTwilioConfigured() || Boolean(process.env.SMS_GATEWAY_URL);
}

/**
 * Dispatches a real SMS to the destination phone number using Twilio or an HTTP SMS gateway.
 * If credentials are not present in .env, provides a transparent fallback status.
 */
export async function sendRealSms(to: string, message: string): Promise<SmsSendResult> {
  const targetPhone = normalizePhone(to) || to.trim();

  // 1. Send via Twilio REST API
  if (isTwilioConfigured()) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN!.trim();
    const fromNumber = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER)!.trim();

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: targetPhone,
        From: fromNumber,
        Body: message,
      });

      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = (await response.json()) as any;

      if (response.ok && data.sid) {
        console.log(`[REAL SMS SENT] Dispatched to ${targetPhone} via Twilio SID: ${data.sid}`);
        return {
          success: true,
          messageId: data.sid,
          provider: 'twilio',
          delivered: true,
          notice: `SMS real enviado con éxito al número ${targetPhone}.`,
        };
      } else {
        console.error('[SMS ERROR] Twilio response failure:', data);
        return {
          success: false,
          provider: 'twilio',
          delivered: false,
          error: data.message || 'Error al enviar el SMS a través de Twilio.',
        };
      }
    } catch (err: any) {
      console.error('[SMS EXCEPTION] Failed calling Twilio API:', err);
      return {
        success: false,
        provider: 'twilio',
        delivered: false,
        error: err.message || 'Excepción de red al conectar con Twilio.',
      };
    }
  }

  // 2. Send via generic SMS Gateway (if specified)
  const genericGatewayUrl = process.env.SMS_GATEWAY_URL;
  if (genericGatewayUrl) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.SMS_GATEWAY_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.SMS_GATEWAY_API_KEY}`;
      }

      const response = await fetch(genericGatewayUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ to: targetPhone, message }),
      });

      if (response.ok) {
        console.log(`[REAL SMS SENT] Dispatched to ${targetPhone} via generic gateway`);
        return {
          success: true,
          provider: 'http_gateway',
          delivered: true,
          notice: `SMS real enviado con éxito al número ${targetPhone}.`,
        };
      }
    } catch (err: any) {
      console.error('[SMS EXCEPTION] Generic gateway failed:', err);
    }
  }

  // 3. Fallback when credentials are not configured in environment
  return {
    success: true,
    provider: 'development_fallback',
    delivered: false,
    notice: 'Pasarela SMS pendiente de configurar en variables de entorno (TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN).',
  };
}
