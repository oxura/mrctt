import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export interface Comment {
  id: string;
  tenant_id: string;
  lead_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string | null;
  user_avatar?: string | null;
}

export interface CreateCommentDto {
  content: string;
}

export const useComments = (leadId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/leads/${leadId}/comments`);
      setComments(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const createComment = async (data: CreateCommentDto): Promise<Comment> => {
    try {
      const response = await api.post(`/api/v1/leads/${leadId}/comments`, data);
      await fetchComments();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create comment');
    }
  };

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    createComment,
  };
};
