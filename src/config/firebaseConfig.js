import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyA_hd_OmexwhliLTHlZY5KYdgDhqxT1vVQ",
    authDomain: "devgo2003-telego.firebaseapp.com",
    projectId: "devgo2003-telego",
    storageBucket: "devgo2003-telego.firebasestorage.app",
    messagingSenderId: "354641411477",
    appId: "1:354641411477:web:25492f787144c82b8aca9c",
    measurementId: "G-F1RPKWLTWL"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export default app;