'use client';

import { useEffect } from 'react';
import { useWealth } from '@/context/WealthContext';
import {
  calculateFourPercentRule,
  calculate529Progress,
  calculateNetWorth,
  calculateMortgageProgress,
  calculateEmergencyFundProgress,
  calculateRetirementScenarios,
} from '@/lib/calculations';

export function useWealthData() {
  const { state, loadData, saveData, updateData, setFullData } = useWealth();

  useEffect(() => {
    // Guard against re-triggering after an error: without !state.error, a failed
    // fetch leaves state.data=null + state.isLoading=false → infinite retry loop.
    if (!state.data && !state.isLoading && !state.error) {
      loadData();
    }
  }, [state.data, state.isLoading, state.error, loadData]);

  const calculations = state.data
    ? {
        retirement: calculateFourPercentRule(state.data),
        education: calculate529Progress(state.data),
        netWorth: calculateNetWorth(state.data),
        mortgage: calculateMortgageProgress(state.data),
        emergencyFund: calculateEmergencyFundProgress(state.data),
        retirementScenarios: calculateRetirementScenarios(state.data),
      }
    : null;

  return {
    data: state.data,
    calculations,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved,
    saveData,
    updateData,
    setFullData,
    reloadData: loadData,
  };
}
