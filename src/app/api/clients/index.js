import { connectToDatabase } from '@/lib/db';
import { Client } from '@/models/Client';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    const clients = await Client.find();
    return res.status(200).json(clients);
  } else if (req.method === 'POST') {
    try {
      const client = new Client(req.body);
      await client.save();
      res.status(201).json({ success: true, id: client._id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  } else {
    res.status(405).end();
  }
}