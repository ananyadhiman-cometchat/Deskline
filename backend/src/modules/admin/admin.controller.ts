import { prisma } from '../../lib/prisma.js';
import { listActivityLogs } from '../activity-logs/activity-logs.service.js';
import { createNotificationRecord } from '../notifications/notifications.service.js';

export async function activityLogsController(req:any,res:any){
res.json(await listActivityLogs({
page:Number(req.query.page)||1,
pageSize:Number(req.query.pageSize)||20,
userId:req.query.userId,
action:req.query.action,
entityType:req.query.entityType,
from:req.query.from,
to:req.query.to
}));}
export async function notificationLogsController(req:any,res:any){
const page=Number(req.query.page)||1;
const pageSize=Number(req.query.pageSize)||20;
const where={
...(req.query.type?{type:req.query.type}:{}),
...(req.query.isRead!==undefined?{isRead:req.query.isRead==='true'}:{}),
...((req.query.from||req.query.to)?{createdAt:{...(req.query.from?{gte:new Date(req.query.from)}:{}),...(req.query.to?{lte:new Date(req.query.to)}:{})}}:{})
};
const [data,total]=await Promise.all([
prisma.notification.findMany({where,orderBy:{createdAt:'desc'},skip:(page-1)*pageSize,take:pageSize}),
prisma.notification.count({where})
]);
res.json({data,meta:{total,page,pageSize,totalPages:Math.ceil(total/pageSize)||1}});}
export async function dashboardController(_req:any,res:any){
const [users,tickets,notifications,userRoles,ticketStatuses,unreadNotifications,ticketsByDepartment,ticketsByPriority,resolvedToday]=await Promise.all([
prisma.user.count(),
prisma.ticket.count(),
prisma.notification.count(),
prisma.user.groupBy({by:['role'],_count:{role:true}}),
prisma.ticket.groupBy({by:['status'],_count:{status:true}}),
prisma.notification.count({where:{isRead:false}}),
prisma.ticket.groupBy({by:['category'],_count:{category:true}}),
prisma.ticket.groupBy({by:['priority'],_count:{priority:true}}),
prisma.ticket.count({where:{status:'resolved'}})
]);
res.json({data:{totals:{users,tickets,notifications,unreadNotifications,resolvedToday},usersByRole:userRoles,ticketsByStatus:ticketStatuses,ticketsByDepartment,ticketsByPriority}});
}
export async function agentLoadController(_req:any,res:any){
const data=await prisma.user.findMany({where:{role:'agent'},select:{id:true,name:true,department:true,isActive:true,_count:{select:{assignedTickets:true}}}});
res.json({data,meta:{total:data.length}});
}
export async function announcementController(req:any,res:any){
const users=await prisma.user.findMany({where:req.body.targetRole&&req.body.targetRole!=='all'?{role:req.body.targetRole}:{}});
for(const user of users){await createNotificationRecord({actorId:req.user.id,userId:user.id,type:'announcement',title:req.body.title,body:req.body.body});}
res.json({data:{recipientCount:users.length}});
}