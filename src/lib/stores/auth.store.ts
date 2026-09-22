import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  state: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

/**
 * Authentication store with session persistence.
 * 
 * SECURITY NOTES:
 * - Token is stored in sessionStorage (not localStorage) to reduce attack window
 * - sessionStorage is cleared when the browser tab/window is closed
 * - While sessionStorage is still accessible to XSS attacks, we mitigate this with:
 *   1. Content-Security-Policy headers in nginx (blocks inline scripts)
 *   2. Hashed tokens in database (stolen DB access doesn't yield usable tokens)
 *   3. Rate limiting on auth endpoints (limits brute force attempts)
 * 
 * IDEAL SOLUTION:
 * - HTTP-only cookies would be more secure (not accessible to JavaScript)
 * - However, this would require significant architectural changes to tRPC
 * - For a legal platform, consider migrating to HTTP-only cookies in the future
 * 
 * MITIGATION STRATEGY:
 * - Keep sessions short (7 days, configurable in session.ts)
 * - Implement session revocation (already done)
 * - Monitor for suspicious activity
 * - Regular security audits
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().token,
    }),
    {
      name: "kairav-auth",
      // Use sessionStorage instead of localStorage for better security
      // sessionStorage is cleared when the browser tab/window closes
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
