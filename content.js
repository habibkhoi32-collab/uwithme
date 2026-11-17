const L = require('./_lib');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    if (!L.isVisitor(req)) return res.status(401).json({});
    const { data } = await L.sb.from('kv').select('value').eq('key', 'content').maybeSingle();
    return res.json(data ? data.value : {});
  }
  if (req.method === 'PUT') {
    if (!L.isAdmin(req)) return res.status(401).json({});
    const b = req.body || {};
    if (typeof b.json !== 'string' || b.json.length > 400000) return res.status(400).json({});
    await L.sb.from('kv').upsert({ key: 'content', value: { json: b.json, t: Date.now() } });
    return res.json({ ok: true });
  }
  res.status(405).end();
};
