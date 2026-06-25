import { createCometChatClient } from './src/modules/cometchat/cometchat-client.js';

async function run() {
  const client = createCometChatClient();
  const guid = 'test-group-' + Date.now();
  console.log('Creating group', guid);
  await client.createGroup({
    guid,
    name: 'Test Group',
    type: 'private'
  });

  console.log('Adding 3 members');
  await client.addMembersToGroup(guid, [
    { uid: 'employee-1', scope: 'participant' },
    { uid: 'agent-1', scope: 'participant' },
    { uid: 'supervisor-1', scope: 'admin' }
  ]);

  console.log('Adding supervisor again');
  await client.addMembersToGroup(guid, [
    { uid: 'supervisor-1', scope: 'admin' }
  ]);

  console.log('Done');
}

run().catch(console.error);
