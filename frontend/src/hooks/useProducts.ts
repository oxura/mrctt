import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Product, ProductType, ProductStatus } from '../types';

export interface ProductsFilter {
  type?: ProductType;
  status?: ProductStatus;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface ProductsListResult {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  type: ProductType;
  price?: number;
  status?: ProductStatus;
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  type?: ProductType;
  price?: number | null;
  status?: ProductStatus;
}

export const useProducts = (initialFilters: ProductsFilter = {}) => {
  const [data, setData] = useState<ProductsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductsFilter>(initialFilters);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/api/v1/products?${params.toString()}`);
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (productData: CreateProductDto): Promise<Product> => {
    try {
      const response = await api.post('/api/v1/products', productData);
      await fetchProducts();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create product');
    }
  };

  const updateProduct = async (
    productId: string,
    productData: UpdateProductDto
  ): Promise<Product> => {
    try {
      const response = await api.put(`/api/v1/products/${productId}`, productData);
      await fetchProducts();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update product');
    }
  };

  const updateProductStatus = async (
    productId: string,
    status: ProductStatus
  ): Promise<Product> => {
    try {
      const response = await api.patch(`/api/v1/products/${productId}/status`, { status });
      await fetchProducts();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update product status');
    }
  };

  const deleteProduct = async (productId: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/products/${productId}`);
      await fetchProducts();
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    updateProductStatus,
    deleteProduct,
  };
};

export const useProduct = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/products/${productId}`);
      setProduct(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const updateProduct = async (productData: UpdateProductDto): Promise<Product> => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await api.put(`/api/v1/products/${productId}`, productData);
      await fetchProduct();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update product');
    }
  };

  const updateProductStatus = async (status: ProductStatus): Promise<Product> => {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    try {
      const response = await api.patch(`/api/v1/products/${productId}/status`, { status });
      await fetchProduct();
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update product status');
    }
  };

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
    updateProduct,
    updateProductStatus,
  };
};
