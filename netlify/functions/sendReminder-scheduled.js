import fetch from "node-fetch";

export async function handler() {
  const url = `${process.env.URL}/.netlify/functions/sendReminder`;

  console.log("⏰ Scheduled reminder trigger fired");

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // IMPORTANT: no dryRun, no test payload
    });

    const text = await r.text();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        response: text,
      }),
    };
  } catch (err) {
    console.error("Scheduled trigger failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
