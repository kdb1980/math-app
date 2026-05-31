// ===================================================
// 수학 마스터 - 메인 앱 (Firebase 연동)
// ===================================================

import { auth, db, login, logout, onAuthChange, isAdmin,
         saveProgress, loadProgress, loadAllProgress, resetStudentProgress, ADMIN_EMAIL }
  from './firebase.js';

// ── 상태 ────────────────────────────────────────────

const DEFAULT_STATE = {
  unitIdx: 0,
  xp: 0,
  maxXp: 200,
  streak: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  typeMastery: {},
  masteredTypes: [],
  reviewPool: [],
  coupons: [],
  completedUnits: [],
};

let state = {};
let currentUser = null;
let currentProblem = null;
let sessionCorrect = 0;
let sessionTotal = 0;

// ── 저장/불러오기 ────────────────────────────────────

function saveLocal() {
  localStorage.setItem('mathmaster_state', JSON.stringify(state));
}

async function saveState() {
  saveLocal();
  if (currentUser) {
    await saveProgress(currentUser.uid, state);
  }
}

async function loadState() {
  if (currentUser) {
    const remote = await loadProgress(currentUser.uid);
    if (remote) {
      state = Object.assign({}, DEFAULT_STATE, remote);
      saveLocal();
      return;
    }
  }
  const local = localStorage.getItem('mathmaster_state');
  state = local ? Object.assign({}, DEFAULT_STATE, JSON.parse(local)) : { ...DEFAULT_STATE };
}

// ── 현재 단원 ────────────────────────────────────────

function currentUnit() { return UNITS[state.unitIdx]; }

// ── 문제 선택 ────────────────────────────────────────

function selectNextQuestion() {
  const types = currentUnit().types;

  if (state.reviewPool.length > 0 && Math.random() < 0.2) {
    const item = pick(state.reviewPool);
    const type = UNITS.flatMap(u => u.types).find(t => t.id === item.typeId);
    if (type) return { problem: type.generate(), typeId: type.id, isReview: true };
  }

  const unmastered = types.filter(t => !state.masteredTypes.includes(t.id));
  if (unmastered.length === 0) return null;

  const sorted = unmastered.sort((a, b) =>
    (state.typeMastery[a.id] || 0) - (state.typeMastery[b.id] || 0)
  );
  const candidates = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
  const type = pick(candidates);
  return { problem: type.generate(), typeId: type.id, isReview: false };
}

// ── 정답 처리 ────────────────────────────────────────

async function handleAnswer(isCorrect) {
  sessionTotal++;
  state.totalAnswered++;
  const { typeId, isReview } = currentProblem;

  if (isCorrect) {
    sessionCorrect++;
    state.totalCorrect++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    state.xp += 10 + Math.min(state.streak * 2, 20);
    if (!isReview) {
      state.typeMastery[typeId] = (state.typeMastery[typeId] || 0) + 1;
      if (state.typeMastery[typeId] >= 6 && !state.masteredTypes.includes(typeId)) {
        state.masteredTypes.push(typeId);
      }
    }
    if (isReview) state.reviewPool = state.reviewPool.filter(r => r.typeId !== typeId);
    if (state.xp >= state.maxXp) { state.xp -= state.maxXp; state.maxXp = Math.round(state.maxXp * 1.2); }
  } else {
    state.streak = 0;
    if (!isReview) state.typeMastery[typeId] = 0;
    if (!state.reviewPool.find(r => r.typeId === typeId))
      state.reviewPool.push({ typeId, unit: currentUnit().id });
  }

  await saveState();
  updateXpBar();
  updateStreak();
}

// ── 단원 완료 ────────────────────────────────────────

async function advanceUnit() {
  const unit = currentUnit();
  if (!state.completedUnits.includes(unit.id)) state.completedUnits.push(unit.id);
  state.coupons.push({
    ...unit.coupon,
    unitName: unit.name,
    date: new Date().toLocaleDateString('ko-KR'),
    id: Date.now(),
  });
  if (state.unitIdx < UNITS.length - 1) state.unitIdx++;
  sessionCorrect = 0;
  sessionTotal = 0;
  await saveState();
}

// ── UI 헬퍼 ────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  // FAB 표시 조건
  document.getElementById('fab-coupon').style.display =
    ['start', 'quiz', 'complete', 'levelup'].includes(name) ? 'flex' : 'none';
}

function updateStartScreen() {
  const unit = currentUnit();
  document.getElementById('start-level-badge').textContent = `Lv.${state.unitIdx + 1}`;
  document.getElementById('start-unit-name').textContent = unit.name;
  document.getElementById('start-total-correct').textContent = `${state.totalCorrect}문제`;
  document.getElementById('start-coupon-count').textContent = `${state.coupons.length}개`;
}

