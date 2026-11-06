import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// The React Native conditional entry exports this API; the default declaration omits it.
// @ts-expect-error Metro resolves the React Native export at runtime.
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const configKeys = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
} as const;

function getConfig() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };
  const missing = Object.entries(config)
    .filter(([key, value]) => key !== 'messagingSenderId' && key !== 'storageBucket' && !value)
    .map(([key]) => configKeys[key as keyof typeof configKeys]);

  if (missing.length) {
    throw new Error(`Firebase is not configured. Add ${missing.join(', ')} to .env.local using the Firebase Web app settings, then restart Expo.`);
  }

  return config;
}

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(getConfig());
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  if (Platform.OS === 'web') return getAuth(app);

  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    if ((error as { code?: string })?.code === 'auth/already-initialized') return getAuth(app);
    throw error;
  }
}

export function getFirebaseFirestore() {
  return getFirestore(getFirebaseApp());
}
