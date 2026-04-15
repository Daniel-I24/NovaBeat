import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCOmsa3iFlvLZushP0EYSDWKFYB8z5qlaU",
    authDomain: "novabeat-aac92.firebaseapp.com",
    projectId: "novabeat-aac92",
    storageBucket: "novabeat-aac92.firebasestorage.app",
    messagingSenderId: "457159685574",
    appId: "1:457159685574:web:9b5044dfe7c45b97122ec7",
};

const app: FirebaseApp = initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
