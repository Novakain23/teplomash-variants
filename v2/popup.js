/* «Тёплый талон»: lead form that appears after 20 minutes of active time on the site.
   Active time is counted across pages within one browser session; the talon is shown once per session.
   For a demo, open any page with ?popup=now — it appears after 2 seconds. */
(() => {
  const LIMIT = 20 * 60 * 1000;
  const S = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  const demo = new URLSearchParams(location.search).get('popup') === 'now';
  if (S.get('tm_talon') === 'shown' && !demo) return;

  const ic = {
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.7l4.8-1.3A9.8 9.8 0 1 0 12 2.2Zm5.6 13.8c-.24.67-1.4 1.3-1.95 1.34-.5.05-1 .23-3.36-.7-2.84-1.12-4.63-4-4.77-4.2-.14-.18-1.14-1.52-1.14-2.9 0-1.38.72-2.05.98-2.34.25-.28.56-.35.75-.35h.53c.17 0 .4-.06.62.48l.9 2.18c.08.15.13.33.03.52l-.3.5-.45.5c-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.07 1.3 2.36 1.46.3.15.47.12.64-.07l.96-1.12c.2-.3.4-.25.66-.15l2.1.99c.3.15.5.22.57.35.08.13.08.73-.17 1.4Z"/></svg>',
    ph: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  };
  const pains = ['Сквозняк у кассы', 'Большие счета за отопление', 'Мёрзнут сотрудники', 'Пыль и жара летом', 'Нужно на ворота склада'];

  let built = false, el, lastFocus;
  const build = () => {
    built = true;
    el = document.createElement('div');
    el.className = 'talon-wrap'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'tlnT');
    el.innerHTML = `
      <div class="talon">
        <button class="tl-x" aria-label="Закрыть">${ic.x}</button>
        <div class="tl-stub">
          <span class="tl-no">Талон № ${String(Math.floor(1000 + Math.random() * 9000))}</span>
          <img src="/img/c300.png" alt="" class="tl-unit">
          <div class="tl-glow"></div>
          <p class="tl-time"><b>20 минут</b>вы выбираете завесу. За это время через открытую дверь уже ушло немало тепла.</p>
        </div>
        <div class="tl-main">
          <small class="tl-kick">Тёплый талон</small>
          <h3 id="tlnT">Заберите подбор с собой</h3>
          <p class="tl-lead">Отметьте, что беспокоит, — инженер пришлёт 2–3 подходящие модели с ценами. Бесплатно и без обязательств.</p>
          <form class="tl-form" novalidate>
            <fieldset><legend>Что беспокоит больше всего?</legend><div class="tl-chips">${pains.map((p, i) => `<label><input type="checkbox" name="p" value="${p}"${i === 0 ? ' checked' : ''}><span>${p}</span></label>`).join('')}</div></fieldset>
            <fieldset><legend>Куда прислать подбор?</legend>
              <div class="tl-ch"><label><input type="radio" name="c" value="WhatsApp" checked><span>${ic.wa}WhatsApp</span></label><label><input type="radio" name="c" value="Звонок"><span>${ic.ph}Звонок</span></label></div>
              <div class="tl-row"><input type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 ___ ___ __ __" aria-label="Телефон"><button class="btn btn-heat" type="submit">Получить подбор</button></div>
              <p class="tl-err">Укажите телефон, например +7 701 123 45 67</p>
            </fieldset>
          </form>
          <div class="tl-ok" role="status"><b>Талон принят.</b><span>Инженер свяжется в течение 15 минут в рабочее время. Можно продолжать смотреть сайт.</span></div>
          <button class="tl-later">Не сейчас</button>
        </div>
      </div>`;
    document.body.appendChild(el);
    const close = () => { el.classList.remove('open'); document.body.style.overflow = ''; lastFocus && lastFocus.focus && lastFocus.focus(); };
    el.querySelector('.tl-x').onclick = close; el.querySelector('.tl-later').onclick = close;
    el.addEventListener('click', e => { if (e.target === el) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && el.classList.contains('open')) close(); });
    el.querySelector('.tl-form').addEventListener('submit', e => {
      e.preventDefault();
      const tel = el.querySelector('input[type=tel]');
      if (tel.value.replace(/\D/g, '').length < 10) { el.classList.add('bad'); tel.focus(); return; }
      el.classList.remove('bad');
      const pains = [...el.querySelectorAll('input[name=p]:checked')].map(i => i.value);
      const ch = el.querySelector('input[name=c]:checked').value;
      const lead = { source: 'Тёплый талон (20 минут на сайте)', phone: tel.value.trim().slice(0, 24), answers: { 'Беспокоит': pains.join(', ') || 'не указано', 'Куда прислать подбор': ch }, page: location.href };
      const btn = el.querySelector('.tl-form .btn'); btn.disabled = true;
      Promise.resolve(window.TMlead ? window.TMlead(lead) : false).then(ok => {
        btn.disabled = false; el.classList.add('done');
        if (!ok && window.TM) {
          const a = document.createElement('a'); a.className = 'btn btn-heat tl-wa'; a.target = '_blank'; a.rel = 'noopener';
          a.href = TM.wa(`Здравствуйте! Мой номер ${lead.phone}. Беспокоит: ${lead.answers['Беспокоит']}. Пришлите, пожалуйста, подбор завесы (${ch}).`);
          a.innerHTML = ic.wa + 'Отправить в WhatsApp';
          el.querySelector('.tl-ok span').textContent = 'Отправьте талон менеджеру в WhatsApp — текст уже готов.';
          el.querySelector('.tl-ok').appendChild(a);
        }
      });
    });
  };
  const open = () => {
    if (!built) build();
    S.set('tm_talon', 'shown');
    lastFocus = document.activeElement;
    setTimeout(() => { el.classList.add('open'); document.body.style.overflow = 'hidden'; el.querySelector('input[type=tel]').focus({ preventScroll: true }); }, 30);
  };

  if (demo) { setTimeout(open, 2000); return; }
  // count only time when the tab is visible, carried across pages of the site
  let spent = +(S.get('tm_spent') || 0), last = Date.now();
  const tick = () => {
    const now = Date.now();
    if (document.visibilityState === 'visible') spent += now - last;
    last = now; S.set('tm_spent', String(spent));
    if (spent >= LIMIT) { clearInterval(iv); open(); }
  };
  const iv = setInterval(tick, 5000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') last = Date.now(); else tick(); });
})();
