import axios from 'axios';

const appId = '266392097ca1fc55';
const region = 'us';
const apiKey = '0e26127163f91ba4cdbcba5256e729a6b10702ca';

const guid = 'test-group-' + Date.now();

async function run() {
  const http = axios.create({
    baseURL: `https://${appId}.api-${region}.cometchat.io/v3`,
    headers: {
      apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  console.log('1. Creating group', guid);
  await http.post('/groups', {
    guid,
    name: 'Test Group',
    type: 'private'
  });

  console.log('2. Adding 3 members');
  await http.post(`/groups/${guid}/members`, {
    participants: ['employee-1', 'agent-1', 'supervisor-1']
  });

  let res = await http.get(`/groups/${guid}/members`);
  console.log('Members after add 3:', res.data.data.map(m => m.uid).join(', '));

  console.log('3. Adding supervisor again (as admin)');
  await http.post(`/groups/${guid}/members`, {
    admins: ['supervisor-1']
  });

  res = await http.get(`/groups/${guid}/members`);
  console.log('Members after add supervisor as admin:', res.data.data.map(m => m.uid).join(', '));
}

run().catch(err => {
  console.error(err.response?.data || err.message);
});
