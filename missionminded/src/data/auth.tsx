import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { getFirebaseAuth, getFirebaseFirestore } from '@/data/firebase';

export type User = { id: string; name: string; email: string };

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setupError: string;
  signIn: (email: string, password: string) => Promise<void>;
  createAccount: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
          const profile = await getDoc(doc(getFirebaseFirestore(), 'users', firebaseUser.uid));
          const profileName = profile.data()?.name;
          const fallbackName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Supporter';
          if (!profile.exists()) {
            await setDoc(doc(getFirebaseFirestore(), 'users', firebaseUser.uid), {
              name: fallbackName,
              ward: '',
              stake: '',
              settings: { appointmentReminders: false, milestoneReminders: false },
            });
          }
          setUser({
            id: firebaseUser.uid,
            name: typeof profileName === 'string' && profileName.trim()
              ? profileName
              : fallbackName,
            email: firebaseUser.email ?? '',
          });
        } catch {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Supporter',
            email: firebaseUser.email ?? '',
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
      settings: { appointmentReminders: false, milestoneReminders: false },
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, setupError, signIn, createAccount, signOut: () => firebaseSignOut(getFirebaseAuth()) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
