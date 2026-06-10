import { prisma } from '../../lib/prisma.js';

export async function escalationQueueController(_req:any,res:any){
 const data=await prisma.ticket.findMany({where:{subType:'escalation',OR:[{status:'open'},{status:'escalated'}]},orderBy:{createdAt:'desc'}});
 res.json({data,meta:{total:data.length}});
}

export async function supervisorDashboardController(req:any,res:any){
 const department=req.user.department;
 const [openEscalations,unassignedTickets,resolvedToday,agents]=await Promise.all([
 prisma.ticket.count({where:{subType:'escalation',OR:[{status:'open'},{status:'escalated'}]}}),
 prisma.ticket.count({where:{agentId:null}}),
 prisma.ticket.count({where:{status:'resolved'}}),
 prisma.user.count({where:{role:'agent',department}})
 ]);
 res.json({data:{openEscalations,unassignedTickets,resolvedToday,agents,department}});
}

export async function agentMetricsController(req:any,res:any){
 const agentId=req.user.id;
 const [assigned,resolved,escalated,inProgress]=await Promise.all([
 prisma.ticket.count({where:{agentId}}),
 prisma.ticket.count({where:{agentId,status:'resolved'}}),
 prisma.ticket.count({where:{agentId,status:'escalated'}}),
 prisma.ticket.count({where:{agentId,status:'in_progress'}})
 ]);
 res.json({data:{assigned,resolved,escalated,inProgress,resolutionRate:assigned?Number(((resolved/assigned)*100).toFixed(2)):0}});
}