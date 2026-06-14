import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthError, PostgrestError, Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

type AuthResult = { error: AuthError | PostgrestError | null };

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.debug('VITE_SUPABASE_URL=', import.meta.env.VITE_SUPABASE_URL);
      console.debug('VITE_SUPABASE_ANON_KEY length=', import.meta.env.VITE_SUPABASE_ANON_KEY?.length ?? 0);
      try {
        console.debug('Auth init: calling supabase.auth.getSession');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.debug('Auth init: getSession returned', { session, error });

        if (error) {
          console.error('Supabase getSession error:', error);
        }

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        console.debug('Auth init: set user/session', { user: session?.user?.id });

        if (session?.user) {
          console.debug('Auth init: user present, fetching profile', session.user.id);
          // guard against hanging fetchProfile by using a timeout
          const fetchWithTimeout = async (uid: string, ms = 5000) => {
            let finished = false;
            const timeout = setTimeout(() => {
              if (!finished) {
                console.error('fetchProfile timed out');
                setLoading(false);
              }
            }, ms);
            try {
              await fetchProfile(uid);
            } finally {
              finished = true;
              clearTimeout(timeout);
            }
          };
          await fetchWithTimeout(session.user.id, 5000);
        } else {
          console.debug('Auth init: no user, clearing loading');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init failure:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      console.debug('onAuthStateChange event', { event: _event, session });
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.debug('onAuthStateChange: fetching profile for', session.user.id);
        try {
          const fetchWithTimeout = async (uid: string, ms = 5000) => {
            let finished = false;
            const timeout = setTimeout(() => {
              if (!finished) {
                console.error('fetchProfile timed out');
                setLoading(false);
              }
            }, ms);
            try {
              await fetchProfile(uid);
            } finally {
              finished = true;
              clearTimeout(timeout);
            }
          };
          await fetchWithTimeout(session.user.id, 5000);
        } catch (error) {
          console.error('Auth state change fetchProfile error:', error);
          setLoading(false);
        }
      } else {
        console.debug('onAuthStateChange: no session, clearing profile/loading');
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {    console.debug('fetchProfile: start for', userId);
    try {
     console.log('START fetchProfile', userId);

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

console.log('PROFILE DATA:', data);
console.log('PROFILE ERROR:', error);

setProfile(data?.[0] ?? null);

      console.debug('fetchProfile: result', { data, error });

      if (!error && data) {
        setProfile(data as Profile);
      } else if (error?.message.includes('Could not find the table')) {
        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user;
        setProfile({
          id: userId,
          full_name: user?.user_metadata?.full_name ?? '',
          email: user?.email ?? '',
          skills: [],
          interested_fields: [],
          bio: '',
          created_at: '',
          updated_at: '',
        });
      } else if (error) {
        console.error('fetchProfile: error', error);
      }
    } catch (err) {
      console.error('fetchProfile: thrown', err);
    } finally {
      setLoading(false);
      console.debug('fetchProfile: finished, loading=false');
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error };
    }

    const userId = data?.user?.id;
    if (userId) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
        skills: [],
        interested_fields: [],
      });

      if (profileError && !profileError.message.includes('Could not find the table')) {
        return { error: profileError };
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const profileData = {
      id: user.id,
      email: user.email ?? '',
      ...updates,
    };

    const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : ({
        id: user.id,
        email: user.email ?? '',
        full_name: updates.full_name ?? '',
        skills: updates.skills ?? [],
        interested_fields: updates.interested_fields ?? [],
        bio: updates.bio ?? '',
        created_at: prev?.created_at ?? '',
        updated_at: prev?.updated_at ?? '',
      } as Profile));
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
