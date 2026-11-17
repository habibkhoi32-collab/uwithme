const L = require('./_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST' || !L.isAdmin(req)) return res.status(401).json({ ok: false });
  const { cur, visitor, admin } = req.body || {};
  const s = await L.getSecrets();
  if (typeof cur !== 'string' || !L.verify(cur, s.a)) return res.status(403).json({ ok: false });
  if (visitor) { if (!/^\d{4}$/.test(visitor)) return res.status(400).json({ ok: false }); s.v = L.hash(visitor); }
  if (admin) { if (typeof admin !== 'string' || admin.length < 6 || admin.length > 64) return res.status(400).json({ ok: false }); s.a = L.hash(admin); }
  await L.sb.from('kv').upsert({ key: 'secrets', value: s });
  res.json({ ok: true });
};
