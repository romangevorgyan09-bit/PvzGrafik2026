import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAK5OQ_nQZpB7fvYNTA9RGpv0aIMPYqJMQ",
  authDomain: "central-fountain-d8gvj.firebaseapp.com",
  projectId: "central-fountain-d8gvj",
  storageBucket: "central-fountain-d8gvj.firebasestorage.app",
  messagingSenderId: "915822822674",
  appId: "1:915822822674:web:0a6df6207775227e1a5fcb"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize Firestore with custom database ID from configuration
const db = initializeFirestore(app, {}, "ai-studio-fbf5f841-0c67-45bc-82f4-f885aeed1bb3");

export { auth, db };
