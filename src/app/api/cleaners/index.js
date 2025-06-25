import { connectToDatabase } from '@/lib/db';
import Cleaner from '@/models/Cleaner';

export default async function handler(req, res) {
  await connectToDatabase();

  if (req.method === 'GET') {
    const cleaners = await Cleaner.find();
    return res.status(200).json(cleaners);
  } else if (req.method === 'POST') {
    try {
      const cleaner = new Cleaner(req.body);
      await cleaner.save();
      res.status(201).json({ success: true, id: cleaner._id });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  } else {
    res.status(405).end();
  }
}