import { createContext, useContext, useState, type ReactNode } from 'react';

import { signIn as checkCredentials, type User } from '@/data/repository';

type AuthContextValue = {
  user: User | null;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Keeps the signed-in user in memory. Refreshing the app signs out. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = (email: string, password: string) => {
    const found = checkCredentials(email, password);
    setUser(found);
    return found !== null;
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
