// sendReminders.js (Netlify Serverless Function)
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// Build Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// JSON response helper
const json = (status, body) => ({
  statusCode: status,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body),
});

exports.handler = async () => {
  try {
    console.log("=== sendReminders START ===");

    // 1) Fetch upcoming events
    const { data: events, error } = await supabase
      .from("events")
      .select("*");

    if (error) return json(500, { error: error.message });

    console.log(`Loaded ${events.length} events from Supabase.`);

    const now = Date.now();
    console.log("Current timestamp:", now, "|", new Date(now).toString());

    // Reminder windows
    const windows = {
      "7 days before": 7 * 24 * 60 * 60 * 1000,
      "2 days before": 2 * 24 * 60 * 60 * 1000,
      "1 day before": 1 * 24 * 60 * 60 * 1000,
    };

    // 2) Initialize transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let count = 0;

    // 3) Check each event
    for (const ev of events) {

      const evTime = new Date(ev.event_time).getTime();
      console.log("\nChecking event:", ev.title);
      console.log("Event timestamp:", evTime, "|", new Date(ev.event_time).toString());

      const msUntilEvent = evTime - now;
      console.log("msUntilEvent:", msUntilEvent);

      for (const [label, diff] of Object.entries(windows)) {

        console.log(
          `  → Window check: ${label} | target diff = ${diff}, actual diff = ${msUntilEvent}`
        );

        // MATCH CONDITION (±30 minutes)
        if (Math.abs(msUntilEvent - diff) <= 30 * 60 * 1000) {

          console.log(`  ✓ MATCH! Sending reminder (${label}) for "${ev.title}" to ${ev.user_email}`);

          await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: ev.user_email,
            subject: `Reminder: "${ev.title}" is coming up`,
            text: `Your event "${ev.title}" is happening on ${new Date(
              ev.event_time
            ).toLocaleString()}.\n\nThis is your reminder (${label}).`,
          });

          count++;
        }
      }
    }

    console.log(`=== sendReminders COMPLETE — sent ${count} reminders ===`);

    return json(200, { message: "Reminders sent", count });

  } catch (e) {
    console.error("ERROR in sendReminders:", e);
    return json(500, { error: e.message });
  }
};
