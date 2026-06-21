// ════════════════════════════════════════════════════════════════════════
//  CONFIG FIREBASE — ta config est déjà intégrée.
//  (La clé apiKey d'une app Web Firebase est publique par conception : sans
//   danger dans le code. La vraie protection vient des règles Firestore + App Check.)
// ════════════════════════════════════════════════════════════════════════
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  getFirestore, collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDZP0PmPpIKA9efDEg8t0qYMzGMZDixuGc",
  authDomain: "jibli-dz-aa340.firebaseapp.com",
  databaseURL: "https://jibli-dz-aa340-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jibli-dz-aa340",
  storageBucket: "jibli-dz-aa340.firebasestorage.app",
  messagingSenderId: "159323983716",
  appId: "1:159323983716:web:a2c409ae2d704ae7c03471"
};

// ─── APP CHECK (anti-robots, reCAPTCHA v3 invisible) ───────────────────────
// Colle ta CLÉ DE SITE reCAPTCHA v3 (commence par "6L..."). Laisse "VOTRE_..."
// pour désactiver. Pour tester en local : passe APPCHECK_DEBUG à true (voir guide).
const RECAPTCHA_SITE_KEY = "VOTRE_CLE_RECAPTCHA_V3";
const APPCHECK_DEBUG = false;

export const CONFIGURED = !String(firebaseConfig.apiKey).startsWith("VOTRE_");

let app = null, db = null, auth = null;

if (CONFIGURED) {
  app = initializeApp(firebaseConfig);

  if (!String(RECAPTCHA_SITE_KEY).startsWith("VOTRE_")) {
    try {
      if (APPCHECK_DEBUG) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) { console.error('App Check non initialisé :', e); }
  }

  db = getFirestore(app);
  auth = getAuth(app);
}

export {
  db, auth,
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut,
};
