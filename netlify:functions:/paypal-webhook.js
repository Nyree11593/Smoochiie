const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  // PayPal sends POST requests only
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    console.error("Invalid JSON", err);
    return { statusCode: 400, body: "Invalid JSON" };
  }

  // Some PayPal test events may not include event_type
  if (!body || !body.event_type) {
    return { statusCode: 200, body: "No event_type; ignored" };
  }

  const eventType = body.event_type;
  const resource = body.resource || {};
  const webhookEventId = body.id || "no-id";

  // MAIN PAID EVENT
  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId =
      resource?.supplementary_data?.related_ids?.order_id ||
      resource?.id ||
      "N/A";

    const payerEmail =
      resource?.payer?.email_address ||
      resource?.payer?.email ||
      resource?.payer?.payer_info?.email ||
      null;

    console.log(
      "PayPal webhook received:",
      webhookEventId,
      "orderId:",
      orderId
    );

    // If PayPal did not provide an email, do not fail the webhook
    if (!payerEmail) {
      console.warn("No payer email found for order:", orderId);
      return { statusCode: 200, body: "No payer email; skipped email send" };
    }

    // Create SMTP transporter using Netlify ENV VARS
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

    const mailHtml = `
      <h1>Thank you for your purchase!</h1>
      <p>Your payment has been successfully processed.</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p>If you have any questions, reply to this email.</p>
    `;

    try {
      await transporter.sendMail({
        from: `"Smoochiie™ Store" <${fromEmail}>`,
        to: payerEmail,
        subject: `Order Confirmed! #${orderId}`,
        html: mailHtml,
      });

      return {
        statusCode: 200,
        body: "Webhook processed and confirmation email sent",
      };
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      return { statusCode: 500, body: "Failed to send email" };
    }
  }

  // Ignore all other PayPal events safely
  return { statusCode: 200, body: `Event ignored: ${eventType}` };
};