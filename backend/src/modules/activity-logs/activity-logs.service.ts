import { prisma } from '../../lib/prisma.js';

type ActivityMetadata = Record<string, unknown>;

export async function recordActivityLog(input: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: ActivityMetadata;
}) {
  return prisma.activityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {}
    }
  });
}
export function activityLogsService() {
  return {
    name: 'activity-logs-service-placeholder'
  };
}
