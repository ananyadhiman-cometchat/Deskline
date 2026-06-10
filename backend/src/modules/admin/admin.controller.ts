import { prisma } from '../../lib/prisma.js';
import { listActivityLogs } from '../activity-logs/activity-logs.service.js';
import { createNotificationRecord } from '../notifications/notifications.service.js';

export async function activityLogsController(_req:any,res:any){res.json(await listActivityLogs());}
export async function notificationLogsController(_req:any,res:any){const data=await prisma.notification.findMany({orderBy:{createdAt:'desc'}});res.json({data,meta:{total:data.length}});}
export async function dashboardController(_req:any,res:any){
const [users,tickets,notifications]=await Promise.all([prisma.user.count(),prisma.ticket.count(),prisma.notification.count()]);
res.json({data:{users,tickets,notifications}});
}
export async function agentLoadController(_req:any,res:any){
const data=await prisma.user.findMany({where:{role:'agent'},select:{id:true,name:true,_count:{select:{assignedTickets:true}}}});
res.json({data});
}
export async function announcementController(req:any,res:any){
const users=await prisma.user.findMany({where:req.body.targetRole&&req.body.targetRole!=='all'?{role:req.body.targetRole}:{}});
for(const user of users){await createNotificationRecord({actorId:req.user.id,userId:user.id,type:'announcement',title:req.body.title,body:req.body.body});}
res.json({data:{recipientCount:users.length}});
}