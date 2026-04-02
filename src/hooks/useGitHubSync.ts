'use client';

import { useState, useCallback } from 'react';
import { getGitHubConfig, setGitHubConfig, clearGitHubConfig } from '@/lib/github';

interface GitHubSyncState {
  isConfigured: boolean;
  owner: string;
  repo: string;
}

export function useGitHubSync() {
  const [state, setState] = useState<GitHubSyncState>(() => {
    if (typeof window === 'undefined') {
      return { isConfigured: false, owner: '', repo: '' };
    }
    const config = getGitHubConfig();
    return {
      isConfigured: !!config,
      owner: config?.owner || '',
      repo: config?.repo || '',
    };
  });

  const configure = useCallback((owner: string, repo: string, token: string) => {
    setGitHubConfig({ owner, repo, token });
    setState({ isConfigured: true, owner, repo });
  }, []);

  const disconnect = useCallback(() => {
    clearGitHubConfig();
    setState({ isConfigured: false, owner: '', repo: '' });
  }, []);

  const checkConfiguration = useCallback(() => {
    const config = getGitHubConfig();
    setState({
      isConfigured: !!config,
      owner: config?.owner || '',
      repo: config?.repo || '',
    });
    return !!config;
  }, []);

  return {
    ...state,
    configure,
    disconnect,
    checkConfiguration,
  };
}
