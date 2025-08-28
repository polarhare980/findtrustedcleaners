import dbConnect from '@/lib/dbConnect';
import Cleaner from '@/models/Cleaner';
import { parse } from 'cookie';
import { verifyToken } from '@/lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const cleaner = await Cleaner.findById(id).lean();
      if (!cleaner) {
        return res.status(404).json({ success: false, message: 'Cleaner not found' });
      }
      // Returns dbsChecked (boolean) as part of the document
      return res.status(200).json({ success: true, cleaner });
    } catch (error) {
      console.error('GET error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  if (req.method === 'PUT') {
    // 🔐 Manual token check for legacy route
    try {
      const cookies = parse(req.headers.cookie || '');
      const token = cookies.token;
      const user = verifyToken(token);

      if (!user || (String(user._id) !== String(id) && user.type !== 'admin')) {
        return res.status(401).json({ success: false, message: 'Unauthorised' });
      }
    } catch (e) {
      // verifyToken threw or no cookie
      return res.status(401).json({ success: false, message: 'Unauthorised' });
    }

    try {
      const body = req.body || {};

      // Whitelist/normalise updates
      const updateFields = {
        ...body,
        availability: body.availability || {}, // ✅ keep deep availability save
      };

      // ✅ NEW: normalise DBS to a boolean if present
      if ('dbsChecked' in body) {
        updateFields.dbsChecked = !!body.dbsChecked;
      }

      // (Optional) prevent updating protected fields here
      delete updateFields._id;

      const updatedCleaner = await Cleaner.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
      });

      if (!updatedCleaner) {
        return res.status(404).json({ success: false, message: 'Cleaner not found' });
      }

      return res.status(200).json({ success: true, cleaner: updatedCleaner });
    } catch (error) {
      console.error('PUT error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

