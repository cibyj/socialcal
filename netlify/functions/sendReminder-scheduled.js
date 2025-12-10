import fetch from "node-fetch";

export async function handler() {
  const url = `${process.env.URL}/.netlify/functions/sendReminder`;

  try {
    const r = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        to: process.env.TEST_EMAIL,
        subject: "Scheduled Reminder Check",
        dryRun: true,
        eventData: {
          title: "Scheduled Reminder Test",
          date: new Date().toLocaleString(),
          notes: "This is an automated scheduled test."
        }
      })
    });

    const j = await r.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, result: j }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
