import { create } from 'zustand';
import type { UserProfile } from '../utils/profile';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  lastFetched: number | null;
  cacheDuration: number; // 5 minutes
}

interface ProfileActions {
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  invalidateCache: () => void;
  isCached: () => boolean;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
}

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  cacheDuration: 5 * 60 * 1000, // 5 minutes

  setProfile: (profile) => set({
    profile,
    lastFetched: Date.now(),
    error: null
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  invalidateCache: () => set({
    profile: null,
    lastFetched: null,
    error: null
  }),

  isCached: () => {
    const { profile, lastFetched, cacheDuration } = get();
    if (!profile || !lastFetched) return false;
    return Date.now() - lastFetched < cacheDuration;
  },

  fetchProfile: async (userId) => {
    const state = get();

    // Return cached profile if still valid
    if (state.isCached()) {
      return state.profile;
    }

    set({ isLoading: true, error: null });

    try {
      const { getUserProfile } = await import('../utils/profile');
      const profileData = await getUserProfile(userId);

      set({
        profile: profileData,
        isLoading: false,
        lastFetched: Date.now()
      });

      return profileData;
    } catch (error) {
      set({
        error: error as Error,
        isLoading: false
      });
      return null;
    }
  },
}));
