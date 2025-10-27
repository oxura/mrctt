import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export interface Activity {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id: string | null;
  activity_type: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
}

export const useActivities = (leadId: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/leads/${leadId}/activities`);
      setActivities(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
};
