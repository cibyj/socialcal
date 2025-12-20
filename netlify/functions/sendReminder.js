// netlify/functions/sendReminder.js
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
    const body = event.body ? JSON.parse(event.body) : {};
    const isDryRun = body.dryRun === true;
    const forceSend = body.forceSend === true;

    console.log("📨 Send reminders started");
    console.log("Dry run:", isDryRun);
    console.log("Force send:", forceSend);

    const { data: events, error } = await supabase
      .from("events")
      .select("*");

    if (error) return json(500, { error: error.message });

    const now = Date.now();
    console.log("⏱ Current time:", new Date(now).toISOString());

    const windows = {
      "7 days before": 7 * 24 * 60 * 60 * 1000,
      "2 days before": 2 * 24 * 60 * 60 * 1000,
      "1 day before": 1 * 24 * 60 * 60 * 1000,
    };

    // ⛑️ Wider window to tolerate Netlify cron drift
    const WINDOW_MS = 90 * 60 * 1000; // 1 1/2 hour

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

      console.log("— Checking event:", ev.title);
      console.log("Event time:", new Date(evTime).toISOString());

      for (const [label, diff] of Object.entries(windows)) {
        const delta = Math.abs(evTime - now - diff);
        const deltaMin = Math.round(delta / 60000);
        const msUntilEvent = evTime - now;

        console.log(
          `⏱ ${label} | delta=${deltaMin} min | forceSend=${forceSend}`
        );

       console.log(
         `⏱ ${label} | msUntilEvent=${Math.round(msUntilEvent / 60000)} min | forceSend=${forceSend}`
       );


        // Skip if already sent (unless forceSend)
        if (!forceSend && ev.reminders_sent?.[label]) {
          console.log(`⏭️ Already sent "${label}" for "${ev.title}"`);
          continue;
        }


        if (
          forceSend ||
         (msUntilEvent <= diff && msUntilEvent > diff - WINDOW_MS)
        ) {
          console.log(`✅ MATCH (${label}) for "${ev.title}"`);
          if (forceSend) console.log("🚨 FORCE SEND ENABLED");

          const subject = `Reminder: "${ev.title}" is coming up`;

          const formattedTime = new Date(ev.event_time).toLocaleString("en-US", {
           timeZone: "America/New_York",
           dateStyle: "full",
           timeStyle: "short",
           });

        const html = `
          <div style="font-family: Arial, sans-serif; padding: 16px;">
           <h2>${ev.title}</h2>
           <p><strong>Date:</strong> ${formattedTime}</p>
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
              label,
            });
            continue;
          }

          await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: ev.user_email,
            subject,
            html,
          });

          console.log("📧 Email sent to:", ev.user_email);

          // Mark reminder as sent (idempotency)
          await supabase
            .from("events")
            .update({
              reminders_sent: {
                ...(ev.reminders_sent || {}),
                [label]: true,
              },
            })
            .eq("id", ev.id);

          sent++;
        }
      }
    }

    console.log("✅ Reminder run complete. Emails sent:", sent);

    return json(200, {
      ok: true,
      dryRun: isDryRun,
      forceSend,
      sent,
      previews,
    });
  } catch (err) {
    console.error("❌ Reminder error:", err);
    return json(500, { error: err.message });
  }
};
