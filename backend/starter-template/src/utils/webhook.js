export async function emitWebhook(url, event, payload) {
  if (!url) {
    console.log(`[${event}]`, payload);
    return;
  }
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload }),
    });
  } catch (e) {
    console.warn(`[WEBHOOK_FAILED:${event}]`, e?.message || e);
    console.log(`[${event}]`, payload);
  }
}


