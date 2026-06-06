import path from 'path';
import { ExpenseStatus } from '@prisma/client';
import { expenseRepository } from './expense.repository';
import { auditService } from '../audit/audit.service';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { uploadFile, getPresignedUrl, deleteFile } from '../../shared/utils/storage';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseQuery } from './expense.schemas';

const TAG = 'ExpenseService';

export class ExpenseService {
  async create(userId: string, input: CreateExpenseInput) {
    const date = new Date(input.expenseDate);
    const expense = await expenseRepository.create({
      user: { connect: { id: userId } },
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      description: input.description,
      expenseDate: date,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });

    await auditService.log({
      userId,
      action: 'EXPENSE_CREATED',
      entityType: 'Expense',
      entityId: expense.id,
      newValues: expense,
    });

    return expense;
  }

  async list(userId: string, query: ExpenseQuery) {
    const [expenses, total] = await expenseRepository.findMany(userId, query);
    return {
      expenses,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getOne(userId: string, id: string, role: string) {
    const expense = await expenseRepository.findById(id);
    if (!expense) throw new NotFoundError('Expense');
    if (expense.userId !== userId && role === 'EMPLOYEE') throw new ForbiddenError();
    return expense;
  }

  async update(userId: string, id: string, input: UpdateExpenseInput) {
    const expense = await expenseRepository.findById(id);
    if (!expense) throw new NotFoundError('Expense');
    if (expense.userId !== userId) throw new ForbiddenError();
    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new ValidationError('Only DRAFT expenses can be edited');
    }

    const updateData: Record<string, unknown> = { ...input };
    if (input.expenseDate) {
      const date = new Date(input.expenseDate);
      updateData.expenseDate = date;
      updateData.month = date.getMonth() + 1;
      updateData.year = date.getFullYear();
    }

    const updated = await expenseRepository.update(id, updateData);

    await auditService.log({
      userId,
      action: 'EXPENSE_UPDATED',
      entityType: 'Expense',
      entityId: id,
      oldValues: expense,
      newValues: updated,
    });

    return updated;
  }

  async delete(userId: string, id: string) {
    const expense = await expenseRepository.findById(id);
    if (!expense) throw new NotFoundError('Expense');
    if (expense.userId !== userId) throw new ForbiddenError();
    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new ValidationError('Only DRAFT expenses can be deleted');
    }

    // Remove stored files from MinIO
    await Promise.allSettled(expense.attachments.map((att) => deleteFile(att.storedPath)));

    await expenseRepository.delete(id);

    await auditService.log({
      userId,
      action: 'EXPENSE_DELETED',
      entityType: 'Expense',
      entityId: id,
      oldValues: expense,
    });
  }

  async addAttachment(userId: string, expenseId: string, file: Express.Multer.File) {
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense');
    if (expense.userId !== userId) throw new ForbiddenError();

    const ext = path.extname(file.originalname);
    const key = `receipts/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    await uploadFile(key, file.buffer, file.mimetype);

    const attachment = await expenseRepository.addAttachment({
      expense: { connect: { id: expenseId } },
      filename: file.originalname,
      storedPath: key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    await auditService.log({
      userId,
      action: 'ATTACHMENT_ADDED',
      entityType: 'Expense',
      entityId: expenseId,
      newValues: { attachmentId: attachment.id, filename: file.originalname },
    });

    return attachment;
  }

  async deleteAttachment(userId: string, expenseId: string, attachId: string, role: string) {
    const attachment = await expenseRepository.findAttachment(attachId);
    if (!attachment) throw new NotFoundError('Attachment');
    if (attachment.expenseId !== expenseId) throw new NotFoundError('Attachment');
    if (attachment.expense.userId !== userId && role === 'EMPLOYEE') throw new ForbiddenError();

    await deleteFile(attachment.storedPath);
    await expenseRepository.deleteAttachment(attachId);

    await auditService.log({
      userId,
      action: 'ATTACHMENT_DELETED',
      entityType: 'Expense',
      entityId: expenseId,
      oldValues: { attachmentId: attachId },
    });
  }

  async downloadAttachment(userId: string, expenseId: string, attachId: string, role: string) {
    const attachment = await expenseRepository.findAttachment(attachId);
    if (!attachment) throw new NotFoundError('Attachment');
    if (attachment.expenseId !== expenseId) throw new NotFoundError('Attachment');
    if (attachment.expense.userId !== userId && role === 'EMPLOYEE') throw new ForbiddenError();

    const url = await getPresignedUrl(attachment.storedPath);
    return { url, filename: attachment.filename, mimeType: attachment.mimeType };
  }
}

export const expenseService = new ExpenseService();
