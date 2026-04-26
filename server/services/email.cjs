const nodemailer = require('nodemailer');

// Set up Nodemailer transport.
// If you want to use Gmail, you'll need an App Password: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends an OTP via Email using Nodemailer.
 * If SMTP credentials are not configured, it simulates the email in the console.
 * @param {string} to - The recipient's email address
 * @param {string} code - The OTP code to send
 */
async function sendOtpEmail(to, code) {
  if (!to) {
    throw new Error("Invalid destination email.");
  }
  if (!code) {
    throw new Error("OTP code is required.");
  }

  // If credentials are not provided in .env, simulate for development
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n===========================================`);
    console.log(`📧 [MOCK EMAIL] To: ${to}`);
    console.log(`🔒 OTP Code: ${code}`);
    console.log(`===========================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Carthage Connect" <${process.env.SMTP_USER}>`,
      to,
      subject: "Code de vérification - Carthage Connect",
      text: `Bonjour,\n\nVotre code de vérification est ${code}. Il expire dans 5 minutes.\n\nCordialement,\nL'équipe UCAR`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Carthage Connect</h2>
          <p>Bonjour,</p>
          <p>Votre code de vérification est :</p>
          <h1 style="background: #f4f4f4; padding: 10px; border-radius: 5px; text-align: center; letter-spacing: 5px;">${code}</h1>
          <p>Il expire dans 5 minutes.</p>
          <hr/>
          <p style="font-size: 12px; color: #888;">Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
      `,
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email Error:", error.message);
    throw new Error(error.message || "Impossible d'envoyer l'email de vérification.");
  }
}

module.exports = { sendOtpEmail };
