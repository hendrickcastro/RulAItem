// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFaxByE9lEjnmUQ2jX0Ga6oBD5IlO0a04",
  authDomain: "agtxia-rulaitem.firebaseapp.com",
  projectId: "agtxia-rulaitem",
  storageBucket: "agtxia-rulaitem.firebasestorage.app",
  messagingSenderId: "339756947572",
  appId: "1:339756947572:web:76c24d4feb86cfce441921",
  measurementId: "G-TWYDEN15RC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);