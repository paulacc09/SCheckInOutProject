async function sendMail({ to, subject, html }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "CheckInOut", email: "checkinout.noreply@gmail.com" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      (data && (data.message || data.code || JSON.stringify(data))) ||
      "Error sending email with Brevo";
    throw new Error(message);
  }

  return data;
}

module.exports = { sendMail };
