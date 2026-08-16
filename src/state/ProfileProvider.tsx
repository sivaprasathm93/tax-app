import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ProfileContext, ProfileContextValue } from "./profileContext";
import { emptyProfile } from "../constants/defaults";
import {
  createId,
  loadActiveId,
  loadProfiles,
  saveActiveId,
  saveProfiles,
  storageAvailable,
} from "../utils/profileStorage";
import { Profile } from "../types";

const DEFAULT_NAME = "Self";

/** A JSON round-trip - the profile is plain data, and structuredClone is not everywhere. */
function clone(profile: Profile): Profile {
  return JSON.parse(JSON.stringify(profile)) as Profile;
}

function initialState(): { profiles: Profile[]; activeId: string } {
  const stored = loadProfiles();
  const profiles =
    stored.length > 0 ? stored : [emptyProfile(createId(), DEFAULT_NAME)];
  const remembered = loadActiveId();
  const activeId =
    remembered && profiles.some((item) => item.id === remembered)
      ? remembered
      : profiles[0].id;
  return { profiles, activeId };
}

/**
 * Holds the working profile and mirrors it to localStorage.
 *
 * Everything stays on the device: there is no sync, no account and no request
 * off the origin, which is the whole reason someone will type a real salary
 * into this. Writes are debounced because the form recalculates on every
 * keystroke and localStorage is synchronous - serialising on each one would
 * put a JSON.stringify of the entire profile set in the typing path.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [persistent] = useState(storageAvailable);
  const [state, setState] = useState(initialState);
  const { profiles, activeId } = state;

  const writeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!persistent) return;
    window.clearTimeout(writeTimer.current);
    writeTimer.current = window.setTimeout(() => saveProfiles(profiles), 400);
    return () => window.clearTimeout(writeTimer.current);
  }, [profiles, persistent]);

  useEffect(() => {
    if (persistent) saveActiveId(activeId);
  }, [activeId, persistent]);

  const profile = useMemo(
    () => profiles.find((item) => item.id === activeId) ?? profiles[0],
    [profiles, activeId]
  );

  const update = useCallback((patch: Partial<Omit<Profile, "id">>) => {
    setState((current) => ({
      ...current,
      profiles: current.profiles.map((item) =>
        item.id === current.activeId
          ? { ...item, ...patch, updatedAt: Date.now() }
          : item
      ),
    }));
  }, []);

  const switchTo = useCallback((id: string) => {
    setState((current) =>
      current.profiles.some((item) => item.id === id)
        ? { ...current, activeId: id }
        : current
    );
  }, []);

  const create = useCallback((name: string) => {
    setState((current) => {
      const next = emptyProfile(createId(), name.trim() || "Untitled");
      return { profiles: [...current.profiles, next], activeId: next.id };
    });
  }, []);

  const duplicate = useCallback((name: string) => {
    setState((current) => {
      const source = current.profiles.find(
        (item) => item.id === current.activeId
      );
      if (!source) return current;
      const copy: Profile = {
        ...clone(source),
        id: createId(),
        name: name.trim() || `${source.name} copy`,
        updatedAt: Date.now(),
      };
      return { profiles: [...current.profiles, copy], activeId: copy.id };
    });
  }, []);

  const rename = useCallback(
    (name: string) => update({ name: name.trim() || "Untitled" }),
    [update]
  );

  const remove = useCallback((id: string) => {
    setState((current) => {
      // Never leave the app with nothing selected; deleting the last profile
      // resets it to a blank one instead.
      if (current.profiles.length <= 1) {
        const fresh = emptyProfile(createId(), DEFAULT_NAME);
        return { profiles: [fresh], activeId: fresh.id };
      }
      const remaining = current.profiles.filter((item) => item.id !== id);
      return {
        profiles: remaining,
        activeId:
          current.activeId === id ? remaining[0].id : current.activeId,
      };
    });
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      profiles,
      activeId,
      persistent,
      update,
      switchTo,
      create,
      duplicate,
      rename,
      remove,
    }),
    [
      profile,
      profiles,
      activeId,
      persistent,
      update,
      switchTo,
      create,
      duplicate,
      rename,
      remove,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
