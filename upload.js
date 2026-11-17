const L = require('./_lib');
const crypto = require('crypto');
module.exports = async (req, res) => {
  if (req.method !== 'POST' || !L.isAdmin(req)) return res.status(401).json({});
  const { type, size } = req.body || {};
  if (typeof type !== 'string' || !/^(image|video|audio)\//.test(type) || !(size > 0) || size > 50 * 1048576) return res.status(400).json({});
  const ext = (type.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin';
  const path = crypto.randomUUID() + '.' + ext;
  const { data, error } = await L.sb.storage.from('media').createSignedUploadUrl(path);
  if (error) return res.status(500).json({});
  res.json({ path, token: data.token, url: process.env.SUPABASE_URL, anon: process.env.SUPABASE_ANON_KEY, publicUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/media/${path}` });
};
