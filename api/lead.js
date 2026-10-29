// Vercel serverless function: receives a lead from any form on the site and forwards it to the manager.
// Channels are switched on by environment variables in Vercel → Project → Settings → Environment Variables:
//   TG_BOT_TOKEN + TG_CHAT_ID  → message to the manager's Telegram (bot from @BotFather, free)
//   WEB3FORMS_KEY              → e-mail to the manager's inbox via web3forms.com (free plan)
// With no variables set the function answers { ok: false } and the site offers the prepared WhatsApp message instead.

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};

  const phone = clip(b.phone, 24);
  if (phone.replace(/\D/g, '').length < 10) { res.status(400).json({ ok: false, error: 'phone' }); return; }
  const answers = b.answers && typeof b.answers === 'object' ? Object.entries(b.answers).slice(0, 12) : [];
  const lines = [
    'Новая заявка с сайта Тепломаш',
    'Источник: ' + clip(b.source, 80),
    b.name ? 'Имя: ' + clip(b.name, 60) : null,
    'Телефон: ' + phone,
    ...answers.map(([k, v]) => clip(k, 40) + ': ' + clip(v, 160)),
    b.result ? 'Ориентир: ' + clip(b.result, 120) : null,
    b.page ? 'Страница: ' + clip(b.page, 200) : null
  ].filter(Boolean);
  const text = lines.join('\n');

  const sent = [];
  const { TG_BOT_TOKEN, TG_CHAT_ID, WEB3FORMS_KEY } = process.env;
  try {
    if (TG_BOT_TOKEN && TG_CHAT_ID) {
      const r = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CHAT_ID, text, disable_web_page_preview: true })
      });
      if (r.ok) sent.push('telegram');
    }
    if (WEB3FORMS_KEY) {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: 'Заявка с сайта Тепломаш — ' + clip(b.source, 60), from_name: 'Сайт Тепломаш', message: text })
      });
      if (r.ok) sent.push('email');
    }
  } catch (e) { /* fall through: the site will offer WhatsApp */ }

  res.status(200).json({ ok: sent.length > 0, channels: sent });
};
