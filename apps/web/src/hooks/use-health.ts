'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiClientError } from '../services/api-client';
import { ServiceHealth, ServiceReadiness } from '@campus-os/shared-types';

export function useSystemHealth() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [readiness, setReadiness] = useState<ServiceReadiness | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, readyRes] = await Promise.all([
        apiClient.get<ServiceHealth>('/health'),
        apiClient.get<ServiceReadiness>('/health/ready'),
      ]);
      setHealth(healthRes.data);
      setReadiness(readyRes.data);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError(err.message || 'Failed to connect to backend API');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return { health, readiness, loading, error, refetch: checkHealth };
}