function updateXpBar() {
  const pct = Math.min((state.xp / state.maxXp) * 100, 100);
  document.getElementById('xp-bar-fill').style.width = pct + '%';
  document.getElementById('xp-label').textContent = `XP ${state.xp} / ${state.maxXp}`;
}

function updateStreak() {
  document.getElementById('streak-count').textContent = state.streak;
}

function updateChapterProgress() {
  const unit = currentUnit();
  document.getElementById('level-badge').textContent = `Lv.${state.unitIdx + 1}`;
  document.getElementById('unit-label').textContent = unit.name;
  document.getElementById('chapter-name').textContent = unit.name;
  const mastered = unit.types.filter(t => state.masteredTypes.includes(t.id)).length;
  document.getElementById('chapter-progress-text').textContent = `${mastered} / ${unit.types.length} 마스터`;
  const dots = document.getElementById('chapter-dots');
  dots.innerHTML = '';
  unit.types.forEach(t => {
    const dot = document.createElement('div');
    dot.className = 'chapter-dot' +
      (state.masteredTypes.includes(t.id) ? ' mastered' :
       currentProblem?.typeId === t.id ? ' active' : '');
    dots.appendChild(dot);
  });
}

// ── 문제 렌더링 ────────────────────────────────────────

function renderQuestion() {
  const next = selectNextQuestion();
  if (!next) { handleUnitComplete(); return; }

  currentProblem = next;
  const { problem, typeId, isReview } = next;
  const typeObj = UNITS.flatMap(u => u.types).find(t => t.id === typeId);

  document.getElementById('question-tag').textContent = typeObj?.title || '';
  document.getElementById('review-badge').style.display = isReview ? 'inline-block' : 'none';
  document.getElementById('question-text').innerHTML = problem.question.replace(/\n/g, '<br>');
  document.getElementById('feedback-area').style.display = 'none';
  document.getElementById('explanation-box').style.display = 'none';

  if (problem.type === 'multiple') {
    document.getElementById('choices-area').style.display = 'grid';
    document.getElementById('short-answer-area').style.display = 'none';
    renderChoices(problem);
  } else {
    document.getElementById('choices-area').style.display = 'none';
    document.getElementById('short-answer-area').style.display = 'flex';
    document.getElementById('short-answer-input').value = '';
    setTimeout(() => document.getElementById('short-answer-input').focus(), 100);
  }

  updateChapterProgress();
}

function renderChoices(problem) {
  document.querySelectorAll('.choice-btn').forEach((btn, i) => {
    btn.textContent = problem.choices[i] || '';
    btn.className = 'choice-btn';
    btn.disabled = false;
    btn.onclick = () => onChoiceClick(i, problem);
  });
}

function onChoiceClick(idx, problem) {
  const isCorrect = idx === problem.answerIdx;
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
  document.querySelectorAll('.choice-btn')[problem.answerIdx].classList.add('correct');
  if (!isCorrect) document.querySelectorAll('.choice-btn')[idx].classList.add('wrong');
  const card = document.getElementById('question-card');
  card.classList.remove('correct-flash', 'wrong-shake');
  void card.offsetWidth;
  card.classList.add(isCorrect ? 'correct-flash' : 'wrong-shake');
  handleAnswer(isCorrect);
  showFeedback(isCorrect, problem.explanation);
}

function onShortAnswerSubmit() {
  const raw = document.getElementById('short-answer-input').value.trim();
  if (!raw) return;
  const problem = currentProblem.problem;
  const isCorrect = raw.replace(/\s/g, '') === String(problem.answer).replace(/\s/g, '');
  handleAnswer(isCorrect);
  showFeedback(isCorrect, problem.explanation);
  document.getElementById('short-answer-area').style.display = 'none';
}

function showFeedback(isCorrect, explanation) {
  document.getElementById('feedback-area').style.display = 'block';
  document.getElementById('feedback-icon').textContent = isCorrect ? '🎉' : '😅';
  document.getElementById('feedback-text').textContent = isCorrect
    ? pick(['정답! 🌟', '완벽해! 🔥', '훌륭해! ✨', '맞았어! 💪'])
    : pick(['아쉽다! 다시 해보자 💪', '틀렸어. 풀이를 확인해봐! 📖', '괜찮아, 다음엔 맞출 수 있어! 😊']);
  document.getElementById('explanation-content').innerHTML = explanation.replace(/\n/g, '<br>');
  document.getElementById('btn-show-explanation').style.display = 'none';
  document.getElementById('explanation-box').style.display = isCorrect ? 'none' : 'block';
}

// ── 단원 완료 처리 ────────────────────────────────────

