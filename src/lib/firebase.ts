// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-ol2jUWWedYHiUB-VYjndZvGu1o0ZLiI",
  authDomain: "dressup-ai-3p45e.firebaseapp.com",
  projectId: "dressup-ai-3p45e",
  storageBucket: "dressup-ai-3p45e.appspot.com",
  messagingSenderId: "1020285273907",
  appId: "1:1020285273907:web:8f8c0f21b24c5ff06da046"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
