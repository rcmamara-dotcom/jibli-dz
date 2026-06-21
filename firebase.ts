// ════════════════════════════════════════════════════════════════════════
//  CONFIG FIREBASE — ta config est déjà intégrée.
//  (La clé apiKey d'une app Web Firebase est publique par conception.)
// ════════════════════════════════════════════════════════════════════════
import { initializeApp, FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDZP0PmPpIKA9efDEg8t0qYMzGMZDixuGc',
  authDomain: 'jibli-dz-aa340.firebaseapp.com',
  databaseURL: 'https://jibli-dz-aa340-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'jibli-dz-aa340',
  storageBucket: 'jibli-dz-aa340.firebasestorage.app',
  messagingSenderId: '159323983716',
  appId: '1:159323983716:web:a2c409ae2d704ae7c03471',
};

// ─── APP CHECK (anti-robots, reCAPTCHA v3 invisible) ───────────────────────
// Colle ta CLÉ DE SITE reCAPTCHA v3 (commence par "6L..."). Laisse "VOTRE_..."
// pour désactiver. APPCHECK_DEBUG=true pour tester en local (voir README).
const RECAPTCHA_SITE_KEY = 'VOTRE_CLE_RECAPTCHA_V3';
const APPCHECK_DEBUG = false;

export const CONFIGURED = !firebaseConfig.apiKey.startsWith('VOTRE_');

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (CONFIGURED) {
  app = initializeApp(firebaseConfig);

  if (!RECAPTCHA_SITE_KEY.startsWith('VOTRE_')) {
    try {
      if (APPCHECK_DEBUG) {
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e) {
      console.error('App Check non initialisé :', e);
    }
  }

  db = getFirestore(app);
  auth = getAuth(app);
}

export { db, auth };
