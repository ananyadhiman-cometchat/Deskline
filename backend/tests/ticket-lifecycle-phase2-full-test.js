const BASE = 'http://localhost:4000/api';

const EMPLOYEE = { email: 'employee1@deskline.local', password: 'Password123!' };
const AGENT = { email: 'agent1@deskline.local', password: 'Password123!' };
const SUPERVISOR = { email: 'supervisor1@deskline.local', password: 'Password123!' };

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function login(credentials) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  console.log('\nLOGIN RESULT');
  console.log(credentials.email);
  console.log(JSON.stringify(result, null, 2));

  return result.body?.data?.accessToken || result.body?.accessToken;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

(async () => {
  const employeeToken = await login(EMPLOYEE);
  const agentToken = await login(AGENT);
  const supervisorToken = await login(SUPERVISOR);

  assert(employeeToken, 'Employee login');
  assert(agentToken, 'Agent login');
  assert(supervisorToken, 'Supervisor login');

  const create = await request('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({
      title: 'Phase2 Lifecycle Test',
      description: 'End to end lifecycle validation',
      category: 'HR',
      subType: 'information',
      priority: 'low'
    })
  });

  console.log('\nCREATE TICKET RESPONSE');
  console.log(JSON.stringify(create, null, 2));

  const ticketId = create.body?.data?.id;
  assert(ticketId, 'Information ticket created');

  const humanHelp = await request(`/tickets/${ticketId}/request-human-help`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` }
  });

  assert(humanHelp.body?.data?.status === 'in_progress', 'Human help requested');

  const getUserId = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub;
  const agentId = getUserId(agentToken);
  const supervisorId = getUserId(supervisorToken);

  await request(`/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: JSON.stringify({ agentId, status: 'in_progress' })
  });

  const resolve = await request(`/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ status: 'resolved' })
  });

  if (resolve.body?.data?.status !== 'resolved') {
    console.log('RESOLVE FAILED:', JSON.stringify(resolve, null, 2));
  }
  assert(resolve.body?.data?.status === 'resolved', 'Agent resolved ticket');

  const reject = await request(`/tickets/${ticketId}/reject-resolution`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` }
  });

  assert(['open', 'in_progress'].includes(reject.body?.data?.status), 'Employee reopened ticket');

  await request(`/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ status: 'resolved' })
  });

  const confirm = await request(`/tickets/${ticketId}/confirm-resolution`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` }
  });

  assert(confirm.body?.data?.status === 'closed', 'Employee confirmed resolution');

  const escalationCreate = await request('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({
      title: 'Escalation Test',
      description: 'Supervisor ownership validation',
      category: 'HR',
      subType: 'action',
      priority: 'high'
    })
  });

  const escalationId = escalationCreate.body?.data?.id;
  assert(escalationId, 'Escalation ticket created');

  await request(`/tickets/${escalationId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: JSON.stringify({ agentId, status: 'open' })
  });

  await request(`/tickets/${escalationId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ status: 'in_progress' })
  });

  const escalated = await request(`/tickets/${escalationId}/escalate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${agentToken}` }
  });

  assert(escalated.body?.data?.status === 'escalated', 'Ticket escalated');

  await request(`/tickets/${escalationId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: JSON.stringify({ agentId: supervisorId, status: 'escalated' })
  });

  const agentBlocked = await request(`/tickets/${escalationId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${agentToken}` },
    body: JSON.stringify({ status: 'resolved' })
  });

  assert(agentBlocked.status === 403, 'Original agent blocked');

  const supervisorResolve = await request(`/tickets/${escalationId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${supervisorToken}` },
    body: JSON.stringify({ status: 'resolved' })
  });

  assert(supervisorResolve.status === 200, 'Supervisor owns escalated ticket');

  console.log('\n🎉 FULL LIFECYCLE TEST PASSED');
})().catch((error) => {
  console.error('\n❌ TEST FAILED');
  console.error(error);
  process.exit(1);
});
