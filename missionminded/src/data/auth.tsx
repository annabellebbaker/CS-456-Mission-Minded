import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { getFirebaseAuth, getFirebaseFirestore } from '@/data/firebase';

export type User = { id: string; name: string; email: string; ward: string };

/** Dev-only signed-in user that runs on sample data, no Firebase needed. */
export const PREVIEW_USER_ID = 'preview';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setupError: string;
  signIn: (email: string, password: string) => Promise<void>;
  createAccount: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Dev only: skip login and browse the app with sample missionaries. */
  previewWithSampleData: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          const profileRef = doc(getFirebaseFirestore(), 'users', firebaseUser.uid);
          const profile = await getDoc(profileRef);
          const profileName = profile.data()?.name;
          const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Supporter';
          const profileWard = profile.data()?.ward;

          if (!profile.exists()) {
            await setDoc(profileRef, {
              name: fallbackName,
              ward: '',
              stake: '',
              settings: { appointmentReminders: false, phaseReminders: false },
            });
          }

          setUser({
            id: firebaseUser.uid,
            name: typeof profileName === 'string' && profileName.trim() ? profileName : fallbackName,
            email: firebaseUser.email ?? '',
            ward: typeof profileWard === 'string' ? profileWard : '',
          });
        } catch {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Supporter',
            email: firebaseUser.email ?? '',
            ward: '',
          });
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Firebase could not be initialized.';
      queueMicrotask(() => {
        setSetupError(message);
        setLoading(false);
      });
    }

    return () => unsubscribe?.();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
  };

  const createAccount = async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    const cleanName = name.trim();
    await updateProfile(credential.user, { displayName: cleanName });
    await setDoc(doc(getFirebaseFirestore(), 'users', credential.user.uid), {
      name: cleanName,
      ward: '',
      stake: '',
      settings: { appointmentReminders: false, phaseReminders: false },
    });
  };

  const signOut = async () => {
    if (user?.id === PREVIEW_USER_ID) {
      setUser(null);
      return;
    }
    await firebaseSignOut(getFirebaseAuth());
  };

  const previewWithSampleData = () => {
    if (!__DEV__) return;
    setUser({ id: PREVIEW_USER_ID, name: 'Preview', email: '', ward: 'Sample ward' });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, setupError, signIn, createAccount, signOut, previewWithSampleData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
