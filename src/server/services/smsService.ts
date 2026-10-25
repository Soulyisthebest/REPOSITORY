/**
 * SMS Dispatch Service for Rentia
 * Supports real cellular SMS delivery via Twilio REST API and Textbelt.
 * Normalizes phone numbers to standard E.164 international formats.
 */

export interface SmsSendResult {
  success: boolean;
  provider: 'twilio' | 'textbelt' | 'simulation_fallback';
  messageId?: string;
  realDispatched: boolean;
  error?: string;
  normalizedPhone: string;
}

/**
 * Normalizes phone numbers to standard international format (E.164).
 * Spanish mobile numbers (9 digits starting with 6 or 7) become +34XXXXXXXXX.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove all spaces, hyphens, periods, parentheses
  let cleaned = String(rawPhone).replace(/[\s\-\(\)\.]/g, '').trim();

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // If already starts with +, return cleaned
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Spain national format: 9 digits starting with 6 or 7
  if (/^[67]\d{8}$/.test(cleaned)) {
    return `+34${cleaned}`;
  }

  // France national format: 10 digits starting with 06 or 07
  if (/^0[67]\d{8}$/.test(cleaned)) {
    return `+33${cleaned.substring(1)}`;
  }

  // Default: prepend +34 if 9 digits, else prepend +
  if (cleaned.length === 9) {
    return `+34${cleaned}`;
  }

  return `+${cleaned}`;
}

/**
 * Sends a real SMS to a mobile phone number.
 */
export async function sendRealSms(rawPhone: string, messageText: string): Promise<SmsSendResult> {
  const normalizedPhone = normalizePhoneNumber(rawPhone);

  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER)?.trim();

  // 1. Try Twilio REST API if configured in environment
  if (twilioSid && twilioToken && twilioFrom && !twilioSid.includes('placeholder')) {
    try {
      console.log(`[SMS SERVICE] Dispatching real SMS via Twilio to ${normalizedPhone}...`);
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

      const bodyParams = new URLSearchParams();
      bodyParams.append('To', normalizedPhone);
      bodyParams.append('From', twilioFrom);
      bodyParams.append('Body', messageText);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('[SMS SERVICE] Twilio API Error:', responseData);
        return {
          success: false,
          provider: 'twilio',
          realDispatched: false,
          error: responseData.message || 'Error al enviar SMS mediante Twilio.',
          normalizedPhone,
        };
      }

      console.log(`[SMS SERVICE] Real SMS dispatched successfully via Twilio! SID: ${responseData.sid}`);
      return {
        success: true,
        provider: 'twilio',
        messageId: responseData.sid,
        realDispatched: true,
        normalizedPhone,
      };
    } catch (err: any) {
      console.error('[SMS SERVICE] Twilio dispatch exception:', err);
      return {
        success: false,
        provider: 'twilio',
        realDispatched: false,
        error: err.message || 'Fallo de conexión con servicio SMS Twilio.',
        normalizedPhone,
      };
    }
  }

  // 2. Try Textbelt (with custom key or free test key 'textbelt')
  const customTextbeltKey = process.env.TEXTBELT_KEY?.trim();
  const textbeltKeyToUse = customTextbeltKey && !customTextbeltKey.includes('placeholder')
    ? customTextbeltKey
    : 'textbelt';

  try {
    console.log(`[SMS SERVICE] Attempting real SMS delivery via Textbelt to ${normalizedPhone}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: normalizedPhone,
        message: messageText,
        key: textbeltKeyToUse,
      }),
    });
    clearTimeout(timeoutId);

    const data = (await response.json()) as any;
    if (data && data.success) {
      console.log(`[SMS SERVICE] Real cellular SMS successfully dispatched via Textbelt! ID: ${data.textId}`);
      return {
        success: true,
        provider: 'textbelt',
        messageId: data.textId,
        realDispatched: true,
        normalizedPhone,
      };
    } else {
      console.warn('[SMS SERVICE] Textbelt provider response:', data?.error || 'No quota or invalid phone');
    }
  } catch (err: any) {
    console.warn('[SMS SERVICE] Textbelt connection attempt error:', err.message);
  }

  // 3. Fallback when credentials are not yet configured or gateway quota exhausted
  console.log(`[SMS SERVICE NOTICE] SMS gateway keys (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN) not active or quota exhausted.`);
  console.log(`[SMS SERVICE OTP NOTICE] Código generado para ${normalizedPhone}: ${messageText}`);

  return {
    success: true,
    provider: 'simulation_fallback',
    realDispatched: false,
    normalizedPhone,
  };
}
