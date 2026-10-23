/**
 * Mock authentication service.
 *
 * All auth-related network behaviour lives here, in one place, so the real
 * backend team can swap each function body for a `fetch(...)` call without
 * touching any screen code.
 *
 * Demo rules:
 *   • Password length ≥ 4 → login succeeds
 *   • Any shorter password → `AuthError("Email or password is incorrect")`
 *   • `requestPasswordReset` always resolves (demo)
 */

import type { Profile, LivingSituation, StudentType } from "@/data/types";
import { STORAGE_KEYS, storage } from "@/lib/storage";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export interface SignInInput {
  identifier: string;
  password: string;
  remember?: boolean;
}

export interface SignUpInput {
  name: string;
  identifier: string;
  password: string;
  termsAccepted: boolean;
}

export interface SignUpResult {
  ok: true;
  identifier: string;
}

const delay = <T>(value: T, ms = 600): Promise<T> =>
  new Promise((res) => setTimeout(() => res(value), ms));

const deriveNameFromIdentifier = (id: string): string => {
  const left = id.split("@")[0] ?? id;
  // Transform "ama.mensah" → "Ama Mensah"
  return (
    left
      .replace(/[._-]+/g, " ")
      .replace(/\b(\w)/g, (c) => c.toUpperCase())
      .trim() || "Student"
  );
};

export const auth = {
  /**
   * Sign in a returning student. In the mock, we accept any identifier + any
   * password of length ≥ 4. If a profile is already stored locally, we return
   * it; otherwise we synthesise a plausible default so the demo can continue.
   */
  async signIn({ identifier, password }: SignInInput): Promise<Profile> {
    await delay(null, 650);

    if (password.trim().length < 4) {
      throw new AuthError("Email or password is incorrect");
    }

    const existing = storage.get<Profile | null>(STORAGE_KEYS.profile, null);
    if (existing && existing.identifier === identifier) {
      return existing;
    }

    // Synthesise a profile — the real backend will return the real one.
    const profile: Profile = {
      id: `u-${Date.now()}`,
      name: deriveNameFromIdentifier(identifier),
      identifier,
      studentType: "continuing" satisfies StudentType,
      isInternational: false,
      living: "on-campus" satisfies LivingSituation,
      interests: [],
      createdAt: new Date().toISOString(),
    };
    return profile;
  },

  /**
   * Create a new student account. In the mock this just validates the shape
   * of the input and resolves after a short delay. The real backend will
   * create the user and may return a verification state or an auth token.
   */
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    await delay(null, 700);
    if (!input.name.trim()) throw new AuthError("Enter your full name");
    if (!input.identifier.trim()) {
      throw new AuthError("Enter your email or university ID");
    }
    if (input.password.length < 8) {
      throw new AuthError("Use at least 8 characters for your password");
    }
    if (!input.termsAccepted) {
      throw new AuthError("Please accept the terms to continue");
    }
    return { ok: true, identifier: input.identifier.trim() };
  },

  /**
   * Send a password-reset link. In the mock we just resolve after a short
   * delay. The real backend will enqueue an email.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await delay(null, 700);
    if (!email.trim()) {
      throw new AuthError("Enter the email on your account");
    }
    // Pretend we sent the email.
  },
};
