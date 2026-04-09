const { createClerkClient } = require('@clerk/clerk-sdk-node');
const connectDB = require('../lib/connectDB');
const Note = require('../lib/Note');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function verifyToken(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = await clerk.verifyToken(token);
    return payload.sub; // userId
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = await verifyToken(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  await connectDB();

  // The dynamic segment [key] is exposed as req.query.key by Vercel
  const key = req.query.key;

  if (req.method === 'GET') {
    const note = await Note.findOne({ userId, key });
    return res.json({ content: note?.content || '', tasks: note?.tasks || [] });
  }

  if (req.method === 'POST') {
    const { content, tasks } = req.body;
    const updated = await Note.findOneAndUpdate(
      { userId, key },
      { content, tasks: tasks || [] },
      { new: true, upsert: true, returnDocument: 'after' }
    );
    return res.json({ message: 'Saved', note: updated });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};
