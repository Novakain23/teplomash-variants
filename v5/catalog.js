(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const qs = new URLSearchParams(location.search);
  const st = { c: qs.get('c') || 'curtains', h: null };
  const n = id => TM.products.filter(p => p.cat === id).length;
  $('#cnav').innerHTML = TM.categories.map(c => `<button data-c="${c.id}">${c.name}<span>${n(c.id)}</span></button>`).join('');
  $('#cchips').innerHTML = TM.categories.map(c => `<button data-c="${c.id}">${c.short}</button>`).join('');
  const row = p => `<div class="prow" role="row">
      <img src="${p.cat === 'curtains' ? '/img/curtain.jpg' : p.img}" alt="" loading="lazy">
      <div><h3>${p.name}</h3><p>${p.use}</p><p class="ms">${[p.kw && p.kw + ' кВт', p.series && 'серия ' + p.series, p.height && 'проём ' + p.height].filter(Boolean).join(' · ')}</p></div>
      <div class="c"><small>Мощность</small>${p.kw ? p.kw + ' кВт' : 'по расчёту'}</div>
      <div class="c"><small>${p.series ? 'Серия' : 'Нагрев'}</small>${p.series || (p.heat || '—')}</div>
      <div class="c"><small>Проём</small>${p.height || '—'}</div>
      <a class="lnk" href="${TM.wa('Здравствуйте! Интересует ' + p.name + '. Подскажите цену и наличие.')}" target="_blank" rel="noopener">Узнать цену →</a>
    </div>`;
  const render = () => {
    const cat = TM.categories.find(c => c.id === st.c);
    $('#ct').textContent = cat.name; $('#cs').textContent = cat.text;
    $$('#cnav button,#cchips button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === st.c));
    $('#cf').innerHTML = st.c === 'curtains' ? [['low', 'Проём до 3,5 м'], ['high', 'Проём до 6,5 м']].map(([v, l]) => `<button data-v="${v}" aria-pressed="${st.h === v}">${l}</button>`).join('') : '';
    $('#clist').innerHTML = TM.products.filter(p => p.cat === st.c && (!st.h || p.hKey === st.h)).map(row).join('');
  };
  const setC = c => { st.c = c; st.h = null; history.replaceState(null, '', '?c=' + c); render(); };
  $('#cnav').addEventListener('click', e => { const b = e.target.closest('button'); b && setC(b.dataset.c); });
  $('#cchips').addEventListener('click', e => { const b = e.target.closest('button'); b && setC(b.dataset.c); });
  $('#cf').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; st.h = st.h === b.dataset.v ? null : b.dataset.v; render(); });
  render();
})();
