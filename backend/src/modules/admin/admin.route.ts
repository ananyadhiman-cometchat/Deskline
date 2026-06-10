import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticateRequest, requirePermission } from '../../middleware/auth.js';
import { activityLogsController, announcementController, dashboardController, agentLoadController, notificationLogsController } from './admin.controller.js';

export const adminRouter=Router();
adminRouter.use(authenticateRequest);
adminRouter.get('/activity-logs',requirePermission('logs:view'),asyncHandler(activityLogsController));
adminRouter.get('/notification-logs',requirePermission('logs:view'),asyncHandler(notificationLogsController));
adminRouter.get('/dashboard',requirePermission('dashboard:view'),asyncHandler(dashboardController));
adminRouter.get('/agent-load',requirePermission('dashboard:view'),asyncHandler(agentLoadController));
adminRouter.post('/announcements',requirePermission('announcements:send'),asyncHandler(announcementController));