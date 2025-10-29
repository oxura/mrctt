import productsRepository, {
  CreateProductDto,
  ProductsFilter,
  ProductsListResult,
  UpdateProductDto,
} from '../repositories/productsRepository';
import { Product } from '../types/models';

export class ProductsService {
  async listProducts(tenantId: string, filters: ProductsFilter): Promise<ProductsListResult> {
    return productsRepository.findAll(tenantId, filters);
  }

  async createProduct(tenantId: string, data: CreateProductDto): Promise<Product> {
    return productsRepository.create(tenantId, data);
  }

  async getProduct(tenantId: string, productId: string): Promise<Product> {
    return productsRepository.findById(tenantId, productId);
  }

  async updateProduct(
    tenantId: string,
    productId: string,
    data: UpdateProductDto
  ): Promise<Product> {
    return productsRepository.update(tenantId, productId, data);
  }

  async updateProductStatus(
    tenantId: string,
    productId: string,
    status: 'active' | 'archived'
  ): Promise<Product> {
    return productsRepository.updateStatus(tenantId, productId, status);
  }

  async batchUpdateStatus(
    tenantId: string,
    productIds: string[],
    status: 'active' | 'archived'
  ): Promise<{ updated: number; failed: number }> {
    return productsRepository.batchUpdateStatus(tenantId, productIds, status);
  }

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    await productsRepository.delete(tenantId, productId);
  }
}

export default new ProductsService();
