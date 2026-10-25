const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  console.log('[Email] Email configuration incomplete. Emails will be logged to console in test mode.');
}

const sendTicketEmail = async (to, userName, eventName, qrCode, ticketId) => {
  if (!transporter) {
    console.log(`[Email Mock] Ticket email for ${to}: Ticket ID ${ticketId} for event "${eventName}"`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `Your Ticket for ${eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .qr-container { text-align: center; margin: 30px 0; background: white; padding: 20px; border-radius: 10px; }
          .qr-code { max-width: 280px; height: auto; }
          .ticket-info { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Your Event Ticket</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Thank you for registering for <strong>${eventName}</strong>. Your ticket is confirmed!</p>
            <div class="qr-container">
              <h3>Your QR Pass</h3>
              <img src="${qrCode}" alt="Ticket QR Code" class="qr-code" />
              <p style="margin-top: 15px; color: #666; font-size: 14px;">Present this QR code at the venue for check-in.</p>
            </div>
            <div class="ticket-info">
              <div class="info-row"><strong>Event:</strong> <span>${eventName}</span></div>
              <div class="info-row"><strong>Ticket ID:</strong> <span>${ticketId}</span></div>
              <div class="info-row"><strong>Attendee:</strong> <span>${userName}</span></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (to, otp) => {
  if (!transporter) {
    console.log(`[Email Mock] 🔐 Admin Login OTP for ${to}: [ ${otp} ] (Valid for 10 minutes)`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your OTP for Admin Login',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>Admin Authentication</h2>
        <p>Your one-time login verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 20px; background: #f3f4f6; text-align: center; border-radius: 8px;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 13px; margin-top: 15px;">Valid for 10 minutes. If you did not request this, please ignore.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendTicketEmail,
  sendOTPEmail,
};
