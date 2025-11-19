// netlify/functions/runReminders.js

const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  FROM_EMAIL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
} = process.env;

// Validate env vars
if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !FROM_EMAIL ||
  !SMTP_HOST ||
  !SMTP_PORT ||
  !SMTP_USER ||
  !SMTP_PASS
) {
  console.error("❌ Missing environment variables.");
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false, // TLS is used automatically on port 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

exports.handler = async function (event, context) {
  try {
    // Fetch events with reminders due and not yet sent
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .lt("remind_at", new Date().toISOString())
      .eq("sent", false);

    if (error) throw error;
    if (!events || events.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No reminders to send." }),
      };
    }

    // Send reminder emails
    const sent = [];
    for (const evt of events) {
      if (!evt.user_email) {
        console.warn(`Event ${evt.id} has no user_email.`);
        continue;
      }

      const mailOptions = {
        from: FROM_EMAIL, // e.g., "Social Calendar <cibyj@hotmail.com>"
        to: evt.user_email,
        subject: `Reminder: ${evt.title}`,
        text: `This is a reminder for your upcoming event:\n\nTitle: ${evt.title}\nDate: ${evt.date}\nTime: ${evt.time}`,
      };

      try {
        await transporter.sendMail(mailOptions);

        // Mark event as sent
        await supabase.from("events").update({ sent: true }).eq("id", evt.id);
        sent.push(evt);
        console.log(`✅ Sent reminder for event ${evt.title}`);
      } catch (emailErr) {
        console.error(`❌ Failed to send email for event ${evt.id}:`, emailErr);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sent }),
    };
  } catch (err) {
    console.error("Error running reminders:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
