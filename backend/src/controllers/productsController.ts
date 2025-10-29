import { Request, Response, NextFunction } from 'express';
import productsService from '../services/productsService';
import { AppError } from '../utils/appError';
import {
  productsListQuerySchema,
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
} from '../validators/products';

export class ProductsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const parsed = productsListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const filters = {
        type: parsed.data.type,
        status: parsed.data.status,
        search: parsed.data.search,
        sort_by: parsed.data.sort_by,
        sort_direction: parsed.data.sort_direction || 'desc',
        page: parsed.data.page || 1,
        page_size: parsed.data.page_size || 25,
      };

      const result = await productsService.listProducts(tenantId, filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;

      const parsed = createProductSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const product = await productsService.createProduct(tenantId, parsed.data);

      res.status(201).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const product = await productsService.getProduct(tenantId, id);

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const parsed = updateProductSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const product = await productsService.updateProduct(tenantId, id, parsed.data);

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const parsed = updateProductStatusSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError('Validation failed', 400, parsed.error.flatten().fieldErrors);
      }

      const product = await productsService.updateProductStatus(tenantId, id, parsed.data.status);

      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      await productsService.deleteProduct(tenantId, id);

      res.status(200).json({
        status: 'success',
        data: {
          message: 'Product deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async batchUpdateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { product_ids, status } = req.body;

      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        throw new AppError('product_ids must be a non-empty array', 400);
      }

      if (!status || typeof status !== 'string') {
        throw new AppError('status is required', 400);
      }

      if (product_ids.length > 100) {
        throw new AppError('Cannot update more than 100 products at once', 400);
      }

      const results = await productsService.batchUpdateStatus(tenantId, product_ids, status);

      res.status(200).json({
        status: 'success',
        data: {
          updated: results.updated,
          failed: results.failed,
          message: `Updated ${results.updated} products, ${results.failed} failed`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductsController();
