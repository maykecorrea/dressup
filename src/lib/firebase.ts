// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApntKP5d_Bw9gnq74-ps9HEq59kPKAgZw",
  authDomain: "virtuoso-m0zfw.firebaseapp.com",
  databaseURL: "https://virtuoso-m0zfw-default-rtdb.firebaseio.com/",
  projectId: "virtuoso-m0zfw",
  storageBucket: "virtuoso-m0zfw.appspot.com",
  messagingSenderId: "734542053930",
  appId: "1:734542053930:web:3e39cc9b246f53dc15b953"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
