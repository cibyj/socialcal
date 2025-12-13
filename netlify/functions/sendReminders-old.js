// sendReminders.js (Netlify Serverless Function)
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// Build Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper for JSON responses
const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const dryRun = params.dryRun === "true";
    const testEmail = params.testEmail || null;

    // Safety check
    if (dryRun && !testEmail) {
      return json(400, {
        error: "When dryRun=true, you MUST include testEmail=email@domain.com",
      });
    }

    // Fetch ALL events
    const { data: events, error } = await supabase
      .from("events")
      .select("*");

    if (error) return json(500, { error: error.message });

    const now = Date.now();

    // Reminder windows (ms)
    const windows = {
      "7 days before": 7 * 24 * 60 * 60 * 1000,
      "2 days before": 2 * 24 * 60 * 60 * 1000,
      "1 day before": 1 * 24 * 60 * 60 * 1000,
    };

    // Initialize email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sent = [];

    // Loop through events
    for (const ev of events) {
      const evTime = new Date(ev.event_time).getTime();

      // --- DRY RUN MODE ---
      if (dryRun) {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: testEmail,        // ALWAYS send to testEmail  
          subject: `[DRY RUN] Reminder test: "${ev.title}"`,
          text: `This is a DRY RUN test.\n\nEvent:\n"${ev.title}"\nScheduled for: ${new Date(ev.event_time).toLocaleString()}\n\nThis email proves your SMTP settings work.`,
        });

        sent.push({
          title: ev.title,
          to: testEmail,
          mode: "dry-run",
        });

        // go to next event (do NOT check windows)
        continue;
      }

      // --- NORMAL MODE ---
      for (const [label, diff] of Object.entries(windows)) {
        if (Math.abs(evTime - now - diff) < 30 * 60 * 1000) {
          await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: ev.user_email,
            subject: `Reminder: "${ev.title}" is coming up`,
            text: `Your event "${ev.title}" happens on ${new Date(
              ev.event_time
            ).toLocaleString()}.\n\nReminder window: ${label}\n`,
          });

          sent.push({
            title: ev.title,
            to: ev.user_email,
            label,
          });
        }
      }
    }

    return json(200, {
      message: dryRun ? "Dry run completed" : "Reminders sent",
      sent,
    });

  } catch (e) {
    return json(500, { error: e.message });
  }
};
