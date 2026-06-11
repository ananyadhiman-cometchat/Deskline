import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticateRequest, requirePermission } from '../../middleware/auth.js';
import { activityLogsController, announcementController, dashboardController, agentLoadController, notificationLogsController } from './admin.controller.js';
import { requireRole } from '../../middleware/auth.js';
import { escalationQueueController, supervisorDashboardController, agentMetricsController } from './supervisor.controller.js';

export const adminRouter=Router();
adminRouter.use(authenticateRequest);
adminRouter.get('/activity-logs',requirePermission('logs:view'),asyncHandler(activityLogsController));
adminRouter.get('/notification-logs',requirePermission('logs:view'),asyncHandler(notificationLogsController));
adminRouter.get('/dashboard',requirePermission('dashboard:view'),asyncHandler(dashboardController));
adminRouter.get('/agent-load',requireRole('supervisor','admin'),asyncHandler(agentLoadController));
adminRouter.post('/announcements',requirePermission('announcements:send'),asyncHandler(announcementController));
adminRouter.get('/supervisor/escalations',requireRole('supervisor','admin'),asyncHandler(escalationQueueController));
adminRouter.get('/supervisor/dashboard',requireRole('supervisor','admin'),asyncHandler(supervisorDashboardController));
adminRouter.get('/agent/metrics',requireRole('agent','admin'),asyncHandler(agentMetricsController));