import { initializeApp, FirebaseApp } from 'firebase/app';
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

export const CONFIGURED = true;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

app = initializeApp(firebaseConfig);
db = getFirestore(app);
auth = getAuth(app);

export { db, auth };
