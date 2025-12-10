import { getGraphClient } from "./graphClient.js";
import { buildEmailHTML } from "./utils.js";

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body);
    const { to, subject, eventData, dryRun } = body;

    if (!to || !subject || !eventData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing to, subject, or eventData" })
      };
    }

    const html = buildEmailHTML(eventData);

    // ======================================================
    // DRY RUN MODE — Do NOT send email, just simulate
    // ======================================================
    if (dryRun) {
      console.log("======== DRY RUN MODE (No email sent) ========");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("HTML Preview:", html);
      console.log("=============================================");
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Dry run executed — no email sent",
          preview: {
            to,
            subject,
            html
          }
        })
      };
    }

    // ======================================================
    // REAL MODE — Send via Microsoft Graph
    // ======================================================
    const client = getGraphClient();

    await client.api("/me/sendMail").post({
      message: {
        subject,
        body: {
          contentType: "HTML",
          content: html
        },
        toRecipients: [{ emailAddress: { address: to } }]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully" })
    };

  } catch (err) {
    console.error("Error sending reminder:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error" })
    };
  }
}
