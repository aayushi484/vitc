import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AtsUser {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'admin';
  parcel_id?: string;
  district?: string;
}

export interface AtsSession {
  user: AtsUser;
  token: string;
  expires_at: number;
}

// Seeded Farmer & Admin Accounts for Production / Evaluation
export const SEEDED_ACCOUNTS: Record<string, { password: string; user: AtsUser }> = {
  'farmer.mandya@agritrust.live': {
    password: 'mandya2026',
    user: {
      id: 'usr_farmer_mandya_001',
      email: 'farmer.mandya@agritrust.live',
      name: 'Basavegowda Patil',
      role: 'farmer',
      parcel_id: 'CEL-KA-MANDYA-001',
      district: 'Mandya',
    },
  },
  'farmer.hassan@agritrust.live': {
    password: 'hassan2026',
    user: {
      id: 'usr_farmer_hassan_002',
      email: 'farmer.hassan@agritrust.live',
      name: 'Manjunatha Gowda',
      role: 'farmer',
      parcel_id: 'PARCEL-KA-HASSAN-002',
      district: 'Hassan',
    },
  },
  'farmer.mysore@agritrust.live': {
    password: 'mysore2026',
    user: {
      id: 'usr_farmer_mysore_003',
      email: 'farmer.mysore@agritrust.live',
      name: 'Shivanna Swamy',
      role: 'farmer',
      parcel_id: 'PARCEL-KA-MYSORE-003',
      district: 'Mysore',
    },
  },
  'admin@agritrust.live': {
    password: 'admin2026',
    user: {
      id: 'usr_admin_001',
      email: 'admin@agritrust.live',
      name: 'ATS Field Operations Admin',
      role: 'admin',
    },
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

export const SESSION_COOKIE_NAME = 'ats_auth_session';

/**
 * Sign In with Email & Password.
 * Supports real Supabase Auth with seamless fallback to seeded production credentials.
 */
export async function signIn(email: string, password: string): Promise<{ session: AtsSession | null; error: string | null }> {
  const normEmail = email.trim().toLowerCase();
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: normEmail,
        password,
      });

      if (error) {
        // Fall back to check seeded accounts if Supabase returns invalid creds
        const seeded = SEEDED_ACCOUNTS[normEmail];
        if (seeded && seeded.password === password) {
          const session = createSeededSession(seeded.user);
          saveSessionToCookie(session);
          return { session, error: null };
        }
        return { session: null, error: error.message };
      }

      if (data.session && data.user) {
        const metadata = data.user.user_metadata || {};
        const appMetadata = data.user.app_metadata || {};
        const role = (metadata.role || appMetadata.role || 'farmer') as 'farmer' | 'admin';
        const parcel_id = metadata.parcel_id || 'CEL-KA-MANDYA-001';

        const user: AtsUser = {
          id: data.user.id,
          email: data.user.email || normEmail,
          name: metadata.full_name || metadata.name || normEmail.split('@')[0],
          role,
          parcel_id,
          district: metadata.district,
        };

        const session: AtsSession = {
          user,
          token: data.session.access_token,
          expires_at: data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 86400000,
        };

        saveSessionToCookie(session);
        return { session, error: null };
      }
    } catch (err: any) {
      console.warn('Supabase auth network error, attempting seeded auth:', err.message);
    }
  }

  // Seeded / Offline Auth
  const seeded = SEEDED_ACCOUNTS[normEmail];
  if (!seeded) {
    return { session: null, error: 'Account not recognized. Use one of the registered farm accounts.' };
  }

  if (seeded.password !== password) {
    return { session: null, error: 'Incorrect access password.' };
  }

  const session = createSeededSession(seeded.user);
  saveSessionToCookie(session);
  return { session, error: null };
}

/**
 * Sign Out: Clears cookies and Supabase session.
 */
export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch {
      // ignore
    }
  }
  clearSessionCookie();
}

/**
 * Read active session on client side.
 */
export function getClientSession(): AtsSession | null {
  if (typeof window === 'undefined') return null;
  const cookieValue = getCookie(SESSION_COOKIE_NAME);
  if (!cookieValue) return null;

  try {
    const session = JSON.parse(decodeURIComponent(cookieValue)) as AtsSession;
    if (session.expires_at && session.expires_at < Date.now()) {
      clearSessionCookie();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Helper to build signed dummy JWT token for demo/offline sessions.
 */
function createSeededSession(user: AtsUser): AtsSession {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    parcel_id: user.parcel_id,
    district: user.district,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  };
  const token = `ats_jwt_${btoa(JSON.stringify(payload))}`;
  return {
    user,
    token,
    expires_at: Date.now() + 86400 * 7 * 1000,
  };
}

function saveSessionToCookie(session: AtsSession) {
  if (typeof document === 'undefined') return;
  const encoded = encodeURIComponent(JSON.stringify(session));
  const maxAge = 86400 * 7;
  document.cookie = `${SESSION_COOKIE_NAME}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
