const L = require('./_lib');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { scope, code } = req.body || {};
  if (!['visitor', 'admin'].includes(scope) || typeof code !== 'string' || code.length > 64) return res.status(400).json({ ok: false });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const since = new Date(Date.now() - 10 * 60000).toISOString();
  const { count } = await L.sb.from('attempts').select('*', { count: 'exact', head: true }).eq('ip', ip).eq('ok', false).gte('at', since);
  if (count >= 5) return res.status(429).json({ ok: false, msg: 'locked' });
  const s = await L.getSecrets();
  if (!L.verify(code, scope === 'admin' ? s.a : s.v)) { await L.sb.from('attempts').insert({ ip, ok: false }); return res.status(401).json({ ok: false }); }
  const cookie = (n, t, ttl) => `${n}=${L.sign(t, ttl * 1000)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ttl}`;
  res.setHeader('Set-Cookie', scope === 'admin' ? [cookie('lu_a', 'a', 7200), cookie('lu_v', 'v', 2592000)] : [cookie('lu_v', 'v', 2592000)]);
  res.json({ ok: true });
};
