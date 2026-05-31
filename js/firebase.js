// ===================================================
// Firebase 설정 및 초기화
// ===================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuWqwy7y8RN0P88gg70iOu3LWgGUMn0Nw",
  authDomain: "math-master-24f3c.firebaseapp.com",
  projectId: "math-master-24f3c",
  storageBucket: "math-master-24f3c.firebasestorage.app",
  messagingSenderId: "942628604205",
  appId: "1:942628604205:web:32563cb7431cf5b1f5aba4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ── 관리자 이메일 (아빠 계정) ─────────────────────
export const ADMIN_EMAIL = "goodlexy11@gmail.com";

// ── 인증 함수 ─────────────────────────────────────

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function isAdmin(user) {
  return user && user.email === ADMIN_EMAIL;
}

// ── Firestore 진도 저장/불러오기 ──────────────────

export async function saveProgress(userId, state) {
  try {
    await setDoc(doc(db, "progress", userId), {
      ...state,
      email: auth.currentUser?.email || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("진도 저장 실패:", e.message);
  }
}

export async function loadProgress(userId) {
  try {
    const snap = await getDoc(doc(db, "progress", userId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn("진도 불러오기 실패:", e.message);
    return null;
  }
}

// ── 관리자: 학생 진도 초기화 ─────────────────────

export async function resetStudentProgress(userId) {
  try {
    await setDoc(doc(db, "progress", userId), {
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
      email: '',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.warn("진도 초기화 실패:", e.message);
    return false;
  }
}

// ── 관리자: 전체 학생 진도 조회 ──────────────────

export async function loadAllProgress() {
  try {
    const snap = await getDocs(collection(db, "progress"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("전체 진도 조회 실패:", e.message);
    return [];
  }
}
