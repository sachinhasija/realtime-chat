import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from 'firebase/storage';

const {
  REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_AUTH_DOMAIN, REACT_APP_FIREBASE_PROJECT_ID, REACT_APP_FIREBASE_STORAGE_BUCKET, REACT_APP_FIREBASE_MESSAGING_SENDERID, REACT_APP_FIREBASE_APPID, REACT_APP_FIREBASE_MEASUREMENTID, REACT_APP_FIREBASE_MESSAGING_KEY,
} = process.env;

const firebaseApp = initializeApp({
  apiKey: REACT_APP_FIREBASE_API_KEY,
  authDomain: REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: REACT_APP_FIREBASE_MESSAGING_SENDERID,
  appId: REACT_APP_FIREBASE_APPID,
  measurementId: REACT_APP_FIREBASE_MEASUREMENTID,
});

const messaging = getMessaging(firebaseApp);

const fetchToken = (setTokenFound) => getToken(messaging, { vapidKey: REACT_APP_FIREBASE_MESSAGING_KEY }).then((currentToken) => {
  if (currentToken) {
    setTokenFound(currentToken);
    // Track the token -> client mapping, by sending to backend server
    // show on the UI that permission is secured
  } else {
    setTokenFound(null);
    // shows on the UI that permission is required
  }
}).catch(() => {
  // catch error while creating client token
  setTokenFound(null);
});

const onMessageListener = () => new Promise((resolve) => {
  onMessage(messaging, (payload) => {
    resolve(payload);
  });
});

const db = getFirestore();

const provider = new GoogleAuthProvider();

export const auth = getAuth();

export const signInWithGoogle = (callback, callbackError = null) => {
    signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
      callback(token, user);
      // ...
    }).catch((error) => {
      // Handle Errors here.
      const errorCode = error.code;
      const errorMessage = error.message;
      // The email of the user's account used.
      const email = error.customData.email;
      // The AuthCredential type that was used.
      const credential = GoogleAuthProvider.credentialFromError(error);
      // ...
      if (callbackError) {
        callbackError({errorCode, errorMessage, email, credential});
      }
    });
}

const storage = getStorage(firebaseApp);

export {
  db, fetchToken, firebaseApp, onMessageListener, storage,
};
