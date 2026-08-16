import {
  DEFAULT_RENT,
  DEFAULT_TAKE_HOME,
  EMPTY_TAX_FORM,
  emptyProfile,
} from "../constants/defaults";
import { Profile } from "../types";

const STORAGE_KEY = "tax-app.profiles.v1";
const ACTIVE_KEY = "tax-app.activeProfile.v1";

interface StoredShape {
  version: 1;
  profiles: Profile[];
}

/**
 * Every read goes through this. Anything stored by an older build - or edited
 * by hand, or truncated by a browser clearing quota - is filled in from the
 * defaults rather than allowed to reach the calculators as undefined, where it
 * would surface as NaN halfway down a breakdown.
 */
function reconcile(candidate: Partial<Profile>, index: number): Profile {
  const base = emptyProfile(
    typeof candidate.id === "string" ? candidate.id : createId(),
    typeof candidate.name === "string" && candidate.name.trim() !== ""
      ? candidate.name
      : `Profile ${index + 1}`
  );

  return {
    ...base,
    updatedAt:
      typeof candidate.updatedAt === "number" ? candidate.updatedAt : Date.now(),
    tax: { ...EMPTY_TAX_FORM, ...(candidate.tax ?? {}) },
    ageGroup: candidate.ageGroup ?? base.ageGroup,
    cityType: candidate.cityType ?? base.cityType,
    takeHome: { ...DEFAULT_TAKE_HOME, ...(candidate.takeHome ?? {}) },
    rent: { ...DEFAULT_RENT, ...(candidate.rent ?? {}) },
    offers: Array.isArray(candidate.offers) ? candidate.offers : [],
  };
}

export function createId(): string {
  // crypto.randomUUID is unavailable on http origins in some browsers, and a
  // profile id only has to be unique within one localStorage key.
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Storage can throw in private browsing; the app has to keep working when it does. */
function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function loadProfiles(): Profile[] {
  const raw = safeRead(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredShape;
    if (!parsed || !Array.isArray(parsed.profiles)) return [];
    return parsed.profiles.map(reconcile);
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]): boolean {
  return safeWrite(
    STORAGE_KEY,
    JSON.stringify({ version: 1, profiles } satisfies StoredShape)
  );
}

export function loadActiveId(): string | null {
  return safeRead(ACTIVE_KEY);
}

export function saveActiveId(id: string): void {
  safeWrite(ACTIVE_KEY, id);
}

/** True when the browser will actually keep anything we write. */
export function storageAvailable(): boolean {
  const probe = "tax-app.probe";
  if (!safeWrite(probe, "1")) return false;
  try {
    window.localStorage.removeItem(probe);
  } catch {
    /* Nothing to do - the write already succeeded. */
  }
  return true;
}
