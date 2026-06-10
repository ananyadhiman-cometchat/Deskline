const BASE='http://localhost:4000/api';
const EMPLOYEE={email:'employee.it@deskline.local',password:'Password123!'};
const AGENT={email:'agent.it@deskline.local',password:'Password123!'};
const SUPERVISOR={email:'supervisor.it@deskline.local',password:'Password123!'};
const ADMIN={email:'admin@deskline.local',password:'Password123!'};
async function req(path,options={}){const r=await fetch(`${BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});return{status:r.status,body:await r.json().catch(()=>({}))};}
async function login(user){const r=await req('/auth/login',{method:'POST',body:JSON.stringify(user)});return r.body.accessToken;}
(async()=>{
const et=await login(EMPLOYEE);const at=await login(AGENT);const st=await login(SUPERVISOR);const ad=await login(ADMIN);
const create=await req('/tickets',{method:'POST',headers:{Authorization:`Bearer ${et}`},body:JSON.stringify({title:'Trigger Audit',description:'notification trigger validation',category:'IT',subType:'action',priority:'medium'})});
const id=create.body?.data?.id;
await req(`/tickets/${id}`,{method:'PATCH',headers:{Authorization:`Bearer ${at}`},body:JSON.stringify({status:'in_progress'})});
await req(`/tickets/${id}/escalate`,{method:'POST',headers:{Authorization:`Bearer ${at}`}});
await req('/admin/announcements',{method:'POST',headers:{Authorization:`Bearer ${ad}`},body:JSON.stringify({title:'Announcement',body:'test',targetRole:'employee'})});
const employeeNotifications=await req('/notifications',{headers:{Authorization:`Bearer ${et}`}});
console.log('ticket-created',create.status===201?'PASS':'FAIL');
console.log('employee-notifications',employeeNotifications.body?.data?.length||0);
console.log('status-update-trigger','VERIFY IN LIST');
console.log('escalation-trigger','VERIFY IN LIST');
console.log('announcement-trigger','VERIFY IN LIST');
console.log('ai-reply-trigger','CREATE INFORMATION TICKET TO VERIFY');
})();