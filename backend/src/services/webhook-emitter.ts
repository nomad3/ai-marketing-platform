interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export async function emitWebhook(event: string, data: Record<string, unknown>): Promise<void> {
  const url = process.env.SERVICETSUNAMI_WEBHOOK_URL;
  if (!url) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HCA-Event': event,
        'X-Service-Key': process.env.SERVICE_API_KEY || '',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err: any) {
    console.error(`[webhook] Failed to emit ${event}:`, err.message);
  }
}
