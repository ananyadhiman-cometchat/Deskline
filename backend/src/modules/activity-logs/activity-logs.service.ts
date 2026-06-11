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
      metadata: (input.metadata ?? {}) as any
    }
  });
}
export function activityLogsService() {
  return {
    name: 'activity-logs-service-placeholder'
  };
}

export async function listActivityLogs(filters?: {page?:number;pageSize?:number;userId?:string;action?:string;entityType?:string;from?:string;to?:string;}) {
  const page=filters?.page ?? 1;
  const pageSize=filters?.pageSize ?? 20;
  const where:any={
    ...(filters?.userId?{userId:filters.userId}:{}),
    ...(filters?.action?{action:filters.action}:{}),
    ...(filters?.entityType?{entityType:filters.entityType}:{}),
    ...((filters?.from || filters?.to)?{createdAt:{...(filters?.from?{gte:new Date(filters.from)}:{}),...(filters?.to?{lte:new Date(filters.to)}:{})}}:{})
  };
  const [data,total] = await Promise.all([
    prisma.activityLog.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*pageSize,take:pageSize}),
    prisma.activityLog.count({where})
  ]);
  return { data, meta:{ total,page,pageSize,totalPages:Math.ceil(total/pageSize)||1 } };
}
