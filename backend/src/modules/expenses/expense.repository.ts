import { ExpenseStatus, Prisma } from '@prisma/client';
import { prisma } from '../../prisma/client';

export const expenseRepository = {
  create(data: Prisma.ExpenseCreateInput) {
    return prisma.expense.create({
      data,
      include: { attachments: true },
    });
  },

  findById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: { attachments: true, user: { select: { id: true, name: true, email: true } } },
    });
  },

  findMany(userId: string, filters: { month?: number; year?: number; status?: ExpenseStatus; page: number; limit: number }) {
    const where: Prisma.ExpenseWhereInput = {
      userId,
      ...(filters.month !== undefined && { month: filters.month }),
      ...(filters.year !== undefined && { year: filters.year }),
      ...(filters.status && { status: filters.status }),
    };
    const skip = (filters.page - 1) * filters.limit;

    return prisma.$transaction([
      prisma.expense.findMany({
        where,
        include: { attachments: { select: { id: true, filename: true, mimeType: true, sizeBytes: true } } },
        orderBy: { expenseDate: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.expense.count({ where }),
    ]);
  },

  update(id: string, data: Prisma.ExpenseUpdateInput) {
    return prisma.expense.update({
      where: { id },
      data,
      include: { attachments: true },
    });
  },

  delete(id: string) {
    return prisma.expense.delete({ where: { id } });
  },

  addAttachment(data: Prisma.AttachmentCreateInput) {
    return prisma.attachment.create({ data });
  },

  findAttachment(attachId: string) {
    return prisma.attachment.findUnique({ where: { id: attachId }, include: { expense: true } });
  },

  deleteAttachment(attachId: string) {
    return prisma.attachment.delete({ where: { id: attachId } });
  },
};
