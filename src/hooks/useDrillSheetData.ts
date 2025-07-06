import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Schema } from '../../amplify/data/resource';

export function useCustomers() {
  const [customers, setCustomers] = useState<Schema['Customer']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        const result = await api.getCustomers();
        if (result.data) {
          setCustomers(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  return { customers, loading, error, refetch: fetchCustomers };
}

export function useDrillSheets(customerId?: string) {
  const [drillSheets, setDrillSheets] = useState<Schema['DrillSheet']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDrillSheets() {
      try {
        setLoading(true);
        const result = await api.getDrillSheets(customerId);
        if (result.data) {
          setDrillSheets(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDrillSheets();
  }, [customerId]);

  return { drillSheets, loading, error };
}
