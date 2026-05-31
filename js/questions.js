// ===================================================
// 중학교 수학 문제 생성기
// 대한민국 교육과정 기준 중1~중3
// ===================================================

// 유틸리티 함수
function rInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// 보기 4개 생성 (정답 포함 오답 3개 자동 생성)
function makeChoices(correct, wrongGenerator, count = 4) {
  const wrongs = new Set();
  wrongs.add(String(correct));
  while (wrongs.size < count) {
    const w = wrongGenerator();
    wrongs.add(String(w));
  }
  const choices = [...wrongs];
  // 정답 위치 랜덤 배치
  const correctIdx = rInt(0, count - 1);
  const arr = choices.filter(c => c !== String(correct));
  arr.splice(correctIdx, 0, String(correct));
  return { choices: arr, answerIdx: correctIdx };
}

// ===================================================
// 중1 1학기 문제 유형
// ===================================================

const QUESTION_TYPES_1_1 = [

  // ── 단원 1: 소인수분해 ─────────────────────────────

  {
    id: 'prime_check',
    unit: '1-1',
    chapter: '소인수분해',
    title: '소수와 합성수 판별',
    generate() {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
      const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30, 32, 33, 34, 35];
      const isPrime = Math.random() > 0.4;
      const n = isPrime ? pick(primes) : pick(composites);
      const correctAnswer = isPrime ? '소수' : '합성수';
      const choices = ['소수', '합성수', '소수도 합성수도 아니다', '1'];
      const answerIdx = choices.indexOf(correctAnswer);
      const explanation = isPrime
        ? `${n}의 약수는 1과 ${n}뿐이므로 소수입니다.`
        : `${n}은 1과 ${n} 외에도 다른 약수가 있으므로 합성수입니다.\n예) ${n}의 약수: 1, ${getPrimeFactor(n)[0]}, ..., ${n}`;
      return { question: `${n}은 소수, 합성수 중 어느 것인가요?`, type: 'multiple', choices, answerIdx, explanation };
    }
  },

  {
    id: 'prime_factorization',
    unit: '1-1',
    chapter: '소인수분해',
    title: '소인수분해',
    generate() {
      // 두 소수의 곱 또는 소수^2 * 소수
      const cases = [
        { n: 12, result: '2² × 3' },
        { n: 18, result: '2 × 3²' },
        { n: 20, result: '2² × 5' },
        { n: 24, result: '2³ × 3' },
        { n: 28, result: '2² × 7' },
        { n: 30, result: '2 × 3 × 5' },
        { n: 36, result: '2² × 3²' },
        { n: 45, result: '3² × 5' },
        { n: 48, result: '2⁴ × 3' },
        { n: 50, result: '2 × 5²' },
        { n: 60, result: '2² × 3 × 5' },
        { n: 72, result: '2³ × 3²' },
      ];
      const c = pick(cases);
      const wrongs = cases.filter(x => x.n !== c.n).slice(0, 3).map(x => x.result);
      const choices = shuffle([c.result, ...wrongs]);
      const answerIdx = choices.indexOf(c.result);
      return {
        question: `${c.n}을 소인수분해하면?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `${c.n}을 소수로 나누어 가면:\n${c.n} = ${c.result}`
      };
    }
  },

  {
    id: 'gcd',
    unit: '1-1',
    chapter: '소인수분해',
    title: '최대공약수',
    generate() {
      const pairs = [
        { a: 12, b: 18, gcd: 6 }, { a: 24, b: 36, gcd: 12 }, { a: 15, b: 25, gcd: 5 },
        { a: 16, b: 24, gcd: 8 }, { a: 20, b: 30, gcd: 10 }, { a: 14, b: 21, gcd: 7 },
        { a: 8, b: 12, gcd: 4 }, { a: 18, b: 27, gcd: 9 }, { a: 30, b: 45, gcd: 15 },
        { a: 24, b: 48, gcd: 24 }, { a: 35, b: 49, gcd: 7 }, { a: 28, b: 42, gcd: 14 },
      ];
      const p = pick(pairs);
      const { choices, answerIdx } = makeChoices(p.gcd, () => pick([p.gcd - 1, p.gcd + 1, p.gcd * 2, p.gcd - 2, Math.floor(p.gcd / 2)].filter(x => x > 0 && x !== p.gcd)));
      return {
        question: `${p.a}와 ${p.b}의 최대공약수(GCD)는?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `최대공약수를 구하는 방법 (나눗셈법):\n${p.a}와 ${p.b}를 공약수로 계속 나누면\n→ 최대공약수 = ${p.gcd}`
      };
    }
  },

  {
    id: 'lcm',
    unit: '1-1',
    chapter: '소인수분해',
    title: '최소공배수',
    generate() {
      const pairs = [
        { a: 4, b: 6, lcm: 12 }, { a: 3, b: 5, lcm: 15 }, { a: 6, b: 9, lcm: 18 },
        { a: 8, b: 12, lcm: 24 }, { a: 4, b: 10, lcm: 20 }, { a: 5, b: 6, lcm: 30 },
        { a: 6, b: 8, lcm: 24 }, { a: 9, b: 12, lcm: 36 }, { a: 4, b: 14, lcm: 28 },
        { a: 6, b: 10, lcm: 30 }, { a: 8, b: 10, lcm: 40 },
      ];
      const p = pick(pairs);
      const { choices, answerIdx } = makeChoices(p.lcm, () => pick([p.a * p.b, p.lcm + p.a, p.lcm - p.a, p.lcm * 2].filter(x => x !== p.lcm)));
      return {
        question: `${p.a}와 ${p.b}의 최소공배수(LCM)는?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `최소공배수 = (${p.a} × ${p.b}) ÷ 최대공약수\n= (${p.a} × ${p.b}) ÷ ${p.a * p.b / p.lcm} = ${p.lcm}`
      };
    }
  },

  // ── 소인수분해 주관식 ─────────────────────────────

  {
    id: 'gcd_short',
    unit: '1-1',
    chapter: '소인수분해',
    title: '최대공약수 (주관식)',
    generate() {
      const pairs = [
        { a: 12, b: 18, gcd: 6 }, { a: 8, b: 12, gcd: 4 }, { a: 15, b: 25, gcd: 5 },
        { a: 16, b: 24, gcd: 8 }, { a: 20, b: 30, gcd: 10 }, { a: 14, b: 21, gcd: 7 },
      ];
      const p = pick(pairs);
      return {
        question: `${p.a}와 ${p.b}의 최대공약수를 구하시오.`,
        type: 'short',
        answer: String(p.gcd),
        explanation: `나눗셈법으로 구하면:\n${p.a}와 ${p.b}의 공약수를 차례로 나누면\n→ 최대공약수 = ${p.gcd}`
      };
    }
  },

  {
    id: 'lcm_short',
    unit: '1-1',
    chapter: '소인수분해',
    title: '최소공배수 (주관식)',
    generate() {
      const pairs = [
        { a: 4, b: 6, lcm: 12 }, { a: 3, b: 5, lcm: 15 }, { a: 6, b: 9, lcm: 18 },
        { a: 4, b: 10, lcm: 20 }, { a: 6, b: 8, lcm: 24 }, { a: 5, b: 6, lcm: 30 },
      ];
      const p = pick(pairs);
      return {
        question: `${p.a}와 ${p.b}의 최소공배수를 구하시오.`,
        type: 'short',
        answer: String(p.lcm),
        explanation: `최소공배수 = (${p.a} × ${p.b}) ÷ 최대공약수\n= ${p.a * p.b} ÷ ${p.a * p.b / p.lcm} = ${p.lcm}`
      };
    }
  },

  // ── 단원 2: 정수와 유리수 ─────────────────────────

  {
    id: 'absolute_value',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '절댓값',
    generate() {
      const n = rInt(-15, 15);
      const abs = Math.abs(n);
      const { choices, answerIdx } = makeChoices(abs, () => rInt(1, 20));
      return {
        question: `|${n}|의 값은?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `절댓값은 수직선에서 원점까지의 거리입니다.\n|${n}| = ${abs}`
      };
    }
  },

  {
    id: 'integer_add',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '정수의 덧셈',
    generate() {
      const a = rInt(-12, 12);
      const b = rInt(-12, 12);
      const ans = a + b;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-2,-1,1,2,3,-3]));
      return {
        question: `(${a}) + (${b}) = ?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: a >= 0 && b >= 0
          ? `두 양수의 합: ${a} + ${b} = ${ans}`
          : a < 0 && b < 0
            ? `두 음수의 합: 절댓값의 합에 음수 부호\n${Math.abs(a)} + ${Math.abs(b)} = ${Math.abs(ans)} → ${ans}`
            : `부호가 다른 경우: 절댓값이 큰 수의 부호를 따름\n|${a}| = ${Math.abs(a)}, |${b}| = ${Math.abs(b)}\n→ ${ans}`
      };
    }
  },

  {
    id: 'integer_sub',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '정수의 뺄셈',
    generate() {
      const a = rInt(-10, 10);
      const b = rInt(-10, 10);
      const ans = a - b;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-2,-1,1,2,3,-3]));
      return {
        question: `(${a}) - (${b}) = ?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `뺄셈은 빼는 수의 부호를 바꿔 덧셈으로:\n(${a}) - (${b}) = (${a}) + (${-b}) = ${ans}`
      };
    }
  },

  {
    id: 'integer_mul',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '정수의 곱셈',
    generate() {
      const a = rInt(-9, 9);
      const b = rInt(-9, 9);
      const ans = a * b;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-3,-2,-1,1,2,3]));
      const sign = (a >= 0 && b >= 0) || (a < 0 && b < 0) ? '양수 (+)' : '음수 (-)';
      return {
        question: `(${a}) × (${b}) = ?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `부호 규칙: 같은 부호끼리 → 양수, 다른 부호끼리 → 음수\n(${a}) × (${b}): 결과는 ${sign}\n절댓값: ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(ans)}\n→ 답: ${ans}`
      };
    }
  },

  {
    id: 'integer_div',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '정수의 나눗셈',
    generate() {
      const b = pick([-6,-5,-4,-3,-2,2,3,4,5,6]);
      const ans = rInt(-5, 5);
      const a = b * ans;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-2,-1,1,2]));
      return {
        question: `(${a}) ÷ (${b}) = ?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `나눗셈도 곱셈과 같은 부호 규칙:\n(${a}) ÷ (${b}) = ${ans}`
      };
    }
  },

  {
    id: 'compare_integers',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '수의 크기 비교',
    generate() {
      const nums = [-5,-3,-1,0,1,2,4,7,-8,-2,3,6];
      const a = pick(nums);
      let b = pick(nums);
      while (b === a) b = pick(nums);
      const correct = a > b ? `${a} > ${b}` : a < b ? `${a} < ${b}` : `${a} = ${b}`;
      const choices = [`${a} > ${b}`, `${a} < ${b}`, `${a} = ${b}`, `알 수 없다`];
      const answerIdx = choices.indexOf(correct);
      return {
        question: `${a}와 ${b}의 대소 관계로 옳은 것은?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `수직선에서 오른쪽이 더 큰 수입니다.\n${a}와 ${b} 중 ${a > b ? a : b}이 더 오른쪽에 있으므로\n→ ${correct}`
      };
    }
  },

  // ── 정수와 유리수 주관식 ─────────────────────────

  {
    id: 'abs_short',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '절댓값 (주관식)',
    generate() {
      const n = rInt(-15, 15);
      return {
        question: `|${n}| 의 값을 구하시오.`,
        type: 'short',
        answer: String(Math.abs(n)),
        explanation: `절댓값은 수직선에서 원점까지의 거리입니다.\n|${n}| = ${Math.abs(n)}`
      };
    }
  },

  {
    id: 'int_add_short',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '정수의 덧셈 (주관식)',
    generate() {
      const a = rInt(-12, 12);
      const b = rInt(-12, 12);
      return {
        question: `(${a}) + (${b}) 를 계산하시오.`,
        type: 'short',
        answer: String(a + b),
        explanation: `(${a}) + (${b}) = ${a + b}`
      };
    }
  },

  {
    id: 'int_sub_short',
    unit: '1-1',
    chapter: '정수와 유리수',
    title: '정수의 뺄셈 (주관식)',
    generate() {
      const a = rInt(-10, 10);
      const b = rInt(-10, 10);
      return {
        question: `(${a}) - (${b}) 를 계산하시오.`,
        type: 'short',
        answer: String(a - b),
        explanation: `빼는 수의 부호를 바꿔 덧셈으로:\n(${a}) - (${b}) = (${a}) + (${-b}) = ${a - b}`
      };
    }
  },

  // ── 단원 3: 문자와 식 ─────────────────────────────

  {
    id: 'eval_expression',
    unit: '1-1',
    chapter: '문자와 식',
    title: '식의 값 구하기',
    generate() {
      const a = rInt(2, 5);
      const b = rInt(1, 4);
      const x = rInt(1, 6);
      const ans = a * x + b;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-3,-2,-1,1,2,3]));
      return {
        question: `x = ${x}일 때, ${a}x + ${b}의 값은?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `x에 ${x}을 대입하면:\n${a} × ${x} + ${b} = ${a * x} + ${b} = ${ans}`
      };
    }
  },

  {
    id: 'simplify_linear',
    unit: '1-1',
    chapter: '문자와 식',
    title: '일차식의 덧셈과 뺄셈',
    generate() {
      const a1 = rInt(2, 7), b1 = rInt(1, 8);
      const a2 = rInt(1, 5), b2 = rInt(1, 6);
      const isAdd = Math.random() > 0.5;
      const ra = isAdd ? a1 + a2 : a1 - a2;
      const rb = isAdd ? b1 + b2 : b1 - b2;
      const expr = isAdd
        ? `(${a1}x + ${b1}) + (${a2}x + ${b2})`
        : `(${a1}x + ${b1}) - (${a2}x + ${b2})`;
      const sign = rb >= 0 ? `+ ${rb}` : `- ${Math.abs(rb)}`;
      const correctStr = `${ra}x ${sign}`;
      const wrongs = [`${ra + 1}x ${sign}`, `${ra}x + ${rb + 1}`, `${ra - 1}x + ${rb}`, `${a1}x + ${b2}`];
      const choices = shuffle([correctStr, ...wrongs.slice(0, 3)]);
      const answerIdx = choices.indexOf(correctStr);
      return {
        question: `${expr}을 간단히 하면?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `동류항끼리 모아서 계산:\nx항: ${a1}x ${isAdd ? '+' : '-'} ${a2}x = ${ra}x\n상수항: ${b1} ${isAdd ? '+' : '-'} ${b2} = ${rb}\n→ ${correctStr}`
      };
    }
  },

  {
    id: 'linear_mul',
    unit: '1-1',
    chapter: '문자와 식',
    title: '일차식과 수의 곱셈',
    generate() {
      const k = rInt(2, 6);
      const a = rInt(2, 8);
      const b = rInt(1, 7);
      const ra = k * a, rb = k * b;
      const correctStr = `${ra}x + ${rb}`;
      const choices = shuffle([correctStr, `${ra}x + ${b}`, `${a}x + ${rb}`, `${ra + 1}x + ${rb}`]);
      const answerIdx = choices.indexOf(correctStr);
      return {
        question: `${k}(${a}x + ${b})를 전개하면?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `분배법칙 적용:\n${k} × ${a}x + ${k} × ${b}\n= ${ra}x + ${rb}`
      };
    }
  },

  // ── 문자와 식 주관식 ──────────────────────────────

  {
    id: 'eval_short',
    unit: '1-1',
    chapter: '문자와 식',
    title: '식의 값 구하기 (주관식)',
    generate() {
      const a = rInt(2, 5);
      const b = rInt(1, 8);
      const x = rInt(1, 6);
      return {
        question: `x = ${x} 일 때,  ${a}x + ${b} 의 값을 구하시오.`,
        type: 'short',
        answer: String(a * x + b),
        explanation: `x에 ${x}을 대입:\n${a} × ${x} + ${b} = ${a * x} + ${b} = ${a * x + b}`
      };
    }
  },

  // ── 단원 4: 좌표평면과 그래프 ────────────────────

  {
    id: 'quadrant',
    unit: '1-1',
    chapter: '좌표평면과 그래프',
    title: '사분면 판별',
    generate() {
      const quadrants = [
        { sign: [1, 1], name: '제1사분면', desc: 'x > 0, y > 0' },
        { sign: [-1, 1], name: '제2사분면', desc: 'x < 0, y > 0' },
        { sign: [-1, -1], name: '제3사분면', desc: 'x < 0, y < 0' },
        { sign: [1, -1], name: '제4사분면', desc: 'x > 0, y < 0' },
      ];
      const q = pick(quadrants);
      const x = q.sign[0] * rInt(1, 8);
      const y = q.sign[1] * rInt(1, 8);
      const choices = ['제1사분면', '제2사분면', '제3사분면', '제4사분면'];
      const answerIdx = choices.indexOf(q.name);
      return {
        question: `점 (${x}, ${y})는 몇 사분면에 있나요?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `사분면 판별 기준:\n제1: x>0, y>0 / 제2: x<0, y>0\n제3: x<0, y<0 / 제4: x>0, y<0\n(${x}, ${y}) → ${q.desc} → ${q.name}`
      };
    }
  },

  {
    id: 'coordinate_read',
    unit: '1-1',
    chapter: '좌표평면과 그래프',
    title: '좌표 읽기',
    generate() {
      const x = rInt(-6, 6);
      const y = rInt(-6, 6);
      const correct = `(${x}, ${y})`;
      const wrongs = [`(${y}, ${x})`, `(${x + 1}, ${y})`, `(${x}, ${y + 1})`];
      const choices = shuffle([correct, ...wrongs]);
      const answerIdx = choices.indexOf(correct);
      return {
        question: `좌표평면에서 x좌표가 ${x}, y좌표가 ${y}인 점의 좌표는?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `점의 좌표는 (x좌표, y좌표) 순서로 씁니다.\n→ (${x}, ${y})`
      };
    }
  },

  {
    id: 'proportional',
    unit: '1-1',
    chapter: '좌표평면과 그래프',
    title: '정비례 관계',
    generate() {
      const k = pick([-4, -3, -2, 2, 3, 4, 5]);
      const x = rInt(1, 5);
      const y = k * x;
      const { choices, answerIdx } = makeChoices(y, () => y + pick([-k, k, 1, -1, 2]));
      return {
        question: `y = ${k}x 에서 x = ${x}일 때, y의 값은?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `y = ${k}x에 x = ${x}를 대입:\ny = ${k} × ${x} = ${y}`
      };
    }
  },
];

// ===================================================
// 중1 2학기 문제 유형
// ===================================================

const QUESTION_TYPES_1_2 = [

  {
    id: 'linear_eq_simple',
    unit: '1-2',
    chapter: '일차방정식',
    title: '일차방정식 풀기 (기본)',
    generate() {
      const a = rInt(2, 8);
      const ans = rInt(-5, 8);
      const b = a * ans;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-2,-1,1,2,3]));
      return {
        question: `${a}x = ${b}를 만족하는 x의 값은?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `양변을 ${a}로 나누면:\nx = ${b} ÷ ${a} = ${ans}`
      };
    }
  },

  {
    id: 'linear_eq_both',
    unit: '1-2',
    chapter: '일차방정식',
    title: '일차방정식 풀기 (이항)',
    generate() {
      const ans = rInt(-4, 8);
      const a = rInt(2, 6);
      const b = rInt(1, 10);
      // ax + b = c 형태
      const c = a * ans + b;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-2,-1,1,2,3]));
      return {
        question: `${a}x + ${b} = ${c}를 풀면 x = ?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `이항하여 정리:\n${a}x = ${c} - ${b}\n${a}x = ${c - b}\nx = ${c - b} ÷ ${a} = ${ans}`
      };
    }
  },

  {
    id: 'linear_eq_both_sides',
    unit: '1-2',
    chapter: '일차방정식',
    title: '양변에 x가 있는 일차방정식',
    generate() {
      const ans = rInt(1, 6);
      const a = rInt(3, 7), b = rInt(1, 5);
      const c = rInt(1, 4), d = rInt(1, 8);
      // ax + b = cx + d 형태에서 ans를 구함
      // (a-c)*ans = d - b
      const lhsCoeff = a - c;
      const rhs = (a - c) * ans + b - b; // 직접 계산
      const realD = (a - c) * ans + b;
      const { choices, answerIdx } = makeChoices(ans, () => ans + pick([-2,-1,1,2]));
      return {
        question: `${a}x + ${b} = ${c}x + ${realD}를 풀면 x = ?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `x를 왼쪽, 상수를 오른쪽으로 이항:\n${a}x - ${c}x = ${realD} - ${b}\n${a - c}x = ${realD - b}\nx = ${ans}`
      };
    }
  },

  {
    id: 'function_value',
    unit: '1-2',
    chapter: '함수',
    title: '함수의 함숫값',
    generate() {
      const a = rInt(2, 5);
      const b = rInt(1, 6);
      const x = rInt(1, 5);
      const y = a * x - b;
      const { choices, answerIdx } = makeChoices(y, () => y + pick([-2,-1,1,2,3]));
      return {
        question: `f(x) = ${a}x - ${b}일 때, f(${x})의 값은?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `x에 ${x}을 대입:\nf(${x}) = ${a} × ${x} - ${b} = ${a * x} - ${b} = ${y}`
      };
    }
  },

  {
    id: 'mean',
    unit: '1-2',
    chapter: '통계',
    title: '평균 구하기',
    generate() {
      const n = rInt(3, 5);
      const vals = Array.from({length: n}, () => rInt(10, 90));
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / n * 10) / 10;
      const { choices, answerIdx } = makeChoices(avg, () => Math.round((avg + pick([-2,-1,1,2,3])) * 10) / 10);
      return {
        question: `다음 자료의 평균을 구하시오.\n${vals.join(', ')}`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `평균 = 자료의 합 ÷ 자료의 수\n= (${vals.join(' + ')}) ÷ ${n}\n= ${sum} ÷ ${n} = ${avg}`
      };
    }
  },
];

// ===================================================
// 중2 1학기 문제 유형
// ===================================================

const QUESTION_TYPES_2_1 = [

  {
    id: 'rational_decimal',
    unit: '2-1',
    chapter: '유리수와 순환소수',
    title: '분수를 소수로 변환',
    generate() {
      const cases = [
        { frac: '1/3', dec: '0.333...(순환소수)', cycle: true },
        { frac: '1/4', dec: '0.25', cycle: false },
        { frac: '2/3', dec: '0.666...(순환소수)', cycle: true },
        { frac: '1/6', dec: '0.1666...(순환소수)', cycle: true },
        { frac: '3/4', dec: '0.75', cycle: false },
        { frac: '1/8', dec: '0.125', cycle: false },
        { frac: '5/6', dec: '0.8333...(순환소수)', cycle: true },
      ];
      const c = pick(cases);
      const correct = c.cycle ? '순환소수' : '유한소수';
      const choices = ['유한소수', '순환소수', '정수', '자연수'];
      const answerIdx = choices.indexOf(correct);
      return {
        question: `분수 ${c.frac}를 소수로 나타내면 어떤 종류인가요?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `${c.frac} = ${c.dec}\n${c.cycle ? '소수점 이하의 숫자가 반복되므로 순환소수입니다.' : '소수점 이하 자리가 끝나므로 유한소수입니다.'}`
      };
    }
  },

  {
    id: 'poly_add',
    unit: '2-1',
    chapter: '단항식과 다항식',
    title: '다항식의 덧셈',
    generate() {
      const a1 = rInt(2, 6), b1 = rInt(1, 8);
      const a2 = rInt(1, 5), b2 = rInt(1, 6);
      const ra = a1 + a2, rb = b1 + b2;
      const correct = `${ra}x + ${rb}`;
      const choices = shuffle([correct, `${ra + 1}x + ${rb}`, `${ra}x + ${rb + 1}`, `${a1}x + ${rb}`]);
      const answerIdx = choices.indexOf(correct);
      return {
        question: `(${a1}x + ${b1}) + (${a2}x + ${b2})를 간단히 하면?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `동류항끼리 계산:\nx항: ${a1}x + ${a2}x = ${ra}x\n상수항: ${b1} + ${b2} = ${rb}\n→ ${correct}`
      };
    }
  },

  {
    id: 'inequality_simple',
    unit: '2-1',
    chapter: '일차부등식',
    title: '일차부등식 풀기',
    generate() {
      const a = rInt(2, 6);
      const b = rInt(1, 12);
      // ax > b → x > b/a
      const isGt = Math.random() > 0.5;
      const symbol = isGt ? '>' : '<';
      const rSymbol = isGt ? '>' : '<';
      // x 범위: x > b/a 또는 x < b/a
      const frac = b / a;
      const correct = `x ${rSymbol} ${frac % 1 === 0 ? frac : b + '/' + a}`;
      const choices = [
        `x ${rSymbol} ${frac % 1 === 0 ? frac : b + '/' + a}`,
        `x ${isGt ? '<' : '>'} ${frac % 1 === 0 ? frac : b + '/' + a}`,
        `x = ${frac % 1 === 0 ? frac : b + '/' + a}`,
        `x ${rSymbol} ${frac % 1 === 0 ? frac + 1 : (b + 1) + '/' + a}`
      ];
      const answerIdx = 0;
      return {
        question: `${a}x ${symbol} ${b}의 해를 구하면?`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `양변을 ${a}(양수)로 나누면 부등호 방향 유지:\n${a}x ${symbol} ${b}\nx ${symbol} ${b}/${a}${frac % 1 === 0 ? ' = ' + frac : ''}`
      };
    }
  },

  {
    id: 'simultaneous_eq',
    unit: '2-1',
    chapter: '연립일차방정식',
    title: '연립방정식 풀기',
    generate() {
      const x = rInt(1, 5), y = rInt(1, 5);
      const a1 = rInt(1, 3), b1 = rInt(1, 3);
      const a2 = rInt(1, 3), b2 = rInt(1, 3);
      const c1 = a1 * x + b1 * y;
      const c2 = a2 * x + b2 * y;
      const choices = [`x=${x}, y=${y}`, `x=${y}, y=${x}`, `x=${x+1}, y=${y}`, `x=${x}, y=${y+1}`];
      const answerIdx = 0;
      return {
        question: `연립방정식을 푸시오.\n{ ${a1}x + ${b1}y = ${c1}\n{ ${a2}x + ${b2}y = ${c2}`,
        type: 'multiple',
        choices,
        answerIdx,
        explanation: `대입법 또는 가감법으로 풀면:\nx = ${x}, y = ${y}\n검산: ${a1}×${x} + ${b1}×${y} = ${c1} ✓`
      };
    }
  },
];

// ===================================================
// 단원 메타데이터 (레벨 구조)
// ===================================================

const UNITS = [
  {
    id: '1-1',
    name: '중1 · 1학기',
    level: 1,
    types: QUESTION_TYPES_1_1,
    chapters: ['소인수분해', '정수와 유리수', '문자와 식', '좌표평면과 그래프'],
    coupon: { emoji: '🍕', text: '아빠한테 피자 사달라고 하기!' }
  },
  {
    id: '1-2',
    name: '중1 · 2학기',
    level: 2,
    types: QUESTION_TYPES_1_2,
    chapters: ['일차방정식', '함수', '통계'],
    coupon: { emoji: '🎮', text: '오늘 게임 1시간 더 하기!' }
  },
  {
    id: '2-1',
    name: '중2 · 1학기',
    level: 3,
    types: QUESTION_TYPES_2_1,
    chapters: ['유리수와 순환소수', '단항식과 다항식', '일차부등식', '연립일차방정식'],
    coupon: { emoji: '🍣', text: '아빠한테 초밥 사달라고 하기!' }
  },
];

// 헬퍼: 소인수 추출
function getPrimeFactor(n) {
  const factors = [];
  let d = 2;
  while (d * d <= n) {
    if (n % d === 0) { factors.push(d); n = Math.floor(n / d); }
    else d++;
  }
  if (n > 1) factors.push(n);
  return factors;
}
