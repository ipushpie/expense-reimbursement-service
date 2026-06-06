import { ReimbursementStatus, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

const INCLUDE_DETAIL = {
  employee: { select: { id: true, name: true, email: true, currency: true, departmentId: true } },
  approver: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      expense: {
        select: { id: true, title: true, category: true, expenseDate: true, amount: true, currency: true },
      },
    },
  },
} as const;

export const reimbursementRepository = {
  create(data: Prisma.ReimbursementRequestCreateInput) {
    return prisma.reimbursementRequest.create({ data, include: INCLUDE_DETAIL });
  },

  findById(id: string) {
    return prisma.reimbursementRequest.findUnique({ where: { id }, include: INCLUDE_DETAIL });
  },

  findMany(filters: {
    employeeId?: string;
    approverId?: string;
    status?: ReimbursementStatus;
    month?: number;
    year?: number;
    page: number;
    limit: number;
  }) {
    const where: Prisma.ReimbursementRequestWhereInput = {
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.approverId !== undefined && { approverId: filters.approverId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.month !== undefined && { month: filters.month }),
      ...(filters.year !== undefined && { year: filters.year }),
    };
    const skip = (filters.page - 1) * filters.limit;

    return prisma.$transaction([
      prisma.reimbursementRequest.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true } },
          items: { select: { id: true, originalAmount: true, originalCurrency: true, amountUSD: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.reimbursementRequest.count({ where }),
    ]);
  },

  update(id: string, data: Prisma.ReimbursementRequestUpdateInput) {
    return prisma.reimbursementRequest.update({ where: { id }, data, include: INCLUDE_DETAIL });
  },

  getApprovedTotalForDept(departmentId: string, month: number, year: number) {
    return prisma.reimbursementRequest.aggregate({
      where: {
        status: ReimbursementStatus.APPROVED,
        month,
        year,
        employee: { departmentId },
      },
      _sum: { totalAmountUSD: true },
    });
  },
};
