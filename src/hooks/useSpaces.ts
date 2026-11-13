// src/hooks/useSpaces.ts — Updated with spam prevention + real-time fixes
// See full comments inline

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, SpaceStatus, CheckIn, SearchSession } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useSpacesContext } from '../lib/SpacesContext';

const CHECKIN_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const COOLDOWN_STORAGE_KEY = (userId: string, spaceId: string) =>
  `checkin_cooldown_${userId}_${spaceId}`;

// ── Space list with live status ──────────────────────────────
// Data is fetched once and kept live by SpacesProvider (src/lib/SpacesContext.tsx);
// this hook just reads it and applies the optional type filter.
export function useSpaces(filterType?: string) {
  const { spaces, loading, error, refresh } = useSpacesContext();
  const filtered = useMemo(
    () => (filterType && filterType !== 'all' ? spaces.filter(s => s.type === filterType) : spaces),
    [spaces, filterType]
  );
  return { spaces: filtered, loading, error, refresh };
}

// ── Single space ─────────────────────────────────────────────
export function useSpace(spaceId: string) {
  const [space, setSpace] = useState<SpaceStatus | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpace = async () => {
    const [spaceRes, checkInsRes] = await Promise.all([
      supabase.from('space_status').select('*').eq('id', spaceId).single(),
      supabase.from('check_ins').select('*').eq('space_id', spaceId)
        .order('created_at', { ascending: false }).limit(10),
    ]);
    if (spaceRes.data) setSpace(spaceRes.data);
    if (checkInsRes.data) setRecentCheckIns(checkInsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSpace();

    const channel = supabase
      .channel(`space_${spaceId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'check_ins',
        filter: `space_id=eq.${spaceId}`
      }, (payload) => {
        // Prepend the new check-in and update the status from it — no refetch needed
        const ci = payload.new as CheckIn;
        setRecentCheckIns(prev => [ci, ...prev].slice(0, 10));
        setSpace(prev => prev ? { ...prev, last_status: ci.status, last_updated: ci.created_at } : prev);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [spaceId]);

  return { space, recentCheckIns, loading, refresh: fetchSpace };
}

// ── Check-in action with spam prevention ─────────────────────
export function useCheckIn() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldownUntil = useRef<Record<string, number>>({});

  // Restore persisted cooldowns on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cooldownKeys = keys.filter(k => k.startsWith(`checkin_cooldown_${user.id}_`));
        const pairs = await AsyncStorage.multiGet(cooldownKeys);
        pairs.forEach(([key, value]) => {
          if (!value) return;
          const spaceId = key.replace(`checkin_cooldown_${user.id}_`, '');
          const until = parseInt(value, 10);
          if (until > Date.now()) cooldownUntil.current[spaceId] = until;
        });
      } catch { /* non-fatal */ }
    })();
  }, [user]);

  const getCooldownSeconds = (spaceId: string): number => {
    const until = cooldownUntil.current[spaceId] ?? 0;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  };

  const checkIn = async (spaceId: string, status: 'occupied' | 'free') => {
    if (!user) return { success: false, cooldownSeconds: 0 };

    const remaining = getCooldownSeconds(spaceId);
    if (remaining > 0) {
      const mins = Math.ceil(remaining / 60);
      setError(`Please wait ${mins} minute${mins !== 1 ? 's' : ''} before reporting this space again.`);
      return { success: false, cooldownSeconds: remaining };
    }

    setSubmitting(true);
    setError(null);

    const { error: dbError } = await supabase.from('check_ins').insert({
      space_id: spaceId,
      user_id: user.id,
      status,
    });

    if (dbError) {
      setError(dbError.message);
      setSubmitting(false);
      return { success: false, cooldownSeconds: 0 };
    }

    const until = Date.now() + CHECKIN_COOLDOWN_MS;
    cooldownUntil.current[spaceId] = until;
    try {
      await AsyncStorage.setItem(COOLDOWN_STORAGE_KEY(user.id, spaceId), String(until));
    } catch { /* non-fatal */ }

    setSubmitting(false);
    return { success: true, cooldownSeconds: 0 };
  };

  return { checkIn, submitting, error, getCooldownSeconds };
}

// ── Search session tracking ───────────────────────────────────
// FIX: Session ID is stored in AsyncStorage instead of a ref so it
// survives navigation between HomeScreen and SpaceDetailScreen.
// Previously the ref lived in HomeScreen's hook instance, so
// SpaceDetailScreen's separate hook instance always had null and
// resolveSession was a no-op.

const SESSION_STORAGE_KEY = (userId: string) => `active_session_${userId}`;

export function useSearchSession() {
  const { user } = useAuth();

  const startSession = async () => {
    if (!user) return;

    // Don't create a new session if one is already open
    try {
      const existing = await AsyncStorage.getItem(SESSION_STORAGE_KEY(user.id));
      if (existing) return;
    } catch { /* non-fatal */ }

    const { data, error } = await supabase
      .from('search_sessions')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      try {
        await AsyncStorage.setItem(SESSION_STORAGE_KEY(user.id), data.id);
      } catch { /* non-fatal */ }
    }
  };

  const resolveSession = async (spaceId: string) => {
    if (!user) return;

    let sessionId: string | null = null;
    try {
      sessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY(user.id));
    } catch { /* non-fatal */ }

    if (!sessionId) return;

    const now = new Date().toISOString();
    const { data: session } = await supabase
      .from('search_sessions')
      .select('started_at')
      .eq('id', sessionId)
      .single();

    if (session) {
      const durationSeconds = Math.round(
        (new Date(now).getTime() - new Date(session.started_at).getTime()) / 1000
      );
      await supabase.from('search_sessions').update({
        resolved_at: now,
        space_id: spaceId,
        search_duration_seconds: durationSeconds,
      }).eq('id', sessionId);
    }

    // Clear so the next HomeScreen mount starts a fresh session
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY(user.id));
    } catch { /* non-fatal */ }
  };

  return { startSession, resolveSession };
}

// ── Headcount submission ──────────────────────────────────────
export function useHeadcount() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const submitHeadcount = async (spaceId: string, count: number, note?: string) => {
    if (!user) return false;
    setSubmitting(true);
    const { error } = await supabase.from('headcounts').insert({
      space_id: spaceId,
      observer_id: user.id,
      count,
      note,
    });
    setSubmitting(false);
    return !error;
  };

  return { submitHeadcount, submitting };
}

// ── Survey submission ─────────────────────────────────────────
export function useSurvey() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);

  // FIX: check on mount whether the user already submitted so the
  // thank-you screen shows even after navigating away and back.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setSubmitted(true);
      setChecking(false);
    })();
  }, [user]);

  const submitSurvey = async (responses: {
    perceived_useful: number;
    perceived_ease: number;
    trust_in_data: number;
    would_continue: number;
    open_feedback: string;
  }) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from('survey_responses').insert({
      user_id: user.id,
      ...responses,
    });
    if (!error) setSubmitted(true);
    setSubmitting(false);
  };

  return { submitSurvey, submitting, submitted, checking };
}
