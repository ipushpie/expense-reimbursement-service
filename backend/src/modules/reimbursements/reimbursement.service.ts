import { ExpenseStatus, ReimbursementStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { reimbursementRepository } from './reimbursement.repository';
import { auditService } from '../audit/audit.service';
import { convertAmount, getRate, toUSD } from '../../shared/utils/currency';
import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { SubmitReimbursementInput, RejectInput, ReimbursementQuery } from './reimbursement.schemas';

const TAG = 'ReimbursementService';

export class ReimbursementService {
  async submit(employeeId: string, employeeCurrency: string, departmentId: string | undefined, input: SubmitReimbursementInput) {
    // Validate all expenses belong to this employee and are DRAFT
    const expenses = await prisma.expense.findMany({
      where: { id: { in: input.expenseIds }, userId: employeeId },
    });

    if (expenses.length !== input.expenseIds.length) {
      throw new ValidationError('One or more expense IDs are invalid or do not belong to you');
    }

    const invalidStatuses = expenses.filter(
      (e) => e.status !== ExpenseStatus.DRAFT && e.status !== ExpenseStatus.SUBMITTED,
    );
    if (invalidStatuses.length > 0) {
      throw new ValidationError(`Expenses must be in DRAFT or SUBMITTED status: ${invalidStatuses.map((e) => e.id).join(', ')}`);
    }

    // Build items with currency conversion snapshot
    let totalUSD = 0;
    const items = expenses.map((e) => {
      const amountUSD = toUSD(Number(e.amount), e.currency);
      const exchangeRate = getRate(e.currency, 'USD');
      totalUSD += amountUSD;
      return {
        expenseId: e.id,
        originalAmount: Number(e.amount),
        originalCurrency: e.currency,
        amountUSD,
        exchangeRateToUSD: exchangeRate,
      };
    });

    // Budget warning check (soft — does not block)
    let budgetWarning = false;
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } });
      if (dept) {
        const approvedAgg = await reimbursementRepository.getApprovedTotalForDept(
          departmentId, input.month, input.year,
        );
        const approvedUSD = Number(approvedAgg._sum.totalAmountUSD ?? 0);
        const budgetUSD = toUSD(Number(dept.monthlyBudget), dept.currency);
        if (approvedUSD + totalUSD > budgetUSD) budgetWarning = true;
      }
    }

    // We store totals in USD + approver will see it in their own currency at review time
    const request = await reimbursementRepository.create({
      employee: { connect: { id: employeeId } },
      totalAmountUSD: totalUSD,
      approverCurrency: 'USD',           // updated when employer reviews
      totalInApproverCurrency: totalUSD, // same until employer reviews
      month: input.month,
      year: input.year,
      notes: input.notes,
      items: { create: items },
    });

    // Mark expenses as SUBMITTED
    await prisma.expense.updateMany({
      where: { id: { in: input.expenseIds } },
      data: { status: ExpenseStatus.SUBMITTED },
    });

    await auditService.log({
      userId: employeeId,
      action: 'REIMBURSEMENT_SUBMITTED',
      entityType: 'ReimbursementRequest',
      entityId: request.id,
      newValues: { totalAmountUSD: totalUSD, expenseCount: expenses.length },
    });

    return { request, budgetWarning };
  }

  async list(filters: ReimbursementQuery & { employeeId?: string; pendingForEmployer?: boolean }) {
    const [requests, total] = await reimbursementRepository.findMany({
      ...filters,
      status: filters.status as ReimbursementStatus | undefined,
    });
    return {
      requests,
      pagination: {
        total, page: filters.page, limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getOne(id: string, userId: string, role: string, userCurrency: string) {
    const request = await reimbursementRepository.findById(id);
    if (!request) throw new NotFoundError('Reimbursement request');
    if (request.employeeId !== userId && role === 'EMPLOYEE') throw new ForbiddenError();

    // Show total in viewer's currency
    const viewerTotal = convertAmount(Number(request.totalAmountUSD), 'USD', userCurrency);
    return { ...request, totalInViewerCurrency: viewerTotal, viewerCurrency: userCurrency };
  }

  async approve(approverId: string, approverCurrency: string, id: string) {
    const request = await reimbursementRepository.findById(id);
    if (!request) throw new NotFoundError('Reimbursement request');
    if (request.status !== ReimbursementStatus.PENDING) {
      throw new ValidationError(`Request is already ${request.status}`);
    }

    const totalInApproverCurrency = convertAmount(Number(request.totalAmountUSD), 'USD', approverCurrency);

    const updated = await reimbursementRepository.update(id, {
      status: ReimbursementStatus.APPROVED,
      approver: { connect: { id: approverId } },
      approverCurrency,
      totalInApproverCurrency,
      processedAt: new Date(),
    });

    // Mark included expenses as APPROVED
    const expenseIds = request.items.map((i) => i.expenseId);
    await prisma.expense.updateMany({
      where: { id: { in: expenseIds } },
      data: { status: ExpenseStatus.APPROVED },
    });

    await auditService.log({
      userId: approverId,
      action: 'REIMBURSEMENT_APPROVED',
      entityType: 'ReimbursementRequest',
      entityId: id,
      newValues: { approverCurrency, totalInApproverCurrency },
    });

    return updated;
  }

  async reject(approverId: string, id: string, input: RejectInput) {
    const request = await reimbursementRepository.findById(id);
    if (!request) throw new NotFoundError('Reimbursement request');
    if (request.status !== ReimbursementStatus.PENDING) {
      throw new ValidationError(`Request is already ${request.status}`);
    }

    const updated = await reimbursementRepository.update(id, {
      status: ReimbursementStatus.REJECTED,
      approver: { connect: { id: approverId } },
      rejectionReason: input.rejectionReason,
      processedAt: new Date(),
    });

    // Roll expenses back to SUBMITTED so employee can re-submit
    const expenseIds = request.items.map((i) => i.expenseId);
    await prisma.expense.updateMany({
      where: { id: { in: expenseIds } },
      data: { status: ExpenseStatus.SUBMITTED },
    });

    await auditService.log({
      userId: approverId,
      action: 'REIMBURSEMENT_REJECTED',
      entityType: 'ReimbursementRequest',
      entityId: id,
      newValues: { rejectionReason: input.rejectionReason },
    });

    return updated;
  }
}

export const reimbursementService = new ReimbursementService();
