import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Group, GroupStatus } from '../types';

export interface GroupsFilter {
  product_id?: string;
  status?: GroupStatus;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface GroupsListResult {
  groups: Group[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateGroupDto {
  product_id: string;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  max_capacity?: number | null;
}

export interface UpdateGroupDto {
  product_id?: string;
  name?: string;
  start_date?: string | null;
  end_date?: string | null;
  max_capacity?: number | null;
  status?: GroupStatus;
}

export const useGroups = (initialFilters: GroupsFilter = {}) => {
  const [data, setData] = useState<GroupsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GroupsFilter>(initialFilters);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      const { product_id, ...restFilters } = filters;

      Object.entries(restFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const queryString = params.toString();

      let url = '/api/v1/groups';
      if (product_id) {
        url = `/api/v1/products/${product_id}/groups`;
      }
      if (queryString) {
        url += `?${queryString}`;
      }

      const response = await api.get(url);
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки групп');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (groupData: CreateGroupDto): Promise<Group> => {
    try {
      if (!groupData.product_id) {
        throw new Error('Не выбран продукт для группы');
      }

      const { product_id, ...payload } = groupData;
      const response = await api.post(`/api/v1/products/${product_id}/groups`, payload);
      await fetchGroups();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Ошибка создания группы');
    }
  };

  const updateGroup = async (groupId: string, groupData: UpdateGroupDto): Promise<Group> => {
    try {
      const response = await api.put(`/api/v1/product-groups/${groupId}`, groupData);
      await fetchGroups();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Ошибка обновления группы');
    }
  };

  const deleteGroup = async (groupId: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/product-groups/${groupId}`);
      await fetchGroups();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Ошибка удаления группы');
    }
  };

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
};

export const useGroup = (groupId: string) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/groups/${groupId}`);
      setGroup(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки группы');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const updateGroup = async (groupData: UpdateGroupDto): Promise<Group> => {
    if (!groupId) {
      throw new Error('ID группы обязателен');
    }

    try {
      const response = await api.put(`/api/v1/product-groups/${groupId}`, groupData);
      await fetchGroup();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Ошибка обновления группы');
    }
  };

  return {
    group,
    loading,
    error,
    refetch: fetchGroup,
    updateGroup,
  };
};
