export default async function handler(req, res) {
  res.setHeader('Set-Cookie', 'token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict;');
  res.status(200).json({ success: true });
}