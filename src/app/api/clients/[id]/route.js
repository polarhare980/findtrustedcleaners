import { connectToDatabase } from '@/lib/db';
import Client from '@/models/Client';
import { verifyToken } from '@/middleware/verifyToken'; // 🔐 Import JWT middleware

// GET Client by ID (🔒 Protected)
export async function GET(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    // ✅ Optional: Make sure the logged-in user is requesting their own data
    if (user.id !== params.id && user.userType !== 'admin') {
      return new Response(JSON.stringify({ message: 'Access denied.' }), { status: 403 });
    }

    const client = await Client.findById(params.id).lean();

    if (!client) {
      return new Response(JSON.stringify({ message: 'Client not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(client), { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    return new Response(JSON.stringify({ message: err.message }), { status: 401 });
  }
}

// PUT - Update Client by ID (🔒 Protected)
export async function PUT(req, { params }) {
  await connectToDatabase();

  try {
    // 🔐 Validate JWT token
    const user = await verifyToken(req);

    // ✅ Optional: Make sure the logged-in user is updating their own profile
    if (user.id !== params.id && user.userType !== 'admin') {
      return new Response(JSON.stringify({ message: 'Access denied.' }), { status: 403 });
    }

    const data = await req.json();

    const updatedClient = await Client.findByIdAndUpdate(params.id, data, { new: true });

    if (!updatedClient) {
      return new Response(JSON.stringify({ message: 'Client not found for update' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Client updated successfully', client: updatedClient }), { status: 200 });
  } catch (err) {
    console.error('❌ MongoDB Update Error:', err.message);
    return new Response(JSON.stringify({ message: err.message }), { status: 401 });
  }
}
