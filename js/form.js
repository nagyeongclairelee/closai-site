/* closai.kr — 탭 전환 · 미니체크 3단계 폼 · 전송
   서버 없음. 제출은 Google Apps Script 웹앱(ENDPOINT)으로 POST한다.
   ENDPOINT가 비어 있으면 콘솔에 payload만 찍고 완료 화면을 보여준다(로컬 검증용). */

(function () {
  'use strict';

  // Apps Script 웹앱 배포 URL. README의 배포 안내를 따라 받은 URL을 넣는다.
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzT4Azj3Mqyk45FqdlYPkYu-sS0frSsllweu8Pig2GRdB4oWU-YwUFAa-hMnrKTc66n/exec';

  // 문구: <html lang="en">이면 영어. 폼 값 자체는 각 페이지 HTML의 value를 그대로 보낸다
  var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
  var T = EN ? {
    other: 'Other', missing: 'Still empty: ', emailFmt: 'email format', consent: 'privacy consent', sending: 'Sending…',
    hours: function (h) { return 'You spend about ' + h + ' hours a week on this task alone.'; },
    pref: function (p) { return 'by ' + p.toLowerCase(); }
  } : {
    other: '기타', missing: '아직 비어 있어요: ', emailFmt: '이메일 형식', consent: '개인정보 동의', sending: '보내는 중…',
    hours: function (h) { return '이 업무에만 주당 약 ' + h + '시간을 쓰고 계세요.'; },
    pref: function (p) { return p + particle(p); }
  };

  /* ── 탭 ─────────────────────────────────────── */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

  function selectTab(tab, updateHash) {
    tabs.forEach(function (t, i) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (updateHash && tab.dataset.hash && history.replaceState) {
      history.replaceState(null, '', tab.dataset.hash);
    }
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, true); });
    tab.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus(); selectTab(next, true);
    });
  });

  function syncTabToHash() {
    var hash = location.hash;
    var match = tabs.filter(function (t) { return t.dataset.hash === hash; })[0];
    if (match) {
      selectTab(match, false);
      var section = document.getElementById('diagnosis');
      if (section) section.scrollIntoView({ block: 'start' });
    }
  }
  window.addEventListener('hashchange', syncTabToHash);
  if (location.hash === '#contact') syncTabToHash();

  /* ── "기타" 입력칸 토글 ───────────────────────── */
  document.querySelectorAll('[data-other-for]').forEach(function (box) {
    var name = box.getAttribute('data-other-for');
    var form = box.closest('form');
    form.addEventListener('change', function (e) {
      if (e.target.name !== name) return;
      var other = form.querySelector('[name="' + name + '"][value="' + T.other + '"]');
      var show = other && other.checked;
      box.hidden = !show;
      if (show) box.querySelector('input').focus();
    });
  });

  /* ── 단계 폼 ─────────────────────────────────── */
  function setupForm(form, type) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.form-step[data-step]'));
    var bars = form.querySelectorAll('.steps li');
    var current = 0;

    function showStep(idx) {
      steps.forEach(function (s, i) { s.hidden = i !== idx; });
      Array.prototype.forEach.call(bars, function (b, i) {
        if (i <= idx) b.setAttribute('data-active', ''); else b.removeAttribute('data-active');
      });
      current = idx;
      var top = form.closest('.tabpanel') || form;
      top.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    // 현재 단계의 필수 항목 검사. 체크박스 그룹은 legend에 * 가 있으면 1개 이상 필요
    function validate(step) {
      var errBox = step.querySelector('.form-error');
      var problems = [];

      step.querySelectorAll('input[required], textarea[required]').forEach(function (el) {
        if (el.type === 'radio') {
          if (!form.querySelector('input[name="' + el.name + '"]:checked')) problems.push(labelOf(el));
        } else if (el.type === 'checkbox') {
          if (!el.checked) problems.push(labelOf(el));
        } else if (!el.value.trim()) {
          problems.push(labelOf(el));
        } else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) {
          problems.push(T.emailFmt);
        }
      });

      step.querySelectorAll('fieldset').forEach(function (fs) {
        var legend = fs.querySelector('legend');
        if (!legend || !legend.querySelector('.req')) return;
        var boxes = fs.querySelectorAll('input[type="checkbox"]');
        if (boxes.length && !fs.querySelector('input[type="checkbox"]:checked')) problems.push(cleanLabel(legend));
      });

      var unique = problems.filter(function (p, i) { return problems.indexOf(p) === i; });
      errBox.textContent = unique.length ? T.missing + unique.join(', ') : '';
      if (unique.length) {
        var first = step.querySelector(':invalid, input[required]:not(:checked)');
        if (first && first.type !== 'radio' && first.type !== 'checkbox') first.focus();
      }
      return unique.length === 0;
    }

    function labelOf(el) {
      var fs = el.closest('fieldset');
      if (fs && fs.querySelector('legend')) return cleanLabel(fs.querySelector('legend'));
      if (el.type === 'checkbox' && el.name === 'consent') return T.consent;
      var lab = form.querySelector('label[for="' + el.id + '"]');
      return lab ? cleanLabel(lab) : el.name;
    }
    function cleanLabel(node) {
      var clone = node.cloneNode(true);
      clone.querySelectorAll('.req, .opt').forEach(function (n) { n.remove(); });
      return clone.textContent.trim().replace(/\?$/, '').slice(0, EN ? 48 : 24);
    }

    form.addEventListener('click', function (e) {
      if (e.target.matches('[data-next]')) {
        if (validate(steps[current])) showStep(current + 1);
      } else if (e.target.matches('[data-prev]')) {
        showStep(current - 1);
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var step = steps[current];
      if (!validate(step)) return;
      var hp = form.querySelector('input.hp');
      if (hp && hp.value) return; // 봇이 숨김 칸을 채운 경우

      var btn = form.querySelector('[data-submit]');
      btn.disabled = true; btn.textContent = T.sending;

      var payload = collect(form, type);
      send(payload).then(function (ok) {
        var done = steps[steps.length - 1];
        fillDone(done, form, payload);
        if (!ok) done.querySelector('[data-fallback]').hidden = false;
        showStep(steps.length - 1);
      });
    });

    function collect(form, type) {
      var data = { type: type, page: location.href, submitted_at: new Date().toISOString() };
      var fd = new FormData(form);
      fd.forEach(function (value, key) {
        if (key === 'website') return;
        if (data[key] === undefined) data[key] = value;
        else data[key] = [].concat(data[key], value);
      });
      Object.keys(data).forEach(function (k) { if (Array.isArray(data[k])) data[k] = data[k].join(', '); });
      // "기타" 선택 시 직접 입력값을 본 항목에 합친다
      ['industry', 'tasks', 'tools'].forEach(function (k) {
        var other = data[k + '_other'];
        if (data[k] && data[k].indexOf(T.other) !== -1 && other) data[k] = data[k].replace(T.other, T.other + '(' + other + ')');
        delete data[k + '_other'];
      });
      // 주당 시간: 빈도 구간 중앙값 × 소요 구간 중앙값 ÷ 60 (산수만, 판단값 아님)
      var f = form.querySelector('[name="frequency"]:checked');
      var d = form.querySelector('[name="duration"]:checked');
      if (f && d) data.weekly_hours = Math.round(Number(f.dataset.mid) * Number(d.dataset.mid) / 60 * 10) / 10;
      return data;
    }

    function fillDone(done, form, payload) {
      var pref = done.querySelector('[data-contact-pref]');
      if (pref && payload.contact_pref) pref.textContent = T.pref(payload.contact_pref);
      var hours = done.querySelector('[data-hours]');
      if (hours && payload.weekly_hours) {
        hours.textContent = T.hours(payload.weekly_hours);
        hours.hidden = false;
      }
    }
  }

  // 조사 '(으)로': 받침 있으면 '으로', 없거나 ㄹ 받침이면 '로'
  function particle(word) {
    var code = word.charCodeAt(word.length - 1);
    if (code < 0xac00 || code > 0xd7a3) return '로';
    var jong = (code - 0xac00) % 28;
    return jong === 0 || jong === 8 ? '로' : '으로';
  }

  function send(payload) {
    if (!ENDPOINT) {
      console.log('[closai form] ENDPOINT 미설정. payload:', JSON.stringify(payload));
      return Promise.resolve(true);
    }
    // text/plain + no-cors: Apps Script는 CORS preflight를 처리하지 못하므로 단순 요청으로 보낸다
    return fetch(ENDPOINT, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function () { return true; }).catch(function (err) {
      console.error('[closai form] 전송 실패', err);
      return false;
    });
  }

  var diag = document.getElementById('diagnosis-form');
  var contact = document.getElementById('contact-form');
  if (diag) setupForm(diag, 'diagnosis');
  if (contact) setupForm(contact, 'contact');
})();
