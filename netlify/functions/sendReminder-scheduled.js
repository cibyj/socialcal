// netlify/functions/sendReminder-scheduled.js
import fetch from "node-fetch";

export async function handler() {
  const url = `${process.env.URL}/.netlify/functions/sendReminder`;

  console.log("⏰ Scheduled reminder trigger started");
  console.log("Calling:", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}) // ⬅️ IMPORTANT: no dryRun, no forceSend
    });

    const text = await res.text();

    console.log("📨 sendReminder response status:", res.status);
    console.log("📨 sendReminder response body:", text);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        status: res.status,
        response: text,
      }),
    };
  } catch (err) {
    console.error("❌ Scheduled trigger failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
