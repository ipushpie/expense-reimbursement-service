import { auditRepository } from './audit.repository';
import { logger } from '../../shared/utils/logger';

interface LogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: object;
  newValues?: object;
  ipAddress?: string;
}

const TAG = 'AuditService';

export const auditService = {
  async log(input: LogInput): Promise<void> {
    try {
      const isExpense = input.entityType === 'Expense';
      await auditRepository.create({
        user: { connect: { id: input.userId } },
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues ?? undefined,
        newValues: input.newValues ?? undefined,
        ipAddress: input.ipAddress ?? null,
        ...(isExpense && { expense: { connect: { id: input.entityId } } }),
        ...(!isExpense && input.entityType === 'ReimbursementRequest' && {
          reimbursementRequest: { connect: { id: input.entityId } },
        }),
      });
    } catch (err) {
      // Audit failures must not break the main flow
      logger.error({ err, TAG }, 'Failed to write audit log');
    }
  },
};
