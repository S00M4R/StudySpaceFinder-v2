// src/lib/SpacesContext.tsx
// ============================================================
// One shared fetch + one realtime channel for the space list,
// used by every screen (Home, Map...) via useSpaces().
//  - New check-in  -> refetch only that space's row
//  - spaces table changed (add/edit/remove) -> debounced full refetch
// ============================================================
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, SpaceStatus } from './supabase';

interface SpacesContextValue {
  spaces: SpaceStatus[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SpacesContext = createContext<SpacesContextValue>({
  spaces: [], loading: true, error: null, refresh: async () => {},
});

const byBuildingThenName = (a: SpaceStatus, b: SpaceStatus) =>
  a.building.localeCompare(b.building) || a.name.localeCompare(b.name);

export function SpacesProvider({ children }: { children: React.ReactNode }) {
  const [spaces, setSpaces] = useState<SpaceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.from('space_status').select('*');
    if (error) { setError(error.message); setLoading(false); return; }
    setError(null);
    setSpaces((data || []).sort(byBuildingThenName));
    setLoading(false);
  }, []);

  const refreshOne = useCallback(async (spaceId: string) => {
    const { data } = await supabase.from('space_status').select('*').eq('id', spaceId).maybeSingle();
    if (!data) return;
    setSpaces(prev => prev.map(s => (s.id === spaceId ? data : s)));
  }, []);

  useEffect(() => {
    refresh();

    const scheduleFullRefresh = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(refresh, 500);
    };

    const channel = supabase
      .channel('spaces_shared')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins' },
        (payload) => refreshOne((payload.new as { space_id: string }).space_id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spaces' },
        scheduleFullRefresh)
      .subscribe();

    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      supabase.removeChannel(channel);
    };
  }, [refresh, refreshOne]);

  return (
    <SpacesContext.Provider value={{ spaces, loading, error, refresh }}>
      {children}
    </SpacesContext.Provider>
  );
}

export const useSpacesContext = () => useContext(SpacesContext);
