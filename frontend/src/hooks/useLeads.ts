import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export interface Lead {
  id: string;
  tenant_id: string;
  product_id: string | null;
  group_id: string | null;
  assigned_to: string | null;
  status: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
  product_name?: string | null;
  group_name?: string | null;
  assigned_name?: string | null;
}

export interface LeadsFilter {
  status?: string;
  assigned_to?: string;
  product_id?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface LeadsListResult {
  leads: Lead[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateLeadDto {
  product_id?: string | null;
  group_id?: string | null;
  assigned_to?: string | null;
  status?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  custom_fields?: Record<string, any>;
}

export const useLeads = (initialFilters: LeadsFilter = {}) => {
  const [data, setData] = useState<LeadsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadsFilter>(initialFilters);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/api/v1/leads?${params.toString()}`);
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (leadData: CreateLeadDto): Promise<Lead> => {
    try {
      const response = await api.post('/api/v1/leads', leadData);
      await fetchLeads();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create lead');
    }
  };

  const updateLead = async (leadId: string, leadData: Partial<CreateLeadDto>): Promise<Lead> => {
    try {
      const response = await api.patch(`/api/v1/leads/${leadId}`, leadData);
      await fetchLeads();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const updateLeadStatus = async (leadId: string, status: string): Promise<Lead> => {
    try {
      const response = await api.patch(`/api/v1/leads/${leadId}/status`, { status });
      await fetchLeads();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  const deleteLead = async (leadId: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/leads/${leadId}`);
      await fetchLeads();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete lead');
    }
  };

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchLeads,
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
  };
};

export const useLead = (leadId: string) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/leads/${leadId}`);
      setLead(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const updateLead = async (leadData: Partial<CreateLeadDto>): Promise<Lead> => {
    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    try {
      const response = await api.patch(`/api/v1/leads/${leadId}`, leadData);
      await fetchLead();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update lead');
    }
  };

  const updateLeadStatus = async (status: string): Promise<Lead> => {
    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    try {
      const response = await api.patch(`/api/v1/leads/${leadId}/status`, { status });
      await fetchLead();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  return {
    lead,
    loading,
    error,
    refetch: fetchLead,
    updateLead,
    updateLeadStatus,
  };
};
