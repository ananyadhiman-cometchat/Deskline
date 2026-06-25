/**
 * Comprehensive seed script for Docker containers.
 * ES module format — uses import syntax.
 * Idempotent: skips seeding if users already exist.
 *
 * Seeds: 105 users, 60 tickets, comments/communication threads, activity logs, notifications.
 * Designed to look like an active working application for demo purposes.
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set. Skipping seed.');
  process.exit(0);
}

// ── Realistic ticket data ──────────────────────────────────────────────

const TICKET_TEMPLATES = [
  // IT - Information
  { title: 'VPN setup instructions needed', desc: 'I need step-by-step instructions to configure the company VPN on my personal laptop for remote work.', cat: 'IT', sub: 'information', pri: 'low' },
  { title: 'How to reset 2FA on my account', desc: 'I lost my phone and need to know the process for resetting two-factor authentication.', cat: 'IT', sub: 'information', pri: 'medium' },
  { title: 'What software licenses do we have?', desc: 'Can you provide a list of all software licenses available for engineering team members?', cat: 'IT', sub: 'information', pri: 'low' },
  { title: 'Password policy clarification', desc: 'What are the current password requirements? I keep getting rejected when trying to set a new one.', cat: 'IT', sub: 'information', pri: 'low' },

  // IT - Action
  { title: 'New laptop setup for onboarding', desc: 'Starting Monday, need a MacBook Pro configured with standard dev tools, Slack, and email.', cat: 'IT', sub: 'action', pri: 'high' },
  { title: 'Grant access to production database', desc: 'Need read-only access to the analytics reporting database for Q3 planning.', cat: 'IT', sub: 'action', pri: 'medium' },
  { title: 'Install Adobe Creative Suite', desc: 'Marketing team needs Adobe CC installed on workstation #14 in the design room.', cat: 'IT', sub: 'action', pri: 'medium' },
  { title: 'Upgrade RAM on my workstation', desc: 'My machine is running slow with only 8GB. Please upgrade to 16GB.', cat: 'IT', sub: 'action', pri: 'low' },
  { title: 'Create email distribution list', desc: 'Need a new mailing list engineering-leads@company.com with 5 members.', cat: 'IT', sub: 'action', pri: 'low' },
  { title: 'Setup new printer on 4th floor', desc: 'The new HP LaserJet arrived. Please set it up and add it to the network.', cat: 'IT', sub: 'action', pri: 'medium' },

  // IT - Conversation
  { title: 'Recurring network drops in meeting room B', desc: 'WiFi keeps disconnecting during video calls. Happening 3-4 times daily for the past week. Need to discuss possible causes.', cat: 'IT', sub: 'conversation', pri: 'high' },
  { title: 'Discuss migration to new email provider', desc: 'We are evaluating switching from current email to Google Workspace. Need to discuss data migration plan.', cat: 'IT', sub: 'conversation', pri: 'medium' },

  // IT - Escalation
  { title: 'Critical data breach suspected', desc: 'Found unauthorized access logs in our monitoring system. Multiple accounts accessed from unknown IP at 3AM. Immediate investigation needed.', cat: 'IT', sub: 'escalation', pri: 'high' },
  { title: 'Production server down — all services affected', desc: 'Main API server is unresponsive. Customer-facing application is completely down. Multiple teams blocked.', cat: 'IT', sub: 'escalation', pri: 'high' },

  // HR - Information
  { title: 'Maternity leave policy details', desc: 'Planning ahead — what is the current maternity leave policy including duration and pay?', cat: 'HR', sub: 'information', pri: 'low' },
  { title: 'How many vacation days remaining?', desc: 'I need to check my remaining PTO balance for the year.', cat: 'HR', sub: 'information', pri: 'low' },
  { title: 'Benefits enrollment deadline', desc: 'When is the last day to make changes to my health insurance for this year?', cat: 'HR', sub: 'information', pri: 'medium' },
  { title: 'Remote work policy update', desc: 'Has the hybrid work policy changed for Q3? I heard rumors about mandatory office days.', cat: 'HR', sub: 'information', pri: 'low' },

  // HR - Action
  { title: 'Update my emergency contact info', desc: 'Need to change my emergency contact from my ex-spouse to my sister. New details attached.', cat: 'HR', sub: 'action', pri: 'low' },
  { title: 'Request salary certificate for visa', desc: 'I need an official salary certificate for my visa renewal application. Deadline is next Friday.', cat: 'HR', sub: 'action', pri: 'high' },
  { title: 'Add new dependent to insurance', desc: 'Had a baby last week! Need to add them to my health insurance plan.', cat: 'HR', sub: 'action', pri: 'medium' },
  { title: 'Request transfer to London office', desc: 'I would like to explore transferring to the London office. Please initiate the process.', cat: 'HR', sub: 'action', pri: 'medium' },

  // HR - Conversation
  { title: 'Discuss performance review concerns', desc: 'I disagree with some points in my mid-year review. Would like to discuss with HR before signing.', cat: 'HR', sub: 'conversation', pri: 'medium' },
  { title: 'Workplace conflict with team member', desc: 'Having ongoing interpersonal issues with a colleague that are affecting my work. Need confidential guidance.', cat: 'HR', sub: 'conversation', pri: 'high' },

  // HR - Escalation
  { title: 'Payroll error — significantly underpaid', desc: 'My last paycheck was $2,000 short. This is the second consecutive month with errors. Need immediate correction.', cat: 'HR', sub: 'escalation', pri: 'high' },
  { title: 'Harassment complaint', desc: 'I need to report inappropriate behavior from a manager. This is confidential and urgent.', cat: 'HR', sub: 'escalation', pri: 'high' },

  // General - Information
  { title: 'Office holiday schedule for December', desc: 'What days is the office closed during the holiday season?', cat: 'General', sub: 'information', pri: 'low' },
  { title: 'Parking policy for new building', desc: 'We moved to the new building. How does parking allocation work?', cat: 'General', sub: 'information', pri: 'low' },

  // General - Action
  { title: 'Building access card replacement', desc: 'Lost my access card yesterday. Need a replacement ASAP — currently borrowing a visitor pass.', cat: 'General', sub: 'action', pri: 'medium' },
  { title: 'Book conference room for all-hands', desc: 'Need the large conference room (capacity 50) reserved for Thursday 2-4PM for quarterly all-hands.', cat: 'General', sub: 'action', pri: 'medium' },
  { title: 'Broken AC in open office area', desc: 'The air conditioning on the 3rd floor has been out for 2 days. Temperature is unbearable.', cat: 'General', sub: 'action', pri: 'high' },
  { title: 'Order ergonomic standing desk', desc: 'Doctor recommended a standing desk for my back. Please order one for my workstation.', cat: 'General', sub: 'action', pri: 'low' },
  { title: 'Fix broken window latch in room 201', desc: 'Window in meeting room 201 will not close properly. Security concern at night.', cat: 'General', sub: 'action', pri: 'medium' },

  // General - Conversation
  { title: 'Discuss office relocation timeline', desc: 'Our team needs more details about the upcoming office move. Several concerns about commute and logistics.', cat: 'General', sub: 'conversation', pri: 'medium' },

  // General - Escalation
  { title: 'Water leak damaging server room', desc: 'There is water dripping from the ceiling directly above the server rack in room B2. Immediate facilities response needed.', cat: 'General', sub: 'escalation', pri: 'high' },
];

const STATUSES = ['open', 'in_progress', 'escalated', 'resolved', 'closed'];

// Realistic comment threads per ticket
const COMMENT_THREADS = [
  [
    { body: 'Hi, I have submitted this ticket. Please let me know if you need any additional information.', isAi: false, fromEmployee: true },
    { body: 'Thank you for reaching out. I have reviewed your request and I am looking into it now. Will update you shortly.', isAi: false, fromEmployee: false },
    { body: 'I have completed the requested action. Please verify on your end and let me know if everything is working correctly.', isAi: false, fromEmployee: false },
    { body: 'Confirmed, everything looks good. Thank you for the quick resolution!', isAi: false, fromEmployee: true },
  ],
  [
    { body: 'This is urgent — please prioritize.', isAi: false, fromEmployee: true },
    { body: 'Understood. I am escalating this to get faster resolution. A senior team member will take over.', isAi: false, fromEmployee: false },
  ],
  [
    { body: 'Based on our internal knowledge base, here is what I found:\n\n1. Navigate to Settings > Security > 2FA\n2. Click "Reset 2FA"\n3. Follow the email verification steps\n4. Set up a new authenticator app\n\nIf you need further assistance, please request human help.', isAi: true, fromEmployee: false },
    { body: 'Thanks, that worked perfectly!', isAi: false, fromEmployee: true },
  ],
  [
    { body: 'Could you provide more details about the issue? When did it start happening?', isAi: false, fromEmployee: false },
    { body: 'It started last Monday after the system update. Happens every time I try to connect to the VPN.', isAi: false, fromEmployee: true },
    { body: 'I see. The update changed some network configurations. I have applied a fix to your account. Please try reconnecting now.', isAi: false, fromEmployee: false },
    { body: 'Still not working. Getting error code VPN-403.', isAi: false, fromEmployee: true },
    { body: 'That specific error means your certificate expired. I have renewed it. Please restart your machine and try again.', isAi: false, fromEmployee: false },
    { body: 'Works now! Thank you for your patience.', isAi: false, fromEmployee: true },
  ],
  [
    { body: 'Based on our company policy documentation:\n\n**Remote Work Policy (Updated Q2 2026)**\n- All employees eligible for 2 remote days per week\n- Core hours: 10AM-4PM in office days\n- Manager approval required for full remote weeks\n\nPlease request human help if you need specific department exceptions.', isAi: true, fromEmployee: false },
  ],
  [
    { body: 'I have reviewed the situation and assigned this to our senior technician. They will reach out within the hour.', isAi: false, fromEmployee: false },
    { body: 'The senior tech visited and identified the root cause. Parts have been ordered and repair is scheduled for tomorrow morning.', isAi: false, fromEmployee: false },
    { body: 'Repair completed. Please confirm the issue is resolved.', isAi: false, fromEmployee: false },
  ],
];

// Activity log actions
const ACTIVITY_ACTIONS = [
  'ticket_created', 'ticket_assigned', 'ticket_claimed', 'status_updated',
  'ticket_escalated', 'ticket_resolved', 'ai_reply_sent', 'human_help_requested',
  'resolution_confirmed', 'notification_sent', 'login', 'logout',
];

// ── Helper functions ───────────────────────────────────────────────────

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomInt(8, 18), randomInt(0, 59), randomInt(0, 59));
  return d.toISOString();
}

// ── Main seed function ─────────────────────────────────────────────────

async function seed() {
  const pool = new Pool({ connectionString });

  // Check if already seeded
  const existing = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(existing.rows[0].count, 10) > 0) {
    console.log(`Database already has ${existing.rows[0].count} users. Skipping seed.`);
    await pool.end();
    return;
  }

  console.log('Seeding database with realistic data...');
  const hash = bcrypt.hashSync('Password123!', 10);
  const departments = ['IT', 'HR', 'General'];

  // ─── Create Users ────────────────────────────────────────────
  const userDefs = [];
  for (let i = 1; i <= 2; i++) userDefs.push({ name: `Admin ${i}`, email: `admin${i}@deskline.local`, role: 'admin', dept: 'General' });
  for (let i = 1; i <= 3; i++) userDefs.push({ name: `Supervisor ${i}`, email: `supervisor${i}@deskline.local`, role: 'supervisor', dept: departments[i % 3] });
  for (let i = 1; i <= 5; i++) userDefs.push({ name: `Agent ${i}`, email: `agent${i}@deskline.local`, role: 'agent', dept: departments[i % 3] });
  for (let i = 1; i <= 60; i++) userDefs.push({ name: `Employee ${i}`, email: `employee${i}@deskline.local`, role: 'employee', dept: departments[i % 3] });

  for (const u of userDefs) {
    const loginDays = randomInt(0, 30);
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, department, is_active, last_login_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4::"UserRole", $5::"Department", true, $6, $7, NOW())
       ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, hash, u.role, u.dept, daysAgo(loginDays), daysAgo(randomInt(60, 180))]
    );
  }

  // Fetch all users
  const allUsers = (await pool.query('SELECT id, role, department, name FROM users ORDER BY created_at')).rows;
  const employees = allUsers.filter(u => u.role === 'employee');
  const agents = allUsers.filter(u => u.role === 'agent');
  const supervisors = allUsers.filter(u => u.role === 'supervisor');
  const admins = allUsers.filter(u => u.role === 'admin');

  console.log(`  Users: ${allUsers.length} (${employees.length} employees, ${agents.length} agents, ${supervisors.length} supervisors, ${admins.length} admins)`);

  // ─── Create Tickets ──────────────────────────────────────────
  const ticketIds = [];

  for (let i = 0; i < TICKET_TEMPLATES.length; i++) {
    const tmpl = TICKET_TEMPLATES[i];
    const employee = employees[i % employees.length];

    // Assign agent based on subtype and department
    let assignedAgent = null;
    const deptAgents = agents.filter(a => a.department === tmpl.cat);
    const deptSupervisors = supervisors.filter(s => s.department === tmpl.cat || s.department === 'General');

    if (tmpl.sub === 'escalation') {
      assignedAgent = deptSupervisors.length > 0 ? randomFrom(deptSupervisors) : randomFrom(supervisors);
    } else {
      assignedAgent = deptAgents.length > 0 ? randomFrom(deptAgents) : randomFrom(agents);
    }

    // Determine status based on ticket age
    const statusIdx = i % STATUSES.length;
    const status = STATUSES[statusIdx];
    const createdDays = randomInt(1, 45);
    const createdAt = daysAgo(createdDays);
    const resolvedAt = (status === 'resolved' || status === 'closed') ? daysAgo(randomInt(0, createdDays - 1)) : null;
    const closedAt = status === 'closed' ? daysAgo(randomInt(0, Math.max(0, createdDays - 2))) : null;

    const result = await pool.query(
      `INSERT INTO tickets (id, title, description, category, sub_type, priority, status, employee_id, agent_id, last_activity_at, resolved_at, closed_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3::"TicketCategory", $4::"TicketSubType", $5::"TicketPriority", $6::"TicketStatus", $7, $8, $9, $10, $11, $12, NOW())
       RETURNING id`,
      [tmpl.title, tmpl.desc, tmpl.cat, tmpl.sub, tmpl.pri, status, employee.id, assignedAgent?.id || null, daysAgo(randomInt(0, createdDays)), resolvedAt, closedAt, createdAt]
    );
    ticketIds.push({ id: result.rows[0].id, employee, agent: assignedAgent, status, sub: tmpl.sub, cat: tmpl.cat });
  }

  // Add more tickets to reach 60 total
  for (let i = TICKET_TEMPLATES.length; i < 60; i++) {
    const tmpl = TICKET_TEMPLATES[i % TICKET_TEMPLATES.length];
    const employee = employees[i % employees.length];
    const deptAgents = agents.filter(a => a.department === tmpl.cat);
    const assignedAgent = deptAgents.length > 0 ? randomFrom(deptAgents) : randomFrom(agents);
    const status = STATUSES[i % STATUSES.length];
    const createdDays = randomInt(1, 30);

    const result = await pool.query(
      `INSERT INTO tickets (id, title, description, category, sub_type, priority, status, employee_id, agent_id, last_activity_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3::"TicketCategory", $4::"TicketSubType", $5::"TicketPriority", $6::"TicketStatus", $7, $8, $9, $10, NOW())
       RETURNING id`,
      [`${tmpl.title} (${i + 1})`, tmpl.desc, tmpl.cat, tmpl.sub, tmpl.pri, status, employee.id, assignedAgent.id, daysAgo(randomInt(0, createdDays)), daysAgo(createdDays)]
    );
    ticketIds.push({ id: result.rows[0].id, employee, agent: assignedAgent, status, sub: tmpl.sub, cat: tmpl.cat });
  }

  console.log(`  Tickets: ${ticketIds.length}`);

  // ─── Create Comments (Communication Threads) ────────────────
  let commentCount = 0;
  for (let i = 0; i < ticketIds.length; i++) {
    const ticket = ticketIds[i];
    const thread = COMMENT_THREADS[i % COMMENT_THREADS.length];

    for (let j = 0; j < thread.length; j++) {
      const comment = thread[j];
      const userId = comment.fromEmployee ? ticket.employee.id : (ticket.agent?.id || ticket.employee.id);
      const commentDays = randomInt(0, 20);

      await pool.query(
        `INSERT INTO ticket_comments (id, ticket_id, user_id, body, is_ai, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
        [ticket.id, userId, comment.body, comment.isAi, daysAgo(commentDays)]
      );
      commentCount++;
    }
  }
  console.log(`  Comments: ${commentCount}`);

  // ─── Create Activity Logs ───────────────────────────────────
  let logCount = 0;

  for (const ticket of ticketIds) {
    // ticket_created
    await pool.query(
      `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES (gen_random_uuid(), $1, 'ticket_created', 'ticket', $2, $3, $4)`,
      [ticket.employee.id, ticket.id, JSON.stringify({ category: ticket.cat, subType: ticket.sub }), daysAgo(randomInt(5, 40))]
    );
    logCount++;

    // ticket_assigned (if agent exists)
    if (ticket.agent) {
      await pool.query(
        `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'ticket_assigned', 'ticket', $2, $3, $4)`,
        [ticket.agent.id, ticket.id, JSON.stringify({ assignedToId: ticket.agent.id, department: ticket.cat }), daysAgo(randomInt(3, 35))]
      );
      logCount++;
    }

    // status_updated
    if (ticket.status !== 'open') {
      await pool.query(
        `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'status_updated', 'ticket', $2, $3, $4)`,
        [ticket.agent?.id || ticket.employee.id, ticket.id, JSON.stringify({ oldStatus: 'open', newStatus: ticket.status }), daysAgo(randomInt(1, 25))]
      );
      logCount++;
    }

    // ticket_resolved
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      await pool.query(
        `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'ticket_resolved', 'ticket', $2, $3, $4)`,
        [ticket.agent?.id || ticket.employee.id, ticket.id, JSON.stringify({ resolvedBy: ticket.agent?.name || 'System' }), daysAgo(randomInt(0, 15))]
      );
      logCount++;
    }

    // ticket_escalated
    if (ticket.status === 'escalated') {
      await pool.query(
        `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'ticket_escalated', 'ticket', $2, $3, $4)`,
        [ticket.agent?.id || ticket.employee.id, ticket.id, JSON.stringify({ reason: 'Requires supervisor attention' }), daysAgo(randomInt(0, 10))]
      );
      logCount++;
    }

    // ai_reply_sent for information tickets
    if (ticket.sub === 'information') {
      await pool.query(
        `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'ai_reply_sent', 'ticket', $2, $3, $4)`,
        [ticket.employee.id, ticket.id, JSON.stringify({ subType: 'information' }), daysAgo(randomInt(1, 30))]
      );
      logCount++;
    }
  }

  // Login/logout activity for various users
  for (let i = 0; i < 40; i++) {
    const user = randomFrom(allUsers);
    await pool.query(
      `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'user', $1, $3, $4)`,
      [user.id, i % 3 === 0 ? 'logout' : 'login', JSON.stringify({ role: user.role, department: user.department }), daysAgo(randomInt(0, 14))]
    );
    logCount++;
  }

  // User management actions by admins
  for (let i = 0; i < 10; i++) {
    const admin = randomFrom(admins);
    const target = randomFrom(employees);
    const actions = ['user_created', 'user_updated', 'role_changed'];
    await pool.query(
      `INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'user', $3, $4, $5)`,
      [admin.id, randomFrom(actions), target.id, JSON.stringify({ name: target.name, performedBy: admin.name }), daysAgo(randomInt(5, 60))]
    );
    logCount++;
  }

  console.log(`  Activity Logs: ${logCount}`);

  // ─── Create Notifications ──────────────────────────────────
  let notifCount = 0;
  const notifTypes = ['ticket_update', 'assignment', 'escalation', 'announcement'];

  // Ticket-related notifications
  for (const ticket of ticketIds) {
    // Notification to employee about ticket status
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
       VALUES (gen_random_uuid(), $1, $2::"NotificationType", $3, $4, $5, $6)`,
      [ticket.employee.id, 'ticket_update', `Ticket update: ${ticket.status}`, `Your ticket has been updated to ${ticket.status.replace('_', ' ')}.`, Math.random() > 0.4, daysAgo(randomInt(0, 20))]
    );
    notifCount++;

    // Assignment notification to agent
    if (ticket.agent) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
         VALUES (gen_random_uuid(), $1, $2::"NotificationType", $3, $4, $5, $6)`,
        [ticket.agent.id, 'assignment', 'New ticket assigned to you', `You have been assigned a new ${ticket.cat} ticket: "${ticketIds.indexOf(ticket) < TICKET_TEMPLATES.length ? TICKET_TEMPLATES[ticketIds.indexOf(ticket) % TICKET_TEMPLATES.length].title : 'Support request'}"`, Math.random() > 0.3, daysAgo(randomInt(0, 15))]
      );
      notifCount++;
    }

    // Escalation notification to supervisors
    if (ticket.status === 'escalated') {
      const supervisor = randomFrom(supervisors);
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
         VALUES (gen_random_uuid(), $1, $2::"NotificationType", $3, $4, $5, $6)`,
        [supervisor.id, 'escalation', 'Ticket escalated to you', `A ticket has been escalated and requires your immediate attention.`, Math.random() > 0.5, daysAgo(randomInt(0, 10))]
      );
      notifCount++;
    }
  }

  // System announcements
  const announcements = [
    { title: 'Scheduled Maintenance — Saturday', body: 'Systems will be down for maintenance this Saturday from 2AM to 6AM.' },
    { title: 'New Office Policy Update', body: 'Please review the updated hybrid work policy effective next month.' },
    { title: 'Welcome New Team Members', body: '5 new team members joined this week. Say hello!' },
    { title: 'Q3 All-Hands Meeting', body: 'Quarterly all-hands scheduled for Friday at 3PM in the main conference room.' },
  ];

  for (const ann of announcements) {
    // Send to a sample of users
    const recipients = allUsers.slice(0, 30);
    for (const user of recipients) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
         VALUES (gen_random_uuid(), $1, 'announcement'::"NotificationType", $2, $3, $4, $5)`,
        [user.id, ann.title, ann.body, Math.random() > 0.5, daysAgo(randomInt(1, 30))]
      );
      notifCount++;
    }
  }

  console.log(`  Notifications: ${notifCount}`);

  // ─── Summary ────────────────────────────────────────────────
  const counts = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM tickets) as tickets,
      (SELECT COUNT(*) FROM ticket_comments) as comments,
      (SELECT COUNT(*) FROM activity_logs) as activity_logs,
      (SELECT COUNT(*) FROM notifications) as notifications
  `);

  console.log('\nSeed completed successfully!');
  console.log('Final counts:', counts.rows[0]);
  console.log('\nLogin credentials for all users: Password123!');
  console.log('Email pattern: {role}{number}@deskline.local');
  console.log('Examples: employee1@deskline.local, agent1@deskline.local, supervisor1@deskline.local, admin1@deskline.local');

  // ─── CometChat Sync ────────────────────────────────────────────────
  const appId = process.env.COMETCHAT_APP_ID;
  const region = process.env.COMETCHAT_REGION;
  const apiKey = process.env.COMETCHAT_REST_API_KEY;

  if (appId && region && apiKey) {
    console.log('\nSyncing users to CometChat...');
    try {
      const usersToSync = allUsers.map(u => ({
        uid: u.id,
        name: u.name,
        tags: [`role:${u.role}`, `dept:${u.department}`]
      }));

      // CometChat does not support bulk array POST to /users. Create them individually with a concurrency of 10.
      let successCount = 0;
      for (let i = 0; i < usersToSync.length; i += 10) {
        const chunk = usersToSync.slice(i, i + 10);
        await Promise.all(chunk.map(async (u) => {
          try {
            const response = await fetch(`https://${appId}.api-${region}.cometchat.io/v3/users`, {
              method: 'POST',
              headers: {
                'apiKey': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(u)
            });

            if (response.ok || response.status === 409) {
              successCount++;
            } else {
              const errData = await response.json().catch(() => ({}));
              console.error(`[CometChat Sync] Failed to sync user ${u.uid}:`, errData);
            }
          } catch (e) {
            console.error(`[CometChat Sync] Request failed for ${u.uid}:`, e.message);
          }
        }));
      }

      // Update the database to set cometchat_uid
      await pool.query('UPDATE users SET cometchat_uid = id WHERE cometchat_uid IS NULL');
      console.log(`  CometChat Sync: ${successCount} users synced and database updated.`);
    } catch (e) {
      console.error('[CometChat Sync] Error during sync:', e.message);
    }
  } else {
    console.warn('\nCometChat credentials missing, skipping sync.');
  }

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
