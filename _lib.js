const { createClient } = require('@supabase/supabase-js');
const c = require('crypto');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const mac = p => c.createHmac('sha256', process.env.SESSION_SECRET || '').update(p).digest('base64url');
const sign = (s, ttl) => { const p = Buffer.from(JSON.stringify({ s, e: Date.now() + ttl })).toString('base64url'); return p + '.' + mac(p); };
const same = (a, b) => a.length === b.length && c.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const check = (t, s) => { try { const [p, m] = t.split('.'); if (!same(m, mac(p))) return false; const d = JSON.parse(Buffer.from(p, 'base64url')); return d.s === s && d.e > Date.now(); } catch { return false; } };
const ck = (req, n) => ((req.headers.cookie || '').split(/;\s*/).find(x => x.startsWith(n + '=')) || '').slice(n.length + 1);
const isAdmin = r => check(ck(r, 'lu_a'), 'a');
const isVisitor = r => isAdmin(r) || check(ck(r, 'lu_v'), 'v');
const hash = (code, salt = c.randomBytes(16).toString('hex')) => salt + ':' + c.scryptSync(code, salt, 32).toString('hex');
const verify = (code, h) => { const [salt, x] = h.split(':'); return same(x, c.scryptSync(code, salt, 32).toString('hex')); };
async function getSecrets() {
  const { data } = await sb.from('kv').select('value').eq('key', 'secrets').maybeSingle();
  if (data) return data.value;
  const v = { v: hash(process.env.INITIAL_VISITOR_CODE || '1234'), a: hash(process.env.INITIAL_ADMIN_CODE || '000000') };
  await sb.from('kv').upsert({ key: 'secrets', value: v });
  return v;
}
module.exports = { sb, sign, isAdmin, isVisitor, hash, verify, getSecrets };