async function handleUnitComplete() {
  const unit = currentUnit();
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 100;
  if (sessionTotal >= 10 && accuracy < 80) { renderQuestion(); return; }

  const prevUnit = unit;
  await advanceUnit();

  document.getElementById('complete-title').textContent = `${prevUnit.name} 완료!`;
  document.getElementById('complete-subtitle').textContent = `정답률 ${accuracy}% 달성!`;
  document.getElementById('c-correct').textContent = sessionCorrect;
  document.getElementById('c-accuracy').textContent = accuracy + '%';
  document.getElementById('c-streak').textContent = state.bestStreak;

  const latestCoupon = state.coupons[state.coupons.length - 1];
  if (latestCoupon) {
    document.getElementById('coupon-card').style.display = 'block';
    document.getElementById('coupon-emoji').textContent = latestCoupon.emoji;
    document.getElementById('coupon-text').textContent = latestCoupon.text;
    document.getElementById('coupon-date').textContent = `획득일: ${latestCoupon.date}`;
  }

  launchConfetti();
  showScreen('complete');
}

// ── 콘페티 ────────────────────────────────────────────

function launchConfetti() {
  const area = document.getElementById('confetti-area');
  area.innerHTML = '';
  const colors = ['#0047ab', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#1a6fd4', '#fbbf24'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `left:${Math.random()*100}%;background:${pick(colors)};width:${rInt(6,12)}px;height:${rInt(6,12)}px;border-radius:${Math.random()>.5?'50%':'2px'};animation:confettiFall ${(Math.random()*2+2).toFixed(1)}s ${(Math.random()*1.5).toFixed(1)}s linear forwards;`;
    area.appendChild(p);
  }
}

// ── 쿠폰 보관함 ────────────────────────────────────────

function openCouponModal() {
  const list = document.getElementById('coupon-list');
  const empty = document.getElementById('coupon-empty');
  list.innerHTML = '';
  if (state.coupons.length === 0) {
    empty.style.display = 'block';
    list.style.display = 'none';
  } else {
    empty.style.display = 'none';
    list.style.display = 'flex';
    state.coupons.forEach(c => {
      const item = document.createElement('div');
      item.className = 'coupon-mini';
      item.innerHTML = `<div class="coupon-mini-emoji">${c.emoji}</div><div><div class="coupon-mini-text">${c.text}</div><div class="coupon-mini-date">${c.unitName} | ${c.date}</div></div>`;
      list.appendChild(item);
    });
  }
  document.getElementById('coupon-modal').style.display = 'flex';
}

// ── 관리자 대시보드 ────────────────────────────────────

async function renderAdminDashboard() {
  showScreen('admin');
  document.getElementById('admin-loading').style.display = 'block';
  document.getElementById('student-list').innerHTML = '';
  document.getElementById('admin-empty').style.display = 'none';

  const allProgress = await loadAllProgress();
  document.getElementById('admin-loading').style.display = 'none';

  // 관리자 자신 제외
  const students = allProgress.filter(p => p.id !== currentUser.uid);

  if (students.length === 0) {
    document.getElementById('admin-empty').style.display = 'block';
    return;
  }

  const list = document.getElementById('student-list');
  students.forEach(p => {
    const unit = UNITS[p.unitIdx] || UNITS[0];
    const accuracy = p.totalAnswered > 0
      ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0;
    const masteredCount = (p.masteredTypes || []).length;
    const totalTypes = UNITS.slice(0, p.unitIdx + 1).reduce((s, u) => s + u.types.length, 0);
    const progressPct = totalTypes > 0 ? Math.round((masteredCount / totalTypes) * 100) : 0;
    const updated = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('ko-KR') : '-';

    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
      <div class="student-card-header">
        <div class="student-email">${p.email || p.id}</div>
        <div class="student-level">Lv.${(p.unitIdx || 0) + 1} · ${unit.name}</div>
      </div>
      <div class="student-stats">
        <div class="student-stat">
          <div class="student-stat-num">${p.totalCorrect || 0}</div>
          <div class="student-stat-lbl">총 정답</div>
        </div>
        <div class="student-stat">
          <div class="student-stat-num">${accuracy}%</div>
          <div class="student-stat-lbl">정답률</div>
        </div>
        <div class="student-stat">
          <div class="student-stat-num">${p.bestStreak || 0}</div>
          <div class="student-stat-lbl">최고 스트릭</div>
        </div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-label">
          <span>전체 진도</span><span>${masteredCount} / ${totalTypes} 유형 마스터</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${progressPct}%"></div>
        </div>
      </div>
      <div class="student-updated">마지막 학습: ${updated} · 획득 쿠폰: ${(p.coupons||[]).length}개</div>
      <button class="btn-reset-progress" data-uid="${p.id}" data-email="${p.email || p.id}">
        🔄 진도 초기화
      </button>
    `;
    list.appendChild(card);
  });
}

// ── 리셋 확인 모달 ────────────────────────────────────

function showResetConfirm(uid, email) {
  const modal = document.getElementById('reset-modal');
  modal.dataset.uid = uid;
  document.getElementById('reset-modal-email').textContent = email;
  modal.style.display = 'flex';
}

// ── 토스트 알림 ───────────────────────────────────────

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── 인증 흐름 ────────────────────────────────────────

onAuthChange(async (user) => {
  if (user) {
    currentUser = user;
    if (isAdmin(user)) {
      await renderAdminDashboard();
    } else {
      await loadState();
      updateStartScreen();
      showScreen('start');
    }
  } else {
    currentUser = null;
    showScreen('login');
  }
});

// ── 이벤트 연결 ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // 로그인
  document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    errEl.style.display = 'none';
    if (!email || !pw) { errEl.textContent = '이메일과 비밀번호를 입력하세요.'; errEl.style.display = 'block'; return; }
    document.getElementById('btn-login').textContent = '로그인 중...';
    try {
      await login(email, pw);
    } catch (e) {
      errEl.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
      errEl.style.display = 'block';
      document.getElementById('btn-login').textContent = '로그인';
    }
  });

  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-login').click();
  });

  // 로그아웃
  document.getElementById('btn-logout').addEventListener('click', async () => {
    if (confirm('로그아웃 하시겠어요?')) await logout();
  });
  document.getElementById('btn-admin-logout').addEventListener('click', async () => {
    await logout();
  });

  // 시작 화면
  document.getElementById('btn-start').addEventListener('click', () => {
    sessionCorrect = 0; sessionTotal = 0;
    showScreen('quiz');
    updateXpBar(); updateStreak();
    renderQuestion();
  });

  // 퀴즈
  document.getElementById('btn-home').addEventListener('click', () => {
    updateStartScreen();
    showScreen('start');
  });
  document.getElementById('btn-submit').addEventListener('click', onShortAnswerSubmit);
  document.getElementById('short-answer-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') onShortAnswerSubmit();
  });
  document.getElementById('btn-show-explanation').addEventListener('click', () => {
    document.getElementById('explanation-box').style.display = 'block';
    document.getElementById('btn-show-explanation').style.display = 'none';
  });
  document.getElementById('btn-next').addEventListener('click', renderQuestion);

  // 완료 화면
  document.getElementById('btn-continue').addEventListener('click', () => {
    const unit = currentUnit();
    document.getElementById('levelup-badge').textContent = `Lv.${state.unitIdx + 1}`;
    document.getElementById('levelup-desc').textContent = `${unit.name}으로 진급!`;
    showScreen('levelup');
  });

  // 레벨업
  document.getElementById('btn-levelup-continue').addEventListener('click', () => {
    sessionCorrect = 0; sessionTotal = 0;
    showScreen('quiz');
    updateXpBar(); updateStreak();
    renderQuestion();
  });

  // 관리자: 진도 초기화 버튼 (이벤트 위임)
  document.getElementById('student-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-reset-progress');
    if (!btn) return;
    const uid = btn.dataset.uid;
    const email = btn.dataset.email;
    showResetConfirm(uid, email);
  });

  // 리셋 확인 모달 버튼
  document.getElementById('btn-reset-confirm').addEventListener('click', async () => {
    const uid = document.getElementById('reset-modal').dataset.uid;
    const btn = document.getElementById('btn-reset-confirm');
    btn.textContent = '초기화 중...';
    btn.disabled = true;
    const ok = await resetStudentProgress(uid);
    document.getElementById('reset-modal').style.display = 'none';
    if (ok) {
      showToast('✅ 진도가 초기화되었습니다.');
      await renderAdminDashboard();
    } else {
      showToast('❌ 초기화에 실패했습니다. 다시 시도해주세요.');
    }
    btn.textContent = '네, 초기화합니다';
    btn.disabled = false;
  });

  document.getElementById('btn-reset-cancel').addEventListener('click', () => {
    document.getElementById('reset-modal').style.display = 'none';
  });

  // 쿠폰 FAB
  document.getElementById('fab-coupon').addEventListener('click', openCouponModal);
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('coupon-modal').style.display = 'none';
  });
  document.getElementById('coupon-modal').addEventListener('click', e => {
    if (e.target.id === 'coupon-modal')
      document.getElementById('coupon-modal').style.display = 'none';
  });

  // PWA 설치
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('btn-install').style.display = 'block';
  });
  document.getElementById('btn-install').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') document.getElementById('btn-install').style.display = 'none';
    deferredInstallPrompt = null;
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
