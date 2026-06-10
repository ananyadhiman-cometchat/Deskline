const BASE='http://localhost:4000/api';
const email=`smoke${Date.now()}@example.com`;
const password='Password123!';

async function req(path,options={}){
 const r=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
 return {status:r.status,body:await r.json()};
}

function logResult(name,result){
 console.log(name,result.status,result.status >= 400 ? result.body : '');
}

(async()=>{
 const reg=await req('/auth/register',{method:'POST',body:JSON.stringify({name:'Smoke User',email,password,department:'IT'})});
 logResult('register',reg);
 const login=await req('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
 const token=login.body.data?.accessToken||login.body.accessToken;
 logResult('login',login);
 const auth={Authorization:`Bearer ${token}`};
 logResult('profile',(await req('/users/profile',{headers:auth})));
 logResult('fcm',(await req('/users/me/fcm-token',{method:'PATCH',headers:auth,body:JSON.stringify({fcmToken:'test-token'})})));
 logResult('ticket',(await req('/tickets',{method:'POST',headers:auth,body:JSON.stringify({title:'Test Ticket',description:'This is a smoke test ticket description',category:'IT',subType:'action',priority:'medium'})})));
 logResult('tickets',(await req('/tickets',{headers:auth})));
 logResult('notifications',(await req('/notifications',{headers:auth})));
 logResult('me',(await req('/auth/me',{headers:auth})));
})();