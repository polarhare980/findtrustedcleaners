import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendResetCode = async (to, code) => {
  await transporter.sendMail({
    from: `"Find Trusted Cleaners" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Your Password Reset Code',
    html: `
      <p>Hi,</p>
      <p>Your <strong>FindTrustedCleaners</strong> reset code is:</p>
      <h2>${code}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  });
};
