import { supabase } from './supabase';

export type UserRole = 'manager' | 'vendor';

/**
 * Sign in with email + password.
 * Validates that the selected role matches the user's registered role.
 */
export async function login(email: string, password: string, selectedRole: UserRole) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const registeredRole = data.user?.user_metadata?.role as UserRole | undefined;

  // Role mismatch guard
  if (registeredRole && registeredRole !== selectedRole) {
    await supabase.auth.signOut();
    throw new Error(
      `Access Denied: This account is a ${registeredRole.toUpperCase()}. Switch the toggle to ${registeredRole.toUpperCase()}.`
    );
  }

  return data;
}

/**
 * Register a new user with email, password, and role.
 */
export async function signup(email: string, password: string, role: UserRole) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: email.split('@')[0],
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out the current user and clear local storage.
 */
export async function logout() {
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.clear();
  }
}

/**
 * Get the current active Supabase session.
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get the current authenticated user object.
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
