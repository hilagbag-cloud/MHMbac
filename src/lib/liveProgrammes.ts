import { useEffect, useState } from 'react';
import { LiveProgramme } from '../types/orientation';
import { isSupabaseConfigured, realSupabase } from './supabase';

export interface LiveProgrammesState {
  rows: LiveProgramme[];
  loading: boolean;
  error: string | null;
  realtime: 'connected' | 'connecting' | 'disabled' | 'error';
  lastUpdated: string | null;
}

export function useLiveProgrammes(limit = 60): LiveProgrammesState {
  const [state, setState] = useState<LiveProgrammesState>({ rows: [], loading: true, error: null, realtime: isSupabaseConfigured ? 'connecting' : 'disabled', lastUpdated: null });

  useEffect(() => {
    if (!realSupabase) {
      setState((current) => ({ ...current, loading: false, realtime: 'disabled' }));
      return;
    }

    let active = true;
    const load = async () => {
      const { data, error } = await realSupabase
        .from('live_programmes')
        .select('*')
        .order('score_opportunity', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (!active) return;
      if (error) {
        setState((current) => ({ ...current, loading: false, error: error.message, realtime: 'error' }));
        return;
      }
      const rows = (data || []) as LiveProgramme[];
      setState((current) => ({ ...current, rows, loading: false, error: null, lastUpdated: rows[0]?.updated_at || new Date().toISOString() }));
    };

    void load();
    const channel = realSupabase
      .channel('mhm-live-programmes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_programmes' }, (payload) => {
        if (!active) return;
        setState((current) => {
          const incoming = (payload.new || payload.old) as LiveProgramme;
          if (!incoming?.programme_id) return current;
          const without = current.rows.filter((row) => row.programme_id !== incoming.programme_id);
          const rows = payload.eventType === 'DELETE' ? without : [incoming, ...without].sort((a, b) => (b.score_opportunity ?? -1) - (a.score_opportunity ?? -1)).slice(0, limit);
          return { ...current, rows, lastUpdated: incoming.updated_at || new Date().toISOString(), realtime: 'connected' };
        });
      })
      .subscribe((status) => {
        if (!active) return;
        setState((current) => ({ ...current, realtime: status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' ? 'error' : 'connecting' }));
      });

    return () => { active = false; void realSupabase.removeChannel(channel); };
  }, [limit]);

  return state;
}

export function formatFreshness(iso: string | null): string {
  if (!iso) return 'Aucune collecte';
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return minutes < 1 ? 'à l’instant' : `il y a ${minutes} min`;
}
