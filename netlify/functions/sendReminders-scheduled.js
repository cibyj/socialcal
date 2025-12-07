// Scheduled function that triggers sendReminders
const fetch = require("node-fetch");

exports.handler = async () => {
  const url = `${process.env.URL}/.netlify/functions/sendReminders`;

  try {
    const r = await fetch(url);
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
};
