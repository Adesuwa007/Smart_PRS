'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  isDemo: boolean;
}

const AuthContext = createContext<{
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
}>({ user: null, loading: true, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check demo login first
    const demoRole = localStorage.getItem('demoRole');
    const demoName = localStorage.getItem('demoName');
    const demoEmail = localStorage.getItem('demoEmail');
    const demoPlan = localStorage.getItem('demoPlan');

    if (demoRole && demoName) {
      setUser({
        id: 'demo-' + demoRole,
        name: demoName,
        email: demoEmail || '',
        role: demoRole as 'student' | 'faculty' | 'admin',
        plan: (demoPlan as 'free' | 'pro' | 'enterprise') || 'pro',
        isDemo: true,
      });
      setLoading(false);
      return;
    }

    // Real Supabase session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            plan: profile.plan || 'free',
            isDemo: false,
          });
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    localStorage.clear();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
