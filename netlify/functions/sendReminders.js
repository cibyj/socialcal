import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email sender setup (replace with your SMTP if needed)
const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false, // MUST be false for Hotmail
  auth: {
    user: process.env.SMTP_USER,  // Hotmail address
    pass: process.env.SMTP_PASS,  // Hotmail app password
  },
});


export default async () => {
  const now = new Date();
  const today = new Date(now.toISOString().substring(0, 10));

  function addDays(days) {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  }

  const targetDates = [
    { days: 7, date: addDays(7) },
    { days: 2, date: addDays(2) },
    { days: 1, date: addDays(1) }
  ];

  const messages = [];

  for (const t of targetDates) {
    const { data, error } = await supabase.rpc("events_on_date", { target_date: t.date });

    if (error) {
      console.error("Supabase error:", error);
      continue;
    }

    for (const ev of data) {
      const emailMsg = {
        from: process.env.SMTP_USER,
        to: ev.user_email,
        subject: `Reminder: ${ev.title} in ${t.days} day(s)`,
        html: `
          <h2>Upcoming Event Reminder</h2>
          <p><strong>Event:</strong> ${ev.title}</p>
          <p><strong>Description:</strong> ${ev.description}</p>
          <p><strong>Date:</strong> ${new Date(ev.event_time).toLocaleString()}</p>
          <p>This is your ${t.days}-day reminder.</p>
        `,
      };

      await transporter.sendMail(emailMsg);
      messages.push(`Sent ${t.days}-day reminder for event: ${ev.title}`);
    }
  }

  return new Response(JSON.stringify({ status: "done", messages }), {
    headers: { "Content-Type": "application/json" },
  });
};
