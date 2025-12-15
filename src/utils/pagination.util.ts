import { PaginatedResponse, PaginationParams } from '@/types';
import { config } from '@/config';

export class PaginationUtil {
  static getPaginationParams(query: any): Required<PaginationParams> {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(
      config.pagination.maxPageSize,
      Math.max(1, parseInt(query.limit) || config.pagination.defaultPageSize)
    );
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  static getSkipTake(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const take = limit;
    return { skip, take };
  }

  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }
}
