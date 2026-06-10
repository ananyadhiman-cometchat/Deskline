const BASE='http://localhost:4000/api';
const ADMIN_EMAIL='admin@deskline.local';
const ADMIN_PASSWORD='seeded-password';
async function req(path,options={}){const r=await fetch(`${BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});return{status:r.status,body:await r.json().catch(()=>({}))};}
const log=(n,r)=>console.log(n,r.status,r.status>=400?r.body:'');
(async()=>{const login=await req('/auth/login',{method:'POST',body:JSON.stringify({email:ADMIN_EMAIL,password:ADMIN_PASSWORD})});log('login',login);const token=login.body?.data?.accessToken||login.body?.accessToken;const auth={Authorization:`Bearer ${token}`};log('users',await req('/admin/users',{headers:auth}));log('activity-logs',await req('/admin/activity-logs',{headers:auth}));log('notification-logs',await req('/admin/notification-logs',{headers:auth}));log('dashboard',await req('/admin/dashboard',{headers:auth}));log('agent-load',await req('/admin/agent-load',{headers:auth}));})();