import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export const auditRepository = {
  create(data: Prisma.AuditLogCreateInput) {
    return prisma.auditLog.create({ data });
  },

  findMany(filters: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    from?: Date;
    to?: Date;
    page: number;
    limit: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.entityType && { entityType: filters.entityType }),
      ...(filters.entityId && { entityId: filters.entityId }),
      ...(filters.userId && { userId: filters.userId }),
      ...((filters.from || filters.to) && {
        createdAt: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lte: filters.to }),
        },
      }),
    };
    const skip = (filters.page - 1) * filters.limit;

    return prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
  },
};
