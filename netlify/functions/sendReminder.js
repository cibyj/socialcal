// netlify/functions/sendReminders.js
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    const isDryRun =
      event.httpMethod === "POST" &&
      event.body &&
      JSON.parse(event.body).dryRun === true;

    console.log("Send reminders started. Dry run:", isDryRun);

    const { data: events, error } = await supabase
      .from("events")
      .select("*");

    if (error) return json(500, { error: error.message });

    const now = Date.now();

    const windows = {
      "7 days before": 7 * 24 * 60 * 60 * 1000,
      "2 days before": 2 * 24 * 60 * 60 * 1000,
      "1 day before": 1 * 24 * 60 * 60 * 1000,
    };

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sent = 0;
    const previews = [];

    for (const ev of events) {
      const evTime = new Date(ev.event_time).getTime();

      for (const [label, diff] of Object.entries(windows)) {
        if (Math.abs(evTime - now - diff) < 30 * 60 * 1000) {
          const subject = `Reminder: "${ev.title}" is coming up`;

          const html = `
            <div style="font-family: Arial, sans-serif; padding: 16px;">
              <h2>${ev.title}</h2>
              <p><strong>Date:</strong> ${new Date(
                ev.event_time
              ).toLocaleString()}</p>
              <p>${ev.description || ""}</p>
              <hr />
              <p style="color: gray; font-size: 12px;">
                This is your ${label} reminder.
              </p>
            </div>
          `;

          if (isDryRun) {
            previews.push({
              to: ev.user_email,
              subject,
              html,
            });
            continue;
          }

          await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: ev.user_email,
            subject,
            html,
          });

          sent++;
        }
      }
    }

    return json(200, {
      ok: true,
      dryRun: isDryRun,
      sent,
      previews,
    });
  } catch (err) {
    console.error("Reminder error:", err);
    return json(500, { error: err.message });
  }
};
