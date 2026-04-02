'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { WealthData } from '@/types/wealth';
import { fetchDataFromGitHub, fetchShaOnly, saveDataToGitHub, getGitHubConfig } from '@/lib/github';

// ─── Data migration ───────────────────────────────────────────────────────────
// Runs every time data is loaded (from GitHub or the local fallback).
// Upgrades stale schemas in-memory so the UI always sees the correct structure.
// Changes made here are NOT automatically saved — the user must hit "Sync"
// to make them permanent in GitHub.
function migrateData(raw: WealthData): WealthData {
  // Deep-clone so we never mutate the dispatched payload
  const data: WealthData = JSON.parse(JSON.stringify(raw));

  // Demo mode: no data migration needed — data.json ships with correct schema

  return data;
}

interface WealthState {
  data: WealthData | null;
  sha: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

type WealthAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { data: WealthData; sha: string } }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'UPDATE_DATA'; payload: Partial<WealthData> }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; payload: { sha: string } }
  | { type: 'SAVE_ERROR'; payload: string }
  | { type: 'SET_DATA'; payload: WealthData }
  | { type: 'SET_SHA'; payload: string };

const initialState: WealthState = {
  data: null,
  sha: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
  hasUnsavedChanges: false,
};

function wealthReducer(state: WealthState, action: WealthAction): WealthState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        data: action.payload.data,
        sha: action.payload.sha,
        error: null,
      };
    case 'LOAD_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'UPDATE_DATA':
      if (!state.data) return state;
      return {
        ...state,
        data: { ...state.data, ...action.payload },
        hasUnsavedChanges: true,
      };
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        hasUnsavedChanges: true,
      };
    case 'SET_SHA':
      return { ...state, sha: action.payload };
    case 'SAVE_START':
      return { ...state, isSaving: true, error: null };
    case 'SAVE_SUCCESS':
      return {
        ...state,
        isSaving: false,
        sha: action.payload.sha,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null,
      };
    case 'SAVE_ERROR':
      return { ...state, isSaving: false, error: action.payload };
    default:
      return state;
  }
}

interface WealthContextValue {
  state: WealthState;
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  updateData: (data: Partial<WealthData>) => void;
  setFullData: (data: WealthData) => void;
}

const WealthContext = createContext<WealthContextValue | null>(null);

export function WealthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wealthReducer, initialState);
  const [isClient, setIsClient] = useState(false);

  // Keep a ref that always points to the latest state.
  // This lets useCallback functions (which have empty dep arrays for stability)
  // read current state without causing the infinite re-render loop that would
  // occur if state were listed as a dependency.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ── loadData ─────────────────────────────────────────────────────────────
  // useCallback with [] keeps the reference stable across renders so the
  // useEffect in useWealthData doesn't fire on every render cycle.
  const loadData = useCallback(async () => {
    const config = getGitHubConfig();

    if (!config) {
      // No token saved yet — fall back to the local public/data.json
      try {
        dispatch({ type: 'LOAD_START' });
        const response = await fetch('/data.json');
        if (!response.ok) throw new Error('Failed to fetch local data.json');
        const raw = await response.json();
        dispatch({ type: 'LOAD_SUCCESS', payload: { data: migrateData(raw), sha: '' } });
      } catch {
        dispatch({ type: 'LOAD_ERROR', payload: 'Failed to load local data' });
      }
      return;
    }

    dispatch({ type: 'LOAD_START' });
    try {
      const result = await fetchDataFromGitHub(config);
      // Migrate before storing — fixes stale GitHub data without a manual sync
      dispatch({ type: 'LOAD_SUCCESS', payload: { data: migrateData(result.data), sha: result.sha } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load data from GitHub';

      // data.json doesn't exist in the repo yet (first-time setup).
      // Fall back to the local placeholder so the dashboard renders normally.
      // sha stays '' so the first "Sync with GitHub" click will CREATE the file.
      if (msg.includes('data.json not found')) {
        try {
          const fallback = await fetch('/data.json');
          if (fallback.ok) {
            const raw = await fallback.json();
            dispatch({ type: 'LOAD_SUCCESS', payload: { data: migrateData(raw), sha: '' } });
            return;
          }
        } catch {
          // ignore — fall through to the generic error below
        }
      }

      dispatch({
        type: 'LOAD_ERROR',
        payload: msg,
      });
    }
  }, []); // stable — reads config fresh from localStorage on each call

  // ── saveData ─────────────────────────────────────────────────────────────
  const saveData = useCallback(async () => {
    const config = getGitHubConfig();
    const current = stateRef.current; // always the latest state, no dep needed

    if (!config) {
      dispatch({ type: 'SAVE_ERROR', payload: 'GitHub not configured — open ⚙ Settings and enter your token.' });
      return;
    }

    if (!current.data) {
      dispatch({ type: 'SAVE_ERROR', payload: 'No data loaded yet. Please wait for the dashboard to finish loading.' });
      return;
    }

    dispatch({ type: 'SAVE_START' });

    try {
      // Resolve the blob SHA GitHub needs for an update PUT.
      // fetchShaOnly never parses file content, so a stale schema on GitHub
      // can never cause a type error here.
      let sha: string | null = current.sha || null;

      if (!sha) {
        sha = await fetchShaOnly(config); // null → file doesn't exist yet, GitHub will create it
        if (sha) dispatch({ type: 'SET_SHA', payload: sha });
      }

      const newSha = await saveDataToGitHub(config, current.data, sha);
      dispatch({ type: 'SAVE_SUCCESS', payload: { sha: newSha } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save data';
      dispatch({ type: 'SAVE_ERROR', payload: msg });
    }
  }, []); // stable — reads state via stateRef, config via localStorage

  // ── updateData / setFullData ──────────────────────────────────────────────
  const updateData = useCallback((data: Partial<WealthData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: data });
  }, []);

  const setFullData = useCallback((data: WealthData) => {
    dispatch({ type: 'SET_DATA', payload: data });
  }, []);

  // ── Stable context value ──────────────────────────────────────────────────
  // useMemo ensures the object reference only changes when state changes,
  // preventing unnecessary re-renders of all consumers.
  const contextValue = useMemo<WealthContextValue>(
    () => ({ state, loadData, saveData, updateData, setFullData }),
    [state, loadData, saveData, updateData, setFullData]
  );

  if (!isClient) return null;

  return (
    <WealthContext.Provider value={contextValue}>
      {children}
    </WealthContext.Provider>
  );
}

export function useWealth() {
  const context = useContext(WealthContext);
  if (!context) {
    throw new Error('useWealth must be used within a WealthProvider');
  }
  return context;
}
