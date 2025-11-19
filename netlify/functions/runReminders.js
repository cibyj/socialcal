// netlify/functions/runReminders.js

const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase env variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Email transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

exports.handler = async function () {
  try {
    // Fetch upcoming events with email
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .not("user_email", "is", null);

    if (error) throw error;

    const now = new Date();

    for (const event of events) {
      if (!event.user_email) continue;

      // Combine date and event_time
      const eventDateTime = new Date(`${event.date}T${event.event_time}`);

      // Reminder schedule
      const reminders = [
        { daysBefore: 7, type: "week" },
        { daysBefore: 2, type: "twoDays" },
        { daysBefore: 1, type: "oneDay" },
      ];

      for (const reminder of reminders) {
        const sendDate = new Date(eventDateTime);
        sendDate.setDate(sendDate.getDate() - reminder.daysBefore);

        // Send if now >= sendDate and not already sent for this type
        if (now >= sendDate && (!event.sent || event.sent !== reminder.type)) {
          const mailOptions = {
            from: FROM_EMAIL,
            to: event.user_email,
            subject: `Reminder: ${event.title} in ${reminder.daysBefore} day(s)`,
            text: `Event: ${event.title}\nDescription: ${event.description || ""}\nDate & Time: ${event.date} ${event.event_time}`,
          };

          await transporter.sendMail(mailOptions);

          // Mark this reminder as sent
          await supabase
            .from("events")
            .update({ sent: reminder.type })
            .eq("id", event.id);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Reminders processed successfully." }),
    };
  } catch (err) {
    console.error("Error running reminders:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
