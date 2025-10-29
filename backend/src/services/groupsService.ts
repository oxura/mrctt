import groupsRepository, {
  CreateGroupDto,
  GroupsFilter,
  GroupsListResult,
  UpdateGroupDto,
} from '../repositories/groupsRepository';
import productsRepository from '../repositories/productsRepository';
import { Group } from '../types/models';
import { AppError } from '../utils/appError';

export class GroupsService {
  async listGroups(tenantId: string, filters: GroupsFilter): Promise<GroupsListResult> {
    return groupsRepository.findAll(tenantId, filters);
  }

  async createGroup(tenantId: string, data: CreateGroupDto): Promise<Group> {
    const product = await productsRepository.findById(tenantId, data.product_id);

    if (product.type !== 'course') {
      throw new AppError('Groups can only be created for products of type "course"', 400);
    }

    return groupsRepository.create(tenantId, data);
  }

  async getGroup(tenantId: string, groupId: string): Promise<Group> {
    return groupsRepository.findById(tenantId, groupId);
  }

  async updateGroup(tenantId: string, groupId: string, data: UpdateGroupDto): Promise<Group> {
    if (data.product_id) {
      const product = await productsRepository.findById(tenantId, data.product_id);
      if (product.type !== 'course') {
        throw new AppError('Groups can only be linked to products of type "course"', 400);
      }
    }

    return groupsRepository.update(tenantId, groupId, data);
  }

  async refreshGroupCapacity(tenantId: string, groupId: string): Promise<Group> {
    return groupsRepository.updateCurrentCapacity(tenantId, groupId);
  }

  async deleteGroup(tenantId: string, groupId: string): Promise<void> {
    await groupsRepository.delete(tenantId, groupId);
  }
}

export default new GroupsService();
