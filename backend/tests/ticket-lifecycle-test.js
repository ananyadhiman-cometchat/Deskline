const BASE='http://localhost:4000/api';
const EMPLOYEE={email:'employee@example.com',password:'Password123!'};
const AGENT={email:'agent@example.com',password:'Password123!'};
const SUPERVISOR={email:'supervisor@example.com',password:'Password123!'};
async function req(path,options={}){const r=await fetch(`${BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});return{status:r.status,body:await r.json().catch(()=>({}))};}
async function login(user){const r=await req('/auth/login',{method:'POST',body:JSON.stringify(user)});return r.body?.data?.accessToken||r.body?.accessToken;}
(async()=>{const employeeToken=await login(EMPLOYEE);console.log('employeeToken',!!employeeToken);})();