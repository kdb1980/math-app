// ===================================================
// 수학 마스터 - 게임 엔진 + UI
// ===================================================

// ── 상태 ────────────────────────────────────────────

const DEFAULT_STATE = {
  unitIdx: 0,           // UNITS 배열 인덱스
  xp: 0,
  maxXp: 200,
  streak: 0,
  bestStreak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  // 유형별 마스터 진행: { typeId: consecutiveCorrect }
  typeMastery: {},
  // 마스터 완료 유형 목록
  masteredTypes: [],
  // 오답 복습 풀: [{ typeId, unit }]
  reviewPool: [],
  // 획득 쿠폰
  coupons: [],
  // 완료한 단원
  completedUnits: [],
};

let state = {};
let currentProblem = null;   // { problem, typeId, isReview }
let sessionCorrect = 0;
let sessionTotal = 0;

// ── 저장/불러오기 ────────────────────────────────────

function saveState() {
  localStorage.setItem('mathmaster_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('mathmaster_state');
  if (saved) {
    state = Object.assign({}, DEFAULT_STATE, JSON.parse(saved));
  } else {
    state = { ...DEFAULT_STATE };
  }
}

function resetState() {
  if (!confirm('정말 처음부터 시작할까요? 모든 진행 상황이 초기화됩니다.')) return;
  localStorage.removeItem('mathmaster_state');
  state = { ...DEFAULT_STATE };
  saveState();
  showScreen('start');
  updateStartScreen();
}

// ── 현재 단원 ────────────────────────────────────────

function currentUnit() { return UNITS[state.unitIdx]; }

function getTypesByCurrentUnit() {
  return currentUnit().types;
}

// ── 문제 선택 로직 ────────────────────────────────────

function selectNextQuestion() {
  const unit = currentUnit();
  const types = unit.types;

  // 복습 문제 20% 확률로 삽입 (복습 풀에 항목이 있을 때)
  if (state.reviewPool.length > 0 && Math.random() < 0.2) {
    const reviewItem = pick(state.reviewPool);
    // 해당 단원의 타입 찾기
    const allTypes = UNITS.flatMap(u => u.types);
    const type = allTypes.find(t => t.id === reviewItem.typeId);
    if (type) {
      const problem = type.generate();
      return { problem, typeId: type.id, isReview: true };
    }
  }

  // 마스터되지 않은 유형 중에서 선택
  const unmastered = types.filter(t => !state.masteredTypes.includes(t.id));
  if (unmastered.length === 0) {
    // 모두 마스터 → 단원 완료 처리
    return null;
  }

  // 가장 연속 정답이 낮은 유형 우선
  const sorted = unmastered.sort((a, b) => {
    const ca = state.typeMastery[a.id] || 0;
    const cb = state.typeMastery[b.id] || 0;
    return ca - cb;
  });

  // 상위 절반 중 랜덤 선택
  const candidates = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
  const type = pick(candidates);
  const problem = type.generate();
  return { problem, typeId: type.id, isReview: false };
}

// ── 정답 처리 ────────────────────────────────────────

function handleAnswer(isCorrect) {
  sessionTotal++;
  state.totalAnswered++;

  const typeId = currentProblem.typeId;
  const isReview = currentProblem.isReview;

  if (isCorrect) {
    sessionCorrect++;
    state.totalCorrect++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;

    // XP 획득 (스트릭 보너스)
    const xpGain = 10 + Math.min(state.streak * 2, 20);
    state.xp += xpGain;

    // 유형 마스터 진행
    if (!isReview) {
      state.typeMastery[typeId] = (state.typeMastery[typeId] || 0) + 1;
      // 3연속 정답 시 마스터
      if (state.typeMastery[typeId] >= 6 && !state.masteredTypes.includes(typeId)) {
        state.masteredTypes.push(typeId);
      }
    }

    // 복습 풀에서 제거
    if (isReview) {
      state.reviewPool = state.reviewPool.filter(r => r.typeId !== typeId);
    }

    // XP 레벨업 처리
    if (state.xp >= state.maxXp) {
      state.xp = state.xp - state.maxXp;
      state.maxXp = Math.round(state.maxXp * 1.2);
    }

  } else {
    state.streak = 0;

    // 유형 마스터 리셋
    if (!isReview) {
      state.typeMastery[typeId] = 0;
    }

    // 복습 풀에 추가 (중복 방지)
    if (!state.reviewPool.find(r => r.typeId === typeId)) {
      state.reviewPool.push({ typeId, unit: currentUnit().id });
    }
  }

  saveState();
  updateXpBar();
  updateStreak();
}

// ── 단원 완료 체크 ────────────────────────────────────

function checkUnitComplete() {
  const unit = currentUnit();
  const allMastered = unit.types.every(t => state.masteredTypes.includes(t.id));
  if (!allMastered) return false;

  // 정답률 95% 이상 체크
  const accuracy = sessionTotal > 0 ? sessionCorrect / sessionTotal : 0;
  if (accuracy < 0.95 && sessionTotal >= 10) return false;

  return true;
}

// ── 단원 진급 ────────────────────────────────────────

function advanceUnit() {
  const unit = currentUnit();
  if (!state.completedUnits.includes(unit.id)) {
    state.completedUnits.push(unit.id);
  }

  // 쿠폰 발급
  const coupon = {
    ...unit.coupon,
    unitName: unit.name,
    date: new Date().toLocaleDateString('ko-KR'),
    id: Date.now(),
  };
  state.coupons.push(coupon);

  // 다음 단원으로
  if (state.unitIdx < UNITS.length - 1) {
    state.unitIdx++;
  }

  // 세션 리셋
  sessionCorrect = 0;
  sessionTotal = 0;

  saveState();
}

// ── UI 업데이트 ────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
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
  const fireEl = document.querySelector('.streak-fire');
  if (state.streak >= 5) {
    fireEl.textContent = '🔥';
    document.getElementById('streak-display').style.borderColor = '#f59e0b';
  } else {
    fireEl.textContent = '🔥';
    document.getElementById('streak-display').style.borderColor = '';
  }
}

function updateChapterProgress() {
  const unit = currentUnit();
  const types = unit.types;

  document.getElementById('chapter-name').textContent = unit.name;
  document.getElementById('level-badge').textContent = `Lv.${state.unitIdx + 1}`;
  document.getElementById('unit-label').textContent = unit.name;

  const mastered = types.filter(t => state.masteredTypes.includes(t.id)).length;
  document.getElementById('chapter-progress-text').textContent = `${mastered} / ${types.length} 마스터`;

  // 도트 렌더링
  const dots = document.getElementById('chapter-dots');
  dots.innerHTML = '';
  types.forEach(t => {
    const dot = document.createElement('div');
    dot.className = 'chapter-dot';
    if (state.masteredTypes.includes(t.id)) {
      dot.classList.add('mastered');
      dot.title = t.title + ' ✓';
    } else if (currentProblem && currentProblem.typeId === t.id) {
      dot.classList.add('active');
      dot.title = t.title + ' (진행중)';
    }
    dots.appendChild(dot);
  });
}

// ── 문제 렌더링 ────────────────────────────────────────

function renderQuestion() {
  const next = selectNextQuestion();

  if (!next) {
    handleUnitComplete();
    return;
  }

  currentProblem = next;
  const { typeId, isReview } = next;
  const problem = next.problem;

  // 태그
  const unit = currentUnit();
  const typeObj = unit.types.find(t => t.id === typeId)
    || UNITS.flatMap(u => u.types).find(t => t.id === typeId);

  document.getElementById('question-tag').textContent = typeObj ? typeObj.title : '';
  document.getElementById('review-badge').style.display = isReview ? 'inline-block' : 'none';
  document.getElementById('question-text').innerHTML = problem.question.replace(/\n/g, '<br>');

  // 피드백 숨김
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
    document.getElementById('short-answer-input').focus();
  }

  updateChapterProgress();
}

function renderChoices(problem) {
  const btns = document.querySelectorAll('.choice-btn');
  btns.forEach((btn, i) => {
    btn.textContent = problem.choices[i] || '';
    btn.className = 'choice-btn';
    btn.disabled = false;
    btn.onclick = () => onChoiceClick(i, problem);
  });
}

function onChoiceClick(idx, problem) {
  const isCorrect = idx === problem.answerIdx;
  const btns = document.querySelectorAll('.choice-btn');

  // 버튼 비활성화
  btns.forEach(btn => btn.disabled = true);

  // 색상 표시
  btns[problem.answerIdx].classList.add('correct');
  if (!isCorrect) btns[idx].classList.add('wrong');

  // 카드 애니메이션
  const card = document.getElementById('question-card');
  card.classList.remove('correct-flash', 'wrong-shake');
  void card.offsetWidth; // reflow
  card.classList.add(isCorrect ? 'correct-flash' : 'wrong-shake');

  handleAnswer(isCorrect);
  showFeedback(isCorrect, problem.explanation);
}

function onShortAnswerSubmit() {
  const raw = document.getElementById('short-answer-input').value.trim();
  if (!raw) return;
  const problem = currentProblem.problem;
  // 공백 제거 + 숫자 비교 (예: " 6 " == "6", "-4" == "-4")
  const isCorrect = raw.replace(/\s/g, '') === String(problem.answer).replace(/\s/g, '');
  handleAnswer(isCorrect);
  showFeedback(isCorrect, problem.explanation);
  document.getElementById('short-answer-area').style.display = 'none';
}

function showFeedback(isCorrect, explanation) {
  const area = document.getElementById('feedback-area');
  area.style.display = 'block';

  document.getElementById('feedback-icon').textContent = isCorrect ? '🎉' : '😅';
  document.getElementById('feedback-text').textContent = isCorrect
    ? pick(['정답! 🌟', '완벽해! 🔥', '훌륭해! ✨', '맞았어! 💪'])
    : pick(['아쉽다! 다시 해보자 💪', '틀렸어. 풀이를 확인해봐! 📖', '괜찮아, 다음엔 맞출 수 있어! 😊']);

  document.getElementById('explanation-content').innerHTML = explanation.replace(/\n/g, '<br>');

  document.getElementById('btn-show-explanation').style.display = 'none';
  document.getElementById('explanation-box').style.display = isCorrect ? 'none' : 'block';
}

// ── 단원 완료 처리 ────────────────────────────────────

function handleUnitComplete() {
  const unit = currentUnit();
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 100;

  // 정확도가 95% 미만이면 계속 복습
  if (sessionTotal >= 10 && accuracy < 80) {
    // 마스터 일부 리셋하여 재학습
    const weakTypes = unit.types.filter(t => {
      const mastery = state.typeMastery[t.id] || 0;
      return mastery < 3;
    });
    if (weakTypes.length > 0) {
      renderQuestion();
      return;
    }
  }

  const prevUnit = unit;
  advanceUnit();

  // 완료 화면
  document.getElementById('complete-emoji').textContent = '🎉';
  document.getElementById('complete-title').textContent = `${prevUnit.name} 완료!`;
  document.getElementById('complete-subtitle').textContent = `정답률 ${accuracy}% 달성!`;
  document.getElementById('c-correct').textContent = sessionCorrect;
  document.getElementById('c-accuracy').textContent = accuracy + '%';
  document.getElementById('c-streak').textContent = state.bestStreak;

  // 쿠폰 표시
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

// ── 콘페티 애니메이션 ────────────────────────────────

function launchConfetti() {
  const area = document.getElementById('confetti-area');
  area.innerHTML = '';
  const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#fbbf24'];

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${pick(colors)};
      width: ${rInt(6, 12)}px;
      height: ${rInt(6, 12)}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation: confettiFall ${(Math.random() * 2 + 2).toFixed(1)}s ${(Math.random() * 1.5).toFixed(1)}s linear forwards;
    `;
    area.appendChild(piece);
  }
}

// ── 쿠폰 보관함 ────────────────────────────────────────

function openCouponModal() {
  const modal = document.getElementById('coupon-modal');
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
      item.innerHTML = `
        <div class="coupon-mini-emoji">${c.emoji}</div>
        <div>
          <div class="coupon-mini-text">${c.text}</div>
          <div class="coupon-mini-date">${c.unitName} 완료 | ${c.date}</div>
        </div>
      `;
      list.appendChild(item);
    });
  }

  modal.style.display = 'flex';
}

// ── 이벤트 연결 ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateStartScreen();

  // 시작 화면
  document.getElementById('btn-start').addEventListener('click', () => {
    sessionCorrect = 0;
    sessionTotal = 0;
    showScreen('quiz');
    updateXpBar();
    updateStreak();
    renderQuestion();
  });

  document.getElementById('btn-reset').addEventListener('click', resetState);

  // 퀴즈 화면
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

  document.getElementById('btn-next').addEventListener('click', () => {
    renderQuestion();
  });

  // 완료 화면
  document.getElementById('btn-continue').addEventListener('click', () => {
    // 레벨업 화면 표시
    const unit = currentUnit();
    document.getElementById('levelup-badge').textContent = `Lv.${state.unitIdx + 1}`;
    document.getElementById('levelup-desc').textContent = `${unit.name}으로 진급!`;
    showScreen('levelup');
  });

  // 레벨업 화면
  document.getElementById('btn-levelup-continue').addEventListener('click', () => {
    sessionCorrect = 0;
    sessionTotal = 0;
    showScreen('quiz');
    updateXpBar();
    updateStreak();
    renderQuestion();
  });

  // FAB - 쿠폰 보관함
  document.getElementById('fab-coupon').addEventListener('click', openCouponModal);
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('coupon-modal').style.display = 'none';
  });
  document.getElementById('coupon-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('coupon-modal')) {
      document.getElementById('coupon-modal').style.display = 'none';
    }
  });

  // ── Service Worker 등록 ──────────────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  // ── PWA 설치 버튼 ────────────────────────────────
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
    if (outcome === 'accepted') {
      document.getElementById('btn-install').style.display = 'none';
    }
    deferredInstallPrompt = null;
  });

  window.addEventListener('appinstalled', () => {
    document.getElementById('btn-install').style.display = 'none';
  });
});
