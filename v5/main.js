(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const burger = $('#burger');
  burger && burger.addEventListener('click', () => { const o = document.body.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', o); $('#sheet').setAttribute('aria-hidden', !o); });
  $$('#sheet a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); }));

  window.TMlead = async lead => { try { const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) }); const j = await r.json().catch(() => ({})); return !!(r.ok && j.ok); } catch (e) { return false; } };

  const objs = $('#objs');
  if (objs) {
    const S = TM.scenes.map(x => x.id === 'shop' ? Object.assign({}, x, { img: '/img/store-inside.jpg' }) : x).concat([{ name: 'Бутик и шоурум', img: '/img/hero-wall.jpg', pick: 'Серия 200–300', text: 'Одна дверь и высокие требования к виду входа.' }]);
    objs.innerHTML = S.map(s => `<article class="obj"><img src="${s.img}" alt="${s.name}" loading="lazy"><h3>${s.name}</h3><p>${s.text}</p><span>${s.pick}</span></article>`).join('');
  }

  const pt = $('#ptable');
  if (pt) {
    const ids = ['КЭВ-6П2011E', 'КЭВ-12П3041E', 'КЭВ-18П3091E', 'КЭВ-24П4042E', 'КЭВ-20Т20Е'];
    pt.innerHTML = TM.products.filter(p => ids.includes(p.id)).map(p => `<div class="prow" role="row">
      <img src="${p.cat === 'curtains' ? '/img/curtain.jpg' : p.img}" alt="" loading="lazy">
      <div><h3>${p.name}</h3><p>${p.use}</p><p class="ms">${[p.kw && p.kw + ' кВт', p.series && 'серия ' + p.series, p.height && 'проём ' + p.height].filter(Boolean).join(' · ')}</p></div>
      <div class="c"><small>Мощность</small>${p.kw ? p.kw + ' кВт' : '—'}</div>
      <div class="c"><small>${p.series ? 'Серия' : 'Тип'}</small>${p.series || (p.heat || '—')}</div>
      <div class="c"><small>Проём</small>${p.height || '—'}</div>
      <a class="lnk" href="${TM.wa('Здравствуйте! Интересует ' + p.name + '. Подскажите цену и наличие.')}" target="_blank" rel="noopener">Узнать цену →</a>
    </div>`).join('');
  }

  const qf = $('#qform');
  if (qf) qf.addEventListener('submit', async e => {
    e.preventDefault(); if (qf.querySelector('.hp').value) return;
    const tel = $('#qTel').value.trim();
    if (tel.replace(/\D/g, '').length < 10) { qf.classList.add('bad'); $('#qTel').focus(); return; }
    qf.classList.remove('bad');
    const v = n => qf.querySelector(`input[name=${n}]:checked`).value;
    const lead = { source: 'Подбор за 3 вопроса (v5)', name: $('#qName').value.trim().slice(0, 60), phone: tel.slice(0, 24), answers: { 'Вход': v('a'), 'Высота проёма': v('b'), 'Нагрев': v('c') }, page: location.href };
    const btn = qf.querySelector('button'); btn.disabled = true; btn.textContent = 'Отправляем…';
    const ok = await window.TMlead(lead);
    const text = `Здравствуйте!${lead.name ? ' Я ' + lead.name + ',' : ''} ${lead.phone}. Нужен подбор завесы: ${v('a').toLowerCase()}, высота ${v('b')}, нагрев ${v('c')}.`;
    $('#qOk').innerHTML = ok ? '<b>Заявка отправлена.</b> Менеджер свяжется с вами в рабочее время в течение 15 минут.' : `<b>Почти готово.</b> Отправьте ответы менеджеру: <a href="${TM.wa(text)}" target="_blank" rel="noopener">открыть WhatsApp с готовым сообщением</a>.`;
    qf.classList.add('done');
  });

  const tg = $('#teamg');
  if (tg) tg.innerHTML = TM.team.map((t, i) => { const f = t.name.split(' ')[1] || t.name; return `<div class="tm"><img src="${t.img}" alt="${t.name}" loading="lazy"><b>${t.name}</b><span>${t.role}</span>${i > 1 ? `<a href="${TM.wa('Здравствуйте, ' + f + '! Нужна консультация по тепловой завесе.')}" target="_blank" rel="noopener">Написать в WhatsApp</a>` : ''}</div>`; }).join('');

  const rv = $('#revs');
  if (rv) {
    rv.innerHTML = TM.reviews.map(r => { const nick = /\d|^[a-z]/.test(r.name); return `<figure class="rv"><span class="st" aria-label="5 из 5">★★★★★</span><blockquote>${r.text}</blockquote><figcaption><b>${nick ? 'Клиент Jamal Group' : r.name}</b><br><span>${r.date}, 2ГИС</span></figcaption></figure>`; }).join('');
    const step = d => rv.scrollBy({ left: d * (rv.querySelector('.rv').offsetWidth + 20), behavior: 'smooth' });
    $('#rp').onclick = () => step(-1); $('#rn').onclick = () => step(1);
  }

  const fq = $('#faqs');
  if (fq) fq.innerHTML = TM.faq.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');
})();
