// frontend/netlify/functions/ping.js
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, path: "/.netlify/functions/ping", now: new Date().toISOString() }),
  };
};
