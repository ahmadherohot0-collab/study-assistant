// Smart Study Assistant - Extra features (loaded after app.js)
// Flashcards (spaced repetition) · Exam timer · Weakness insights · Text-to-speech ·
// Summaries library + AI study aids · Settings (Gemini key) · Open-ended questions
//
// Relies on helpers defined in app.js: escapeHtml, safeMarkdown, showToast, refreshIcons,
// and on globals: studyDB, studyAI, booksList, currentQuiz, currentQuestionIndex,
// userAnswers, lastQuizSubmission, lastUploadedMaterial.

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => escapeHtml(s);
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const getBooks = () => (typeof booksList !== 'undefined' ? booksList : []);
  const bookNameById = (id) => {
    const b = getBooks().find((x) => Number(x.id) === Number(id));
    return b ? b.name : 'المادة';
  };
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Summaries are normally Markdown text, but some older rows hold a JSON string.
  function materialText(m) {
    let s = String(m.summary || '').trim();
    if (s.startsWith('{')) {
      try {
        const o = JSON.parse(s);
        s = o.summary || o.extracted_text || s;
      } catch (e) { /* keep raw text */ }
    }
    if (!s && m.extracted_text) s = String(m.extracted_text);
    return s.trim();
  }

  // =====================================================================
  // 1) SETTINGS (Gemini API key + speech rate)
  // =====================================================================
  window.openSettingsModal = function () {
    const modal = $('modal-settings');
    if (!modal) return;
    const keyInput = $('settings-api-key');
    if (keyInput) {
      keyInput.value = '';
      keyInput.placeholder = studyAI.hasApiKey() ? '•••••••• (المفتاح محفوظ — اتركه فارغاً للإبقاء عليه)' : 'الصق مفتاح Gemini هنا';
    }
    const rate = $('settings-tts-rate');
    if (rate) rate.value = localStorage.getItem('study_tts_rate') || '0.95';
    const status = $('settings-key-status');
    if (status) status.textContent = studyAI.hasApiKey() ? '✅ يوجد مفتاح محفوظ على هذا الجهاز' : '⚠️ لا يوجد مفتاح — لن يعمل التحليل بالذكاء الاصطناعي';
    const result = $('settings-test-result');
    if (result) result.textContent = '';
    modal.classList.remove('hidden');
    refreshIcons();
  };

  window.closeSettingsModal = function () {
    const modal = $('modal-settings');
    if (modal) modal.classList.add('hidden');
  };

  window.saveSettings = function () {
    const key = ($('settings-api-key') || {}).value || '';
    if (key.trim()) studyAI.setApiKey(key);
    const rate = parseFloat(($('settings-tts-rate') || {}).value);
    if (rate >= 0.5 && rate <= 1.5) localStorage.setItem('study_tts_rate', String(rate));
    showToast('تم حفظ الإعدادات ✅', 'success');
    closeSettingsModal();
  };

  window.clearApiKey = function () {
    if (!confirm('حذف مفتاح Gemini من هذا الجهاز؟')) return;
    studyAI.clearApiKey();
    openSettingsModal();
  };

  window.testApiKey = async function () {
    const typed = (($('settings-api-key') || {}).value || '').trim();
    if (typed) studyAI.setApiKey(typed);
    const out = $('settings-test-result');
    if (out) out.textContent = 'جاري الاختبار...';
    try {
      const reply = await studyAI.callGemini([{ role: 'user', parts: [{ text: 'أجب بكلمة واحدة فقط: جاهز' }] }]);
      if (out) out.textContent = '✅ المفتاح يعمل: ' + String(reply).trim().slice(0, 40);
    } catch (e) {
      if (out) out.textContent = '❌ ' + e.message.slice(0, 220);
    }
  };

  // =====================================================================
  // 2) TEXT-TO-SPEECH
  // =====================================================================
  const Speech = (function () {
    const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    let token = 0;
    let activeBtn = null;
    let warnedNoArabic = false;

    function plain(md) {
      return String(md || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/^\s{0,3}#{1,6}\s*/gm, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+[.)]\s+/gm, '')
        .replace(/^[\s|:\-]+$/gm, ' ')
        .replace(/[*_~>|]/g, ' ')
        .replace(/\n+/g, '. ')
        .replace(/\.\s*\./g, '.')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Chrome stops very long utterances after ~15s, so we read sentence by sentence.
    function chunk(text, max = 170) {
      const parts = text.match(/[^.!؟?؛]+[.!؟?؛]?/g) || [text];
      const out = [];
      let cur = '';
      for (const raw of parts) {
        const p = raw.trim();
        if (!p) continue;
        if ((cur + ' ' + p).length > max && cur) { out.push(cur); cur = ''; }
        if (p.length > max) {
          const words = p.split(' ');
          let piece = '';
          for (const w of words) {
            if ((piece + ' ' + w).length > max && piece) { out.push(piece); piece = w; }
            else piece = piece ? piece + ' ' + w : w;
          }
          cur = piece;
        } else {
          cur = cur ? cur + ' ' + p : p;
        }
      }
      if (cur) out.push(cur);
      return out;
    }

    function setBtn(btn, speaking) {
      if (!btn) return;
      if (!btn.dataset.label) btn.dataset.label = btn.innerHTML;
      btn.innerHTML = speaking ? '<span>⏹ إيقاف القراءة</span>' : btn.dataset.label;
      if (!speaking) refreshIcons();
    }

    function stop() {
      token++;
      if (supported) window.speechSynthesis.cancel();
      if (activeBtn) { setBtn(activeBtn, false); activeBtn = null; }
    }

    function speak(markdownOrText, btn) {
      if (!supported) { showToast('جهازك لا يدعم القراءة الصوتية', 'warn'); return; }
      if (activeBtn && btn && activeBtn === btn) { stop(); return; }   // toggle off
      stop();
      const text = plain(markdownOrText);
      if (!text) { showToast('لا يوجد نص للقراءة', 'warn'); return; }

      const myToken = token;
      const chunks = chunk(text);
      const voices = window.speechSynthesis.getVoices() || [];
      const voice = voices.find((v) => /^ar/i.test(v.lang));
      if (!voice && !warnedNoArabic) {
        warnedNoArabic = true;
        showToast('لا يوجد صوت عربي على جهازك. ثبّت صوتاً عربياً من إعدادات «تحويل النص إلى كلام».', 'warn');
      }
      const rate = parseFloat(localStorage.getItem('study_tts_rate')) || 0.95;

      activeBtn = btn || null;
      setBtn(activeBtn, true);

      let i = 0;
      const next = () => {
        if (myToken !== token) return;                         // cancelled meanwhile
        if (i >= chunks.length) { stop(); return; }
        const u = new SpeechSynthesisUtterance(chunks[i++]);
        u.lang = voice ? voice.lang : 'ar-SA';
        if (voice) u.voice = voice;
        u.rate = rate;
        u.onend = next;
        u.onerror = () => { if (myToken === token) next(); };
        window.speechSynthesis.speak(u);
      };
      next();
    }

    if (supported) window.speechSynthesis.onvoiceschanged = () => {};   // warm up voice list
    return { speak, stop, supported };
  })();

  window.stopSpeech = Speech.stop;
  window.speakText = (text, btn) => Speech.speak(text, btn);
  window.speakSummaryFromResult = function (btn) {
    const el = $('material-summary-content');
    Speech.speak(el ? el.innerText : '', btn);
  };

  // =====================================================================
  // 3) FLASHCARDS (Leitner boxes)
  // =====================================================================
  const Flash = (function () {
    const DAY = 86400000;
    const INTERVALS = [0, 1, 3, 7, 14, 30];       // days per box (0..5)
    let session = null;

    const bookId = () => {
      const el = $('flash-book-select');
      return el && el.value ? Number(el.value) : 0;
    };

    async function addFromText(bid, materialId, text, count) {
      const existing = (await studyDB.getFlashcards(bid)).map((c) => c.front);
      const cards = await studyAI.generateFlashcards(bookNameById(bid), text, count, existing);
      const known = new Set(existing.map(norm));
      const fresh = cards.filter((c) => !known.has(norm(c.front)));
      const added = await studyDB.addFlashcards(fresh.map((c) => ({ ...c, book_id: bid, material_id: materialId || 0 })));
      return added;
    }

    async function refresh() {
      const box = $('flash-summary-area');
      if (!box) return;
      const id = bookId();
      if (!id) {
        box.classList.add('hidden');
        return;
      }
      box.classList.remove('hidden');
      const cards = await studyDB.getFlashcards(id);
      const now = Date.now();
      const due = cards.filter((c) => c.due <= now).length;
      $('flash-stat-total').textContent = cards.length;
      $('flash-stat-due').textContent = due;
      $('flash-stat-new').textContent = cards.filter((c) => !c.reviews).length;
      $('flash-stat-mastered').textContent = cards.filter((c) => c.box >= 4).length;

      const startBtn = $('flash-start-btn');
      if (startBtn) {
        startBtn.disabled = due === 0;
        startBtn.classList.toggle('opacity-50', due === 0);
        $('flash-start-label').textContent = due ? `ابدأ مراجعة اليوم (${due} بطاقة)` : 'لا توجد بطاقات مستحقة الآن 🎉';
      }

      const list = $('flash-list');
      if (list) {
        if (!cards.length) {
          list.innerHTML = '<p class="text-center text-sm text-slate-400 py-6">لا توجد بطاقات بعد. اضغط «توليد بطاقات» ليصنعها الذكاء الاصطناعي من ملخصاتك.</p>';
        } else {
          list.innerHTML = cards
            .slice()
            .sort((a, b) => a.due - b.due)
            .slice(0, 60)
            .map((c) => `
              <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="font-black text-slate-800 dark:text-slate-100 leading-relaxed">${esc(c.front)}</div>
                  <button onclick="Flash.remove(${c.id})" class="text-slate-400 hover:text-rose-500 p-1 rounded-lg shrink-0" title="حذف البطاقة">🗑</button>
                </div>
                <div class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">${esc(c.back)}</div>
                <div class="text-[10px] text-slate-400">المستوى ${c.box || 0}/5 · ${c.due <= now ? 'مستحقة الآن' : 'القادمة: ' + new Date(c.due).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</div>
              </div>`)
            .join('');
          if (cards.length > 60) list.innerHTML += `<p class="text-center text-[11px] text-slate-400">يعرض أول 60 بطاقة من ${cards.length}</p>`;
        }
      }
    }

    async function generate() {
      const id = bookId();
      if (!id) { showToast('اختر مادة أولاً', 'warn'); return; }
      const count = parseInt(($('flash-count-select') || {}).value, 10) || 12;
      const btn = $('flash-generate-btn');
      const old = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>جاري التوليد...</span>';
      try {
        const mats = await studyDB.getMaterials(id);
        const text = mats.map((m) => `### ${m.title}\n${materialText(m)}`).filter((t) => t.length > 30).join('\n\n');
        if (!text.trim()) { showToast('لا توجد ملخصات لهذه المادة. أضف صفحات أولاً.', 'warn'); return; }
        const added = await addFromText(id, 0, text, count);
        showToast(added ? `تمت إضافة ${added} بطاقة 🃏` : 'لم تُضف بطاقات جديدة (قد تكون مكررة)', added ? 'success' : 'warn');
        await refresh();
      } catch (e) {
        if (e.code !== 'NO_API_KEY') alert('تعذر توليد البطاقات:\n' + e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
        refreshIcons();
      }
    }

    async function generateFromMaterial(bid, materialId, text, btn) {
      const old = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = '<span>جاري التوليد...</span>'; }
      try {
        const added = await addFromText(Number(bid), Number(materialId) || 0, text, 10);
        showToast(added ? `تمت إضافة ${added} بطاقة — تجدها في تبويب «البطاقات» 🃏` : 'لم تُضف بطاقات جديدة', added ? 'success' : 'warn');
      } catch (e) {
        if (e.code !== 'NO_API_KEY') alert('تعذر توليد البطاقات:\n' + e.message);
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = old; refreshIcons(); }
      }
    }

    async function fromWrongAnswers() {
      const sub = typeof lastQuizSubmission !== 'undefined' ? lastQuizSubmission : null;
      if (!sub) return;
      const wrong = (sub.details || []).filter((d) => !d.is_correct);
      if (!wrong.length) { showToast('لا توجد أخطاء 👏', 'info'); return; }
      const bid = Number(sub.book_id);
      const known = new Set((await studyDB.getFlashcards(bid)).map((c) => norm(c.front)));
      const cards = wrong
        .filter((d) => !known.has(norm(d.question)))
        .map((d) => ({
          book_id: bid,
          front: d.question,
          back: d.correct_answer + (d.explanation && !/لا يوجد توضيح/.test(d.explanation) ? '\n\n💡 ' + d.explanation : '')
        }));
      if (!cards.length) { showToast('هذه الأسئلة موجودة سابقاً في بطاقاتك', 'info'); return; }
      const n = await studyDB.addFlashcards(cards);
      showToast(`تحولت ${n} من أخطائك إلى بطاقات مراجعة 🃏`, 'success');
    }

    async function start() {
      const id = bookId();
      if (!id) return;
      const all = await studyDB.getFlashcards(id);
      const now = Date.now();
      const queue = all.filter((c) => c.due <= now).sort((a, b) => a.due - b.due).slice(0, 30);
      if (!queue.length) { showToast('لا توجد بطاقات مستحقة الآن 🎉', 'info'); return; }
      session = { queue, idx: 0, known: 0, again: 0, flipped: false };
      $('flash-setup').classList.add('hidden');
      $('flash-done').classList.add('hidden');
      $('flash-review').classList.remove('hidden');
      renderCard();
    }

    function renderCard() {
      if (!session) return;
      const c = session.queue[session.idx];
      if (!c) { finish(); return; }
      $('flash-counter').textContent = `البطاقة ${session.idx + 1} من ${session.queue.length}`;
      $('flash-progress').style.width = `${Math.round((session.idx / session.queue.length) * 100)}%`;
      $('flash-front').textContent = c.front;
      $('flash-back').textContent = c.back;
      $('flash-card').classList.remove('flipped');
      $('flash-rating').classList.add('hidden');
      $('flash-hint').classList.remove('hidden');
      session.flipped = false;
      Speech.stop();
    }

    function flip() {
      if (!session || !session.queue[session.idx]) return;
      session.flipped = !session.flipped;
      $('flash-card').classList.toggle('flipped', session.flipped);
      $('flash-rating').classList.toggle('hidden', !session.flipped);
      $('flash-hint').classList.toggle('hidden', session.flipped);
    }

    async function rate(grade) {
      if (!session || !session.flipped) return;
      const c = session.queue[session.idx];
      if (!c) return;
      let box = c.box || 0;
      let days;
      if (grade === 'again') { box = 0; days = 0; }
      else if (grade === 'hard') { days = Math.max(1, Math.round(INTERVALS[box] / 2)); }
      else if (grade === 'good') { box = Math.min(5, box + 1); days = INTERVALS[box]; }
      else { box = Math.min(5, box + 2); days = INTERVALS[box]; }
      const due = days === 0 ? Date.now() + 10 * 60 * 1000 : Date.now() + days * DAY;
      const updates = { box, due, reviews: (c.reviews || 0) + 1, lapses: (c.lapses || 0) + (grade === 'again' ? 1 : 0), last_reviewed: Date.now() };
      Object.assign(c, updates);
      try { await studyDB.updateFlashcard(c.id, updates); } catch (e) { console.warn(e); }

      if (grade === 'again') {
        session.again++;
        if (!c._requeued) { c._requeued = true; session.queue.push(c); }  // see it once more this session
      } else {
        session.known++;
      }
      session.idx++;
      renderCard();
    }

    function finish() {
      const s = session;
      session = null;
      $('flash-review').classList.add('hidden');
      const done = $('flash-done');
      done.classList.remove('hidden');
      done.innerHTML = `
        <div class="text-5xl">🎉</div>
        <h3 class="text-2xl font-black text-slate-900 dark:text-white">أنهيت مراجعة اليوم!</h3>
        <p class="text-sm text-slate-500">عرفت <b class="text-emerald-600">${s ? s.known : 0}</b> بطاقة، وتحتاج إعادة <b class="text-rose-500">${s ? s.again : 0}</b> (ستعود لك قريباً).</p>
        <button onclick="Flash.backToSetup()" class="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow transition">العودة للبطاقات</button>`;
    }

    function exit() {
      if (session && !confirm('إنهاء جلسة المراجعة؟ تقدمك محفوظ.')) return;
      session = null;
      backToSetup();
    }

    function backToSetup() {
      Speech.stop();
      $('flash-review').classList.add('hidden');
      $('flash-done').classList.add('hidden');
      $('flash-setup').classList.remove('hidden');
      refresh();
    }

    async function remove(id) {
      if (!confirm('حذف هذه البطاقة؟')) return;
      await studyDB.deleteFlashcard(id);
      refresh();
    }

    function speakCurrent(btn) {
      if (!session) return;
      const c = session.queue[session.idx];
      if (c) Speech.speak(session.flipped ? c.back : c.front, btn);
    }

    document.addEventListener('keydown', (e) => {
      if (!session || $('flash-review').classList.contains('hidden')) return;
      if (/^(TEXTAREA|INPUT|SELECT)$/.test((e.target || {}).tagName || '')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      else if (e.key === '1') rate('again');
      else if (e.key === '2') rate('hard');
      else if (e.key === '3') rate('good');
      else if (e.key === '4') rate('easy');
    });

    return {
      onShow: refresh, refresh, generate, generateFromMaterial, fromWrongAnswers,
      start, flip, rate, exit, backToSetup, remove, speakCurrent
    };
  })();
  window.Flash = Flash;

  // =====================================================================
  // 4) EXAM TIMER
  // =====================================================================
  const QuizTimer = (function () {
    let id = null;
    let deadline = 0;
    let total = 0;

    function render() {
      const left = Math.max(0, deadline - Date.now());
      const sec = Math.ceil(left / 1000);
      const txt = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      const label = $('quiz-timer-text');
      const wrap = $('quiz-timer');
      if (label) label.textContent = txt;
      if (wrap) {
        const danger = left <= total * 0.2;
        wrap.classList.toggle('bg-rose-100', danger);
        wrap.classList.toggle('text-rose-600', danger);
        wrap.classList.toggle('animate-pulse', danger);
      }
      if (left <= 0) {
        stop();
        showToast('انتهى الوقت ⏰ تم تسليم الاختبار تلقائياً', 'warn');
        if (typeof currentQuiz !== 'undefined' && currentQuiz) submitQuizAnswers();
      }
    }

    function start(questionCount) {
      stop();
      const secPer = parseInt(($('quiz-timer-select') || {}).value, 10) || 0;
      if (!secPer || !questionCount) return;
      total = secPer * questionCount * 1000;
      deadline = Date.now() + total;                 // wall-clock based: survives tab throttling
      const wrap = $('quiz-timer');
      if (wrap) wrap.classList.remove('hidden');
      render();
      id = setInterval(render, 500);
    }

    function stop() {
      if (id) clearInterval(id);
      id = null;
      const wrap = $('quiz-timer');
      if (wrap) {
        wrap.classList.add('hidden');
        wrap.classList.remove('bg-rose-100', 'text-rose-600', 'animate-pulse');
      }
    }

    return { start, stop };
  })();
  window.QuizTimer = QuizTimer;

  // =====================================================================
  // 5) OPEN-ENDED QUESTIONS (short answer / essay: self-graded)
  // =====================================================================
  const OpenQ = (function () {
    let ctx = { quiz: null, byIdx: {} };

    function state(idx) {
      if (ctx.quiz !== currentQuiz) ctx = { quiz: currentQuiz, byIdx: {} };
      return ctx.byIdx[idx] || (ctx.byIdx[idx] = { draft: '', revealed: false });
    }

    function render(q, container, selected) {
      const idx = currentQuestionIndex;
      const st = state(idx);
      const answered = selected !== undefined;

      let hintText = 'اكتب إجابتك هنا بأسلوبك...';
      let actionLabel = 'اكتب إجابتك ثم اكشف الإجابة النموذجية وقارنها:';
      if (q.type === 'definition') {
        hintText = 'عرّف المصطلح بأسلوبك أو كما ورد في الكتاب...';
        actionLabel = '📖 اكتب تعريفك للمصطلح ثم اكشف الإجابة النموذجية للتأكد:';
      } else if (q.type === 'reasoning') {
        hintText = 'اكتب التعليل والتفسير العلمي هنا...';
        actionLabel = '❓ اكتب سبب التعليل ثم اكشف الإجابة النموذجية:';
      } else if (q.type === 'fill_blank') {
        hintText = 'اكتب الكلمة أو العبارة المناسبة لإكمال الفراغ...';
        actionLabel = '✏️ اكتب الكلمة أو الكلمات الناقصة في الفراغ:';
      }

      container.innerHTML = `
        <div class="space-y-3">
          <p class="text-xs font-bold text-slate-500 dark:text-slate-400">${actionLabel}</p>
          <textarea id="open-answer-input" rows="${q.type === 'fill_blank' ? 2 : 4}" placeholder="${hintText}"
            class="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500">${esc(st.draft)}</textarea>
          ${!st.revealed ? `
            <button onclick="OpenQ.reveal()" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-brand-600 dark:to-brand-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2">
              <span>👁️ اكشف الإجابة النموذجية وقارنها</span>
            </button>
          ` : `
            <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5 animate-fadeIn">
              <div class="text-[11px] font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <span>✓ الإجابة النموذجية المعتمدة:</span>
              </div>
              <div class="text-sm font-bold leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-100">${esc(q.correct_answer)}</div>
              ${q.explanation ? `
                <div class="pt-2 mt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs text-slate-600 dark:text-slate-300">
                  <span class="font-bold text-emerald-700 dark:text-emerald-400">💡 الشرح: </span>${esc(q.explanation)}
                </div>
              ` : ''}
            </div>
            <div class="text-xs font-bold text-slate-500 text-center pt-1">كيف ترى إجابتك مقارنة بالنموذج؟</div>
            <div class="grid grid-cols-2 gap-2.5">
              <button onclick="OpenQ.grade(true)" class="py-3 rounded-2xl font-black text-sm border-2 transition flex items-center justify-center gap-1.5 ${answered && selected === q.correct_answer ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}">
                <span>✅ إجابتي صحيحة</span>
              </button>
              <button onclick="OpenQ.grade(false)" class="py-3 rounded-2xl font-black text-sm border-2 transition flex items-center justify-center gap-1.5 ${answered && selected !== q.correct_answer ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'}">
                <span>❌ أخطأت / نسيت</span>
              </button>
            </div>`}
        </div>
      `;
      const ta = $('open-answer-input');
      if (ta) ta.addEventListener('input', (e) => { st.draft = e.target.value; });
    }

    function reveal() {
      state(currentQuestionIndex).revealed = true;
      renderActiveQuestion();
    }

    function grade(ok) {
      const idx = currentQuestionIndex;
      const q = currentQuiz.questions[idx];
      const st = state(idx);
      userAnswers[idx] = ok ? q.correct_answer : ((st.draft.trim() || 'لم أجب بدقة') + ' (تقييم ذاتي: غير صحيح)');
      renderActiveQuestion();
    }

    return { render, reveal, grade };
  })();
  window.OpenQ = OpenQ;
  window.renderOpenQuestion = OpenQ.render;

  // Called by app.js after every question render.
  window.onQuestionRendered = function (q) {
    const badge = $('quiz-question-type-badge');
    if (badge) {
      let label = 'اختيار من متعدد 🔘';
      let cls = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      if (q.type === 'definition') {
        label = '📖 تعريف مصطلح';
        cls = 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300/50';
      } else if (q.type === 'reasoning') {
        label = '❓ علل واذكر السبب';
        cls = 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/50';
      } else if (q.type === 'fill_blank') {
        label = '✏️ أكمل الفراغ';
        cls = 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-300/50';
      } else if (q.type === 'true_false') {
        label = '⚖️ صح أو خطأ';
        cls = 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300/50';
      } else if (q.type === 'mcq') {
        label = '🔘 اختيار من متعدد';
        cls = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300/50';
      } else if (!q.options || q.options.length === 0) {
        label = '✍️ سؤال كتابي (تقييم ذاتي)';
        cls = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/50';
      }
      badge.textContent = label;
      badge.className = `px-3 py-1 rounded-full text-xs font-bold ${cls}`;
    }
    const rephrase = $('btn-rephrase-question');
    if (rephrase) rephrase.classList.remove('hidden');
  };

  // Called by app.js after the results screen is shown.
  window.onQuizResultsShown = function (result) {
    const wrong = (result.details || []).filter((d) => !d.is_correct).length;
    const btn = $('wrong-to-cards-btn');
    if (btn) btn.classList.toggle('hidden', wrong === 0);
  };

  // =====================================================================
  // 6) WEAKNESS INSIGHTS
  // =====================================================================
  const Insights = (function () {
    let last = null;

    const bookId = () => {
      const el = $('insights-book-select');
      return el && el.value ? Number(el.value) : 0;
    };
    const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };

    function streakOf(allHistory) {
      const days = new Set(allHistory.map((h) => dayKey(h.date)));
      let n = 0;
      const d = new Date();
      if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
      while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
      return n;
    }

    async function analyze(id) {
      const [allHistory, questions, materials] = await Promise.all([
        studyDB.getHistory(), studyDB.getQuestions(id), studyDB.getMaterials(id)
      ]);
      const hist = allHistory.filter((h) => Number(h.book_id) === Number(id));   // newest first
      const qByText = new Map(questions.map((q) => [norm(q.question), q]));
      const matTitle = new Map(materials.map((m) => [Number(m.id), m.title + (m.page_range ? ` (${m.page_range})` : '')]));

      const items = new Map();
      for (const h of hist) {
        for (const d of (h.details || [])) {
          const key = norm(d.question);
          if (!key) continue;
          let it = items.get(key);
          if (!it) {
            const dbq = qByText.get(key) || null;
            it = {
              key, question: d.question, correct_answer: d.correct_answer, explanation: d.explanation,
              material_id: Number(d.material_id || (dbq && dbq.material_id) || 0),
              options: (dbq && dbq.options && dbq.options.length ? dbq.options : d.options) || [],
              dbq, total: 0, wrong: 0
            };
            items.set(key, it);
          }
          it.total++;
          if (!d.is_correct) it.wrong++;
        }
      }

      const topicMap = new Map();
      for (const it of items.values()) {
        const tid = it.material_id || 0;
        const t = topicMap.get(tid) || { id: tid, title: tid ? (matTitle.get(tid) || 'درس محذوف') : 'أسئلة متجددة / غير مصنّفة', total: 0, wrong: 0 };
        t.total += it.total;
        t.wrong += it.wrong;
        topicMap.set(tid, t);
      }
      const topics = [...topicMap.values()]
        .map((t) => ({ ...t, acc: Math.round((100 * (t.total - t.wrong)) / t.total) }))
        .sort((a, b) => a.acc - b.acc);

      const weak = [...items.values()]
        .filter((it) => it.wrong / it.total >= 0.5)
        .sort((a, b) => b.wrong / b.total - a.wrong / a.total || b.total - a.total);

      const chrono = hist.slice().reverse().map((h) => h.percentage || 0);
      const recent = chrono.slice(-5);
      const before = chrono.slice(-10, -5);
      const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);

      return {
        id, hist, topics, weak,
        trend: chrono.slice(-10),
        avgRecent: avg(recent), avgBefore: avg(before),
        streak: streakOf(allHistory)
      };
    }

    async function load() {
      const box = $('insights-content');
      if (!box) return;
      const id = bookId();
      $('insights-ai-box').innerHTML = '';
      if (!id) { box.innerHTML = '<p class="text-center text-slate-400 py-10">أضف مادة دراسية أولاً.</p>'; return; }
      box.innerHTML = '<p class="text-center text-slate-400 py-10">جاري التحليل...</p>';
      try {
        last = await analyze(id);
        render(last);
      } catch (e) {
        box.innerHTML = `<p class="text-center text-rose-500 py-10">تعذر التحليل: ${esc(e.message)}</p>`;
      }
    }

    function accColor(acc) {
      return acc >= 75 ? 'bg-emerald-500' : acc >= 50 ? 'bg-amber-500' : 'bg-rose-500';
    }

    function render(a) {
      const box = $('insights-content');
      if (!a.hist.length) {
        box.innerHTML = `
          <div class="py-14 text-center text-slate-400">
            <div class="text-5xl mb-3">📊</div>
            <p class="font-bold">لا توجد اختبارات لهذه المادة بعد.</p>
            <p class="text-xs mt-1">أجرِ اختباراً واحداً على الأقل ليظهر لك تحليل نقاط الضعف.</p>
          </div>`;
        return;
      }
      const delta = a.avgRecent !== null && a.avgBefore !== null ? a.avgRecent - a.avgBefore : null;
      const deltaTxt = delta === null ? '—' : (delta > 0 ? `⬆️ +${delta}%` : delta < 0 ? `⬇️ ${delta}%` : '➡️ ثابت');

      const tiles = `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center"><div class="text-2xl font-black text-brand-600">${a.hist.length}</div><div class="text-[11px] font-bold text-slate-500 mt-1">اختبارات أجريتها</div></div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center"><div class="text-2xl font-black text-emerald-600">${a.avgRecent === null ? '—' : a.avgRecent + '%'}</div><div class="text-[11px] font-bold text-slate-500 mt-1">متوسط آخر 5</div></div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center"><div class="text-2xl font-black text-indigo-600">${deltaTxt}</div><div class="text-[11px] font-bold text-slate-500 mt-1">التغير عن قبلها</div></div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center"><div class="text-2xl font-black text-amber-500">${a.streak} 🔥</div><div class="text-[11px] font-bold text-slate-500 mt-1">أيام متتالية</div></div>
        </div>`;

      const trend = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 class="font-black text-sm text-slate-800 dark:text-white">تطور نتائجك (آخر ${a.trend.length} اختبارات)</h3>
          <div class="flex items-end gap-1.5 h-24">
            ${a.trend.map((p) => `<div class="flex-1 flex flex-col items-center justify-end h-full gap-1"><span class="text-[10px] font-bold text-slate-500">${p}</span><div class="w-full rounded-t-lg ${accColor(p)}" style="height:${Math.max(4, p)}%"></div></div>`).join('')}
          </div>
        </div>`;

      const topics = `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <h3 class="font-black text-sm text-slate-800 dark:text-white">دقتك حسب الدرس (الأضعف أولاً)</h3>
          ${a.topics.map((t) => `
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs font-bold"><span class="text-slate-700 dark:text-slate-200">${esc(t.title)}</span><span class="text-slate-500">${t.acc}% · ${t.total - t.wrong}/${t.total}</span></div>
              <div class="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"><div class="h-full ${accColor(t.acc)}" style="width:${t.acc}%"></div></div>
            </div>`).join('')}
        </div>`;

      const weakList = a.weak.length ? `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 space-y-3">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h3 class="font-black text-sm text-rose-600">🎯 أسئلة تخطئ فيها كثيراً (${a.weak.length})</h3>
            <div class="flex gap-2 flex-wrap">
              <button onclick="Insights.focusQuiz()" class="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">اختبرني في نقاط ضعفي</button>
              <button onclick="Insights.weakToCards()" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">🃏 حوّلها لبطاقات</button>
            </div>
          </div>
          ${a.weak.slice(0, 10).map((w) => `
            <div class="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs space-y-1">
              <div class="font-black text-slate-800 dark:text-slate-100 leading-relaxed">${esc(w.question)}</div>
              <div class="text-emerald-700 dark:text-emerald-300 font-bold">✓ ${esc(w.correct_answer)}</div>
              <div class="text-[10px] text-rose-500 font-bold">أخطأت ${w.wrong} من ${w.total} مرة</div>
            </div>`).join('')}
        </div>` : `
        <div class="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-center text-sm font-bold text-emerald-700 dark:text-emerald-300">
          لا توجد أسئلة تخطئ فيها بشكل متكرر حتى الآن. استمر! 🌟
        </div>`;

      const ai = `
        <button id="insights-ai-btn" onclick="Insights.aiAdvice()" class="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-600 text-white font-black text-sm shadow-lg">🤖 اطلب خطة مراجعة من الذكاء الاصطناعي</button>`;

      box.innerHTML = `<div class="space-y-5">${tiles}${trend}${topics}${weakList}${ai}</div>`;
    }

    function buildFocusQuestions() {
      const qs = [];
      for (const w of (last ? last.weak : []).slice(0, 15)) {
        if (w.dbq) { qs.push({ ...w.dbq, options: shuffle(w.dbq.options || []) }); continue; }
        const opts = w.options || [];
        qs.push({
          type: opts.length ? (opts.length === 2 ? 'true_false' : 'mcq') : 'short_answer',
          question: w.question, options: shuffle(opts),
          correct_answer: w.correct_answer, explanation: w.explanation || ''
        });
      }
      return qs;
    }

    function focusQuiz() {
      if (!last) return;
      const qs = buildFocusQuestions();
      if (!qs.length) { showToast('لا توجد أسئلة ضعف قابلة للاختبار', 'warn'); return; }
      startCustomQuiz(last.id, bookNameById(last.id), qs, 'نقاط الضعف 🎯');
    }

    async function weakToCards() {
      if (!last || !last.weak.length) return;
      const known = new Set((await studyDB.getFlashcards(last.id)).map((c) => norm(c.front)));
      const cards = last.weak
        .filter((w) => !known.has(norm(w.question)))
        .map((w) => ({
          book_id: last.id, material_id: w.material_id, front: w.question,
          back: w.correct_answer + (w.explanation && !/لا يوجد توضيح/.test(w.explanation) ? '\n\n💡 ' + w.explanation : '')
        }));
      if (!cards.length) { showToast('بطاقاتها موجودة مسبقاً', 'info'); return; }
      const n = await studyDB.addFlashcards(cards);
      showToast(`أُضيفت ${n} بطاقة إلى تبويب «البطاقات» 🃏`, 'success');
    }

    async function aiAdvice() {
      if (!last) return;
      const btn = $('insights-ai-btn');
      const out = $('insights-ai-box');
      const old = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'جاري التحليل...';
      try {
        const payload = {
          attempts: last.hist.length,
          average_recent_percent: last.avgRecent,
          topics: last.topics.slice(0, 8).map((t) => ({ topic: t.title, accuracy_percent: t.acc, answered: t.total })),
          frequently_missed: last.weak.slice(0, 8).map((w) => ({ question: w.question, correct_answer: w.correct_answer, wrong: w.wrong, times: w.total }))
        };
        const md = await studyAI.analyzeWeakness(bookNameById(last.id), payload);
        out.innerHTML = `<div class="md-body mt-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900 text-sm leading-relaxed">${safeMarkdown(md)}</div>`;
      } catch (e) {
        if (e.code !== 'NO_API_KEY') alert('تعذر التحليل:\n' + e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
      }
    }

    return { onShow: load, load, focusQuiz, weakToCards, aiAdvice };
  })();
  window.Insights = Insights;

  // =====================================================================
  // 7) SUMMARIES LIBRARY (read / listen / cards / table / mind map)
  // =====================================================================
  const Library = (function () {
    let materials = new Map();
    let currentBook = 0;

    async function open(bid) {
      currentBook = Number(bid);
      const modal = $('modal-summaries');
      const body = $('modal-summaries-body');
      if (!modal || !body) return;
      $('modal-summaries-title').textContent = bookNameById(bid);
      body.innerHTML = '<p class="text-center text-slate-400 py-10">جاري التحميل...</p>';
      modal.classList.remove('hidden');
      const list = (await studyDB.getMaterials(bid)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      materials = new Map(list.map((m) => [Number(m.id), m]));
      if (!list.length) {
        body.innerHTML = '<p class="text-center text-slate-400 py-10">لا توجد دروس مضافة لهذه المادة بعد.</p>';
        return;
      }
      body.innerHTML = list.map((m) => {
        const text = materialText(m);
        const date = m.created_at ? new Date(m.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
        return `
          <details class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <summary class="cursor-pointer p-4 flex items-center justify-between gap-3 font-black text-sm text-slate-800 dark:text-white">
              <span>${esc(m.title)} <span class="text-[11px] font-semibold text-slate-400">${esc(m.page_range || '')}</span></span>
              <span class="text-[11px] font-semibold text-slate-400 shrink-0">${esc(date)}</span>
            </summary>
            <div class="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              ${text ? `
              <div class="flex flex-wrap gap-2">
                <button onclick="Library.speak(${m.id}, this)" class="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">🔊 استمع للملخص</button>
                <button onclick="Library.cards(${m.id}, this)" class="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold">🃏 بطاقات من هذا الدرس</button>
                <button onclick="Library.aid(${m.id}, 'table', this)" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">📊 جدول مقارنة</button>
                <button onclick="Library.aid(${m.id}, 'mindmap', this)" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold">🧠 خريطة ذهنية</button>
              </div>
              <div id="aid-${m.id}"></div>
              <div class="md-body text-sm leading-relaxed text-slate-700 dark:text-slate-300">${safeMarkdown(text)}</div>` : '<p class="text-sm text-slate-400">لا يوجد ملخص لهذا الدرس.</p>'}
            </div>
          </details>`;
      }).join('');
    }

    function close() {
      Speech.stop();
      const modal = $('modal-summaries');
      if (modal) modal.classList.add('hidden');
    }

    const textOf = (id) => { const m = materials.get(Number(id)); return m ? materialText(m) : ''; };

    function speak(id, btn) { Speech.speak(textOf(id), btn); }

    function cards(id, btn) { return Flash.generateFromMaterial(currentBook, id, textOf(id), btn); }

    async function aid(id, kind, btn) {
      const host = $(`aid-${id}`);
      if (!host) return;
      const old = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'جاري التوليد...';
      try {
        const md = await studyAI.generateStudyAid(bookNameById(currentBook), textOf(id), kind);
        host.innerHTML = `<div class="md-body p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed overflow-x-auto">${safeMarkdown(md)}</div>`;
      } catch (e) {
        if (e.code !== 'NO_API_KEY') alert('تعذر التوليد:\n' + e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = old;
      }
    }

    return { open, close, speak, cards, aid };
  })();
  window.Library = Library;
  window.openSummaries = (bid) => Library.open(bid);

  // From the "study result" box right after uploading pages
  window.makeFlashcardsFromLastMaterial = function (btn) {
    const m = typeof lastUploadedMaterial !== 'undefined' ? lastUploadedMaterial : null;
    if (!m || !m.summary) { showToast('لا يوجد ملخص بعد', 'warn'); return; }
    Flash.generateFromMaterial(m.book_id, m.id, m.summary, btn);
  };
})();
