import { sendEmail } from '@/lib/mail';

export async function sendResetCode(to, code) {
  return sendEmail({
    to,
    subject: 'Your Password Reset Code',
    text: `Your FindTrustedCleaners reset code is ${code}. It expires in 10 minutes.`,
    html: `
      <p>Hi,</p>
      <p>Your <strong>FindTrustedCleaners</strong> reset code is:</p>
      <h2>${code}</h2>
      <p>This code will expire in 10 minutes.</p>
    `,
  });
}
