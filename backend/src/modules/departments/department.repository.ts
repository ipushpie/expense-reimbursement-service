import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export const departmentRepository = {
  create(data: Prisma.DepartmentCreateInput) {
    return prisma.department.create({ data });
  },

  findAll() {
    return prisma.department.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
  },
};
