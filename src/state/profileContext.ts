import { createContext, useContext } from "react";
import { Profile } from "../types";

export interface ProfileContextValue {
  profile: Profile;
  profiles: Profile[];
  activeId: string;
  /** Whether anything written will survive a reload. */
  persistent: boolean;
  update: (patch: Partial<Omit<Profile, "id">>) => void;
  switchTo: (id: string) => void;
  create: (name: string) => void;
  /** Copies the active profile - the quick way to build "Offer B" from "Offer A". */
  duplicate: (name: string) => void;
  rename: (name: string) => void;
  remove: (id: string) => void;
}

/**
 * Split from ProfileProvider so the provider module exports a component and
 * nothing else, which is what React Fast Refresh needs to hot-reload it
 * without dropping every profile in state.
 */
export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used inside a ProfileProvider");
  }
  return context;
}
