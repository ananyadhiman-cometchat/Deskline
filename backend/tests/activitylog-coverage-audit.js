const BASE='http://localhost:4000/api';
const ADMIN={email:'admin@deskline.local',password:'Password123!'};
const EMPLOYEE={email:'employee.it@deskline.local',password:'Password123!'};
async function req(path,options={}){const r=await fetch(`${BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});return{status:r.status,body:await r.json().catch(()=>({}))};}
async function login(user){const r=await req('/auth/login',{method:'POST',body:JSON.stringify(user)});return r.body.accessToken;}
(async()=>{
const adminToken=await login(ADMIN);
const employeeToken=await login(EMPLOYEE);
const before=await req('/admin/activity-logs?pageSize=500',{headers:{Authorization:`Bearer ${adminToken}`}});
const beforeCount=before.body?.meta?.total||0;
await req('/users/profile',{method:'PATCH',headers:{Authorization:`Bearer ${employeeToken}`},body:JSON.stringify({name:'Audit User'})});
await req('/users/me/fcm-token',{method:'PATCH',headers:{Authorization:`Bearer ${employeeToken}`},body:JSON.stringify({fcmToken:'audit-token'})});
await req('/admin/announcements',{method:'POST',headers:{Authorization:`Bearer ${adminToken}`},body:JSON.stringify({title:'Audit',body:'Audit message',targetRole:'employee'})});
const after=await req('/admin/activity-logs?pageSize=500',{headers:{Authorization:`Bearer ${adminToken}`}});
console.log('beforeLogs',beforeCount);
console.log('afterLogs',after.body?.meta?.total);
console.log('increase', (after.body?.meta?.total||0)-beforeCount);
console.log('latestActions',after.body?.data?.slice?.(0,10)?.map?.(x=>x.action));
})();