import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const cleaner = await Cleaner.findById(id).lean();
      if (!cleaner) return res.status(404).json({ success: false, message: 'Cleaner not found' });
      res.status(200).json({ success: true, cleaner });
    } catch (error) {
      console.error('GET error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  else if (req.method === 'PUT') {
    try {
      const body = req.body;

      const updateFields = {
        ...body,
        availability: body.availability || {}, // ✅ Ensure deep availability save
      };

      const updatedCleaner = await Cleaner.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
      });

      if (!updatedCleaner) {
        return res.status(404).json({ success: false, message: 'Cleaner not found' });
      }

      res.status(200).json({ success: true, cleaner: updatedCleaner });
    } catch (error) {
      console.error('PUT error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
