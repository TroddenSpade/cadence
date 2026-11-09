import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { synth } from './audio';
import {
  STORAGE_KEY,
  createDefaultState,
  finalizeState,
  getDeviceId,
  loadState,
  mergeStates,
  normalizeState,
  todayKey,
  touchActivity,
  type AppState,
  type Settings,
  type SkillProgress,
} from './progressState';
import { loadSupabase, supabaseConfigured } from './supabase';
import { isEmailCodeComplete, normalizeEmailCode } from './otp';

export { todayKey } from './progressState';
export type {
  AppState,
  DailyTotals,
  InstrumentMode,
  LessonProgress,
  Settings,
  SkillProgress,
} from './progressState';

export type SyncStatus = 'disabled' | 'signed-out' | 'syncing' | 'synced' | 'offline' | 'error';

export const syncStatusLabel: Record<SyncStatus, string> = {
  disabled: 'Local only',
  'signed-out': 'Not signed in',
  syncing: 'Syncing…',
  synced: 'Up to date',
  offline: 'Offline — will sync',
  error: 'Sync problem',
};

interface SyncApi {
  /** True when Supabase credentials were present at build time. */
  configured: boolean;
  status: SyncStatus;
  email: string | null;
  lastSyncedAt: number | null;
  syncError: string | null;
  signIn: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyEmailCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  exportProgress: () => string;
  importProgress: (json: string) => { ok: boolean; error?: string };
}

interface ProgressApi extends SyncApi {
  state: AppState;
  settings: Settings;
  dueSkills: SkillProgress[];
  updateSettings: (partial: Partial<Settings>) => void;
  recordAnswer: (skillIds: string[], correct: boolean) => void;
  finishLesson: (lessonId: string, score: number, passed: boolean) => void;
  resetProgress: () => void;
  resetAll: () => void;
}

const REVIEW_INTERVALS = [0.25, 1, 2, 4, 7, 14, 30, 60];
const DAY = 24 * 60 * 60 * 1000;
const PUSH_DELAY = 1200;
const PULL_THROTTLE = 15_000;

const ProgressContext = createContext<ProgressApi | null>(null);

function authRedirectUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const deviceId = useMemo(() => getDeviceId(), []);
  const [state, setState] = useState<AppState>(() => loadState(deviceId));
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>(supabaseConfigured ? 'signed-out' : 'disabled');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const stateRef = useRef(state);
  const sessionRef = useRef<Session | null>(null);
  const lastPushedRef = useRef<string | null>(null);
  const lastPullRef = useRef(0);
  const syncReadyRef = useRef(!supabaseConfigured);
  const [syncReady, setSyncReady] = useState(!supabaseConfigured);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync is optional, so the Supabase chunk is fetched only when this build
  // actually has credentials.
  useEffect(() => {
    let active = true;
    void loadSupabase().then((client) => {
      if (!active) return;
      setSupabase(client);
      if (!client) {
        syncReadyRef.current = true;
        setSyncReady(true);
        setStatus('disabled');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.instrument = state.settings.instrument;
  }, [state.settings.instrument]);

  useEffect(() => {
    synth.setTimbre(state.settings.timbre);
    synth.setMuted(!state.settings.sound);
  }, [state.settings.timbre, state.settings.sound]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const adopt = (next: Session | null) => {
      if (!active) return;
      const current = sessionRef.current;
      if (current?.user.id === next?.user.id && current?.access_token === next?.access_token) return;

      if (next) {
        // Never push until this session has pulled and merged the account copy.
        syncReadyRef.current = false;
        setSyncReady(false);
      }
      sessionRef.current = next;
      setSession(next);
      if (next) {
        setStatus('syncing');
      } else {
        setStatus('signed-out');
        lastPushedRef.current = null;
      }
    };

    const checkSession = () => {
      void supabase.auth
        .getSession()
        .then(({ data }) => adopt(data.session))
        .catch(() => {
          if (active && !sessionRef.current) setStatus('error');
        });
    };

    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => adopt(next));

    // An installed Chrome PWA shares the browser profile's storage. When the
    // email link completes in a browser tab, re-read the session as soon as the
    // installed app returns to the foreground instead of staying signed out
    // until a full reload.
    const onResume = () => {
      if (document.visibilityState === 'visible') checkSession();
    };
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('focus', checkSession);
    window.addEventListener('pageshow', checkSession);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onResume);
      window.removeEventListener('focus', checkSession);
      window.removeEventListener('pageshow', checkSession);
    };
  }, [supabase]);

  const pushState = useCallback(
    async (next: AppState) => {
      if (!supabase || !session) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setStatus('offline');
        return;
      }
      setStatus('syncing');
      const payload = JSON.stringify(next);
      try {
        const { error } = await supabase.from('progress').upsert(
          {
            user_id: session.user.id,
            data: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );
        if (error) {
          setStatus('error');
          setSyncError(error.message);
          return;
        }
      } catch {
        setStatus('error');
        setSyncError('Could not reach the sync server. Changes stay on this device and retry later.');
        return;
      }
      lastPushedRef.current = payload;
      setStatus('synced');
      setSyncError(null);
      setLastSyncedAt(Date.now());
    },
    [session, supabase],
  );

  const pullState = useCallback(
    async (options?: { force?: boolean }) => {
      if (!supabase || !session) return;
      const now = Date.now();
      if (!options?.force && now - lastPullRef.current < PULL_THROTTLE) return;
      lastPullRef.current = now;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setStatus('offline');
        return;
      }
      setStatus('syncing');
      try {
        let response;
        try {
          response = await supabase
            .from('progress')
            .select('data, updated_at')
            .eq('user_id', session.user.id)
            .maybeSingle();
        } catch {
          setStatus('error');
          setSyncError('Could not reach the sync server. Changes stay on this device and retry later.');
          return;
        }
        const { data, error } = response;
        if (error) {
          setStatus('error');
          setSyncError(error.message);
          return;
        }
        if (!data) {
          await pushState(stateRef.current);
          return;
        }

        const remote = normalizeState(data.data, deviceId);
        const current = stateRef.current;
        const merged = mergeStates(current, remote);
        const mergedJson = JSON.stringify(merged);
        const currentJson = JSON.stringify(current);
        const remoteJson = JSON.stringify(remote);

        if (mergedJson !== currentJson) {
          stateRef.current = merged;
          setState(merged);
        }
        lastPushedRef.current = mergedJson === remoteJson ? mergedJson : null;

        if (mergedJson !== remoteJson) {
          await pushState(merged);
        } else {
          setStatus('synced');
          setSyncError(null);
          setLastSyncedAt(data.updated_at ? Date.parse(data.updated_at) : Date.now());
        }
      } finally {
        // Pushes stay blocked until the first pull has merged the account copy.
        syncReadyRef.current = true;
        setSyncReady(true);
      }
    },
    [session, deviceId, pushState, supabase],
  );

  useEffect(() => {
    if (!supabase || !session || !syncReady) return;
    if (JSON.stringify(state) === lastPushedRef.current) return;
    const timer = window.setTimeout(() => {
      if (!syncReadyRef.current) return;
      if (JSON.stringify(stateRef.current) === lastPushedRef.current) return;
      void pushState(stateRef.current);
    }, PUSH_DELAY);
    return () => window.clearTimeout(timer);
  }, [state, session, syncReady, pushState, supabase]);

  useEffect(() => {
    if (!session) return;
    void pullState({ force: true });
  }, [session?.user.id, pullState]);

  useEffect(() => {
    if (!session) return;
    const flush = () => {
      if (!syncReadyRef.current) return;
      if (JSON.stringify(stateRef.current) !== lastPushedRef.current) {
        void pushState(stateRef.current);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      else void pullState();
    };
    const onFocus = () => void pullState();
    const onOnline = () => void pullState({ force: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
    };
  }, [session, pushState, pullState]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setState((prev) =>
      finalizeState({
        ...prev,
        settings: { ...prev.settings, ...partial },
        settingsUpdatedAt: Date.now(),
      }),
    );
  }, []);

  const recordAnswer = useCallback(
    (skillIds: string[], correct: boolean) => {
      setState((prev) => {
        const now = Date.now();
        const skills = { ...prev.skills };
        skillIds.forEach((id) => {
          const existing = skills[id];
          const reviews = (existing?.reviews ?? 0) + 1;
          // Several questions can hit the same skill in one sitting. Only a new
          // session may advance the spaced-repetition interval.
          const sameSession = existing !== undefined && now - existing.lastSeen < 10 * 60 * 1000;
          const streak = correct
            ? sameSession
              ? Math.max(existing.streak, 1)
              : (existing?.streak ?? 0) + 1
            : 0;
          const baseStrength = existing?.strength ?? 0.45;
          const strength = Math.min(
            1,
            Math.max(0.05, correct ? baseStrength + (1 - baseStrength) * 0.22 : baseStrength - 0.18),
          );
          const intervalDays = correct
            ? REVIEW_INTERVALS[Math.min(streak - 1, REVIEW_INTERVALS.length - 1)]
            : REVIEW_INTERVALS[0];
          skills[id] = {
            id,
            strength,
            reviews,
            streak,
            lastSeen: now,
            dueAt: now + intervalDays * DAY,
          };
        });

        const today = todayKey();
        const deviceDaily = prev.dailyByDevice[deviceId];
        const daily =
          deviceDaily && deviceDaily.date === today
            ? {
                date: today,
                count: deviceDaily.count + 1,
                correct: deviceDaily.correct + (correct ? 1 : 0),
              }
            : { date: today, count: 1, correct: correct ? 1 : 0 };

        return finalizeState({
          ...touchActivity(prev),
          skills,
          dailyByDevice: { ...prev.dailyByDevice, [deviceId]: daily },
          xpByDevice: {
            ...prev.xpByDevice,
            [deviceId]: (prev.xpByDevice[deviceId] ?? 0) + (correct ? 10 : 2),
          },
        });
      });
    },
    [deviceId],
  );

  const finishLesson = useCallback(
    (lessonId: string, score: number, passed: boolean) => {
      setState((prev) => {
        const existing = prev.lessons[lessonId];
        const firstCompletion = passed && !existing?.completedAt;
        return finalizeState({
          ...touchActivity(prev),
          lessons: {
            ...prev.lessons,
            [lessonId]: {
              completedAt: existing?.completedAt ?? (passed ? Date.now() : undefined),
              bestScore: Math.max(existing?.bestScore ?? 0, score),
              attempts: (existing?.attempts ?? 0) + 1,
            },
          },
          xpByDevice: {
            ...prev.xpByDevice,
            [deviceId]: (prev.xpByDevice[deviceId] ?? 0) + (firstCompletion ? 60 : 10),
          },
        });
      });
    },
    [deviceId],
  );

  const resetProgress = useCallback(() => {
    setState((prev) =>
      finalizeState({
        ...createDefaultState(),
        settings: prev.settings,
        settingsUpdatedAt: prev.settingsUpdatedAt,
        resetAt: Date.now(),
      }),
    );
    lastPushedRef.current = null;
  }, []);

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState(
      finalizeState({
        ...createDefaultState(),
        resetAt: Date.now(),
        settingsUpdatedAt: Date.now(),
      }),
    );
    lastPushedRef.current = null;
  }, []);

  const signIn = useCallback(async (email: string) => {
    if (!supabaseConfigured) return { ok: false, error: 'Sync is not configured in this build.' };
    const client = supabase ?? (await loadSupabase());
    if (!client) return { ok: false, error: 'Sync is not configured in this build.' };
    try {
      const { error } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: authRedirectUrl() },
      });
      return error ? { ok: false, error: error.message } : { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Could not send the sign-in link. Check your connection and try again.',
      };
    }
  }, [supabase]);

  const verifyEmailCode = useCallback(
    async (email: string, code: string) => {
      if (!supabaseConfigured) return { ok: false, error: 'Sync is not configured in this build.' };
      const client = supabase ?? (await loadSupabase());
      if (!client) return { ok: false, error: 'Sync is not configured in this build.' };
      const token = normalizeEmailCode(code);
      if (!isEmailCodeComplete(token)) {
        return { ok: false, error: 'Enter the 6-digit code from the email.' };
      }
      try {
        const { error } = await client.auth.verifyOtp({
          email: email.trim(),
          token,
          type: 'email',
        });
        return error
          ? { ok: false, error: 'That code is incorrect or has expired. Request a new one.' }
          : { ok: true };
      } catch {
        return {
          ok: false,
          error: 'Could not verify the code. Check your connection and try again.',
        };
      }
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    const client = supabase ?? (await loadSupabase());
    if (!client) return;
    await client.auth.signOut();
    sessionRef.current = null;
    setSession(null);
    setStatus('signed-out');
    setLastSyncedAt(null);
    syncReadyRef.current = false;
    setSyncReady(false);
    lastPushedRef.current = null;
  }, [supabase]);

  const syncNow = useCallback(async () => {
    await pullState({ force: true });
  }, [pullState]);

  const exportProgress = useCallback(() => JSON.stringify(stateRef.current, null, 2), []);

  const importProgress = useCallback(
    (json: string) => {
      try {
        const parsed: unknown = JSON.parse(json);
        // A restore is treated as a new reset epoch so it wins over older
        // copies on other devices instead of being merged back in.
        const restored = finalizeState({
          ...normalizeState(parsed, deviceId),
          resetAt: Date.now(),
          settingsUpdatedAt: Date.now(),
        });
        stateRef.current = restored;
        lastPushedRef.current = null;
        setState(restored);
        return { ok: true };
      } catch {
        return { ok: false, error: 'That file is not a valid Cadence backup.' };
      }
    },
    [deviceId],
  );

  const dueSkills = useMemo(() => {
    const now = Date.now();
    return Object.values(state.skills)
      .filter((skill) => skill.dueAt <= now)
      .sort((a, b) => a.strength - b.strength);
  }, [state.skills, state.lastActive]);

  const value = useMemo<ProgressApi>(
    () => ({
      state,
      settings: state.settings,
      dueSkills,
      updateSettings,
      recordAnswer,
      finishLesson,
      resetProgress,
      resetAll,
      configured: supabaseConfigured,
      status,
      email: session?.user.email ?? null,
      lastSyncedAt,
      syncError,
      signIn,
      verifyEmailCode,
      signOut,
      syncNow,
      exportProgress,
      importProgress,
    }),
    [
      state,
      dueSkills,
      updateSettings,
      recordAnswer,
      finishLesson,
      resetProgress,
      resetAll,
      status,
      session,
      lastSyncedAt,
      syncError,
      signIn,
      verifyEmailCode,
      signOut,
      syncNow,
      exportProgress,
      importProgress,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used inside ProgressProvider');
  return context;
}

export function levelFromXp(xp: number): { level: number; title: string; progress: number; next: number } {
  const titles = ['Curious Ear', 'Apprentice', 'Sight Reader', 'Harmonist', 'Analyst', 'Composer', 'Master'];
  const thresholds = [0, 250, 700, 1500, 2800, 4500, 7000];
  let index = 0;
  thresholds.forEach((threshold, i) => {
    if (xp >= threshold) index = i;
  });
  const start = thresholds[index];
  const end = thresholds[Math.min(index + 1, thresholds.length - 1)] ?? start + 1000;
  const progress = index === thresholds.length - 1 ? 1 : (xp - start) / (end - start);
  return { level: index + 1, title: titles[index], progress: Math.min(1, Math.max(0, progress)), next: end };
}



