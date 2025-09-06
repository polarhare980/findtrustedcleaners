import { connectToDatabase } from '@/lib/db';
import ResetToken from '@/models/ResetToken';
import { sendResetCode } from '@/lib/mailer';

export async function POST(req) {
  await connectToDatabase();
  const { email } = await req.json();

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await ResetToken.deleteMany({ email }); // clear old codes

  await ResetToken.create({ email, code, expiresAt });

  await sendResetCode(email, code);

  return Response.json({ success: true, message: 'Code sent to email' });
}
