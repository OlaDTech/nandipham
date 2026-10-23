// Run with: deno run --allow-env --no-lock --node-modules-dir=none tests/client-account-api.ts
// @ts-ignore esm.sh runtime default export differs from the upstream declaration.
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3'
let handler: (req: Request) => Promise<Response>
const originalServe = Deno.serve, originalFetch = globalThis.fetch
let validSession=true, allowed=true, writes=0
const savedHash=await bcrypt.hash('current-password',12)
function check(ok: unknown,message: string){if(!ok)throw new Error(message)}
try {
 Deno.env.set('SUPABASE_URL','https://test.supabase.co')
 Deno.env.set('SUPABASE_SERVICE_ROLE_KEY','test-service-key')
 Deno.serve=((fn: typeof handler)=>{handler=fn;return {} as never}) as typeof Deno.serve
 globalThis.fetch=(async (input: RequestInfo | URL,init?: RequestInit)=>{
  const url=new URL(String(input)), method=init?.method || 'GET'
  let data: unknown=null
  if(url.pathname.endsWith('/client_sessions')) data=method==='GET'?(validSession?{id:'session-a',client_id:'client-a'}:null):null
  else if(url.pathname.endsWith('/clients')) data={password_hash:savedHash}
  else if(url.pathname.endsWith('/rpc/registration_allow_attempt')) data=allowed
  else if(url.pathname.endsWith('/rpc/update_client_account')) {
   writes++
   const body=JSON.parse(String(init?.body))
   check(body.p_client==='client-a' && body.p_session==='session-a','Must derive ownership from session, not body')
   check(body.p_expected_hash===savedHash,'Must bind verified credential to atomic update')
   check(body.p_new_hash.startsWith('$2'),'Never persist plaintext password')
   check(!('shipping_mark' in body),'Protected fields must not be forwarded')
   data={id:'client-a',full_name:'Updated Client'}
  } else throw new Error(`Unexpected endpoint ${url.pathname}`)
  return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}})
 }) as typeof fetch
 await import('../supabase/functions/client-portal/index.ts')
 const fields={action:'update_account',full_name:'Updated Client',phone:'+26771234567',country:'Botswana',state:'Gaborone',current_password:'current-password',new_password:'new-password-123',client_id:'attacker-target',shipping_mark:'CHANGED'}
 const call=(body=fields,token='test-token')=>handler(new Request('https://app.test',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:JSON.stringify(body)}))
 validSession=false;check((await call()).status===401,'Expired session must fail');validSession=true
 check((await call({...fields,current_password:'wrong'})).status===403,'Wrong password must fail')
 check(writes===0,'Failed authentication must never write')
 allowed=false;check((await call()).status===429,'Rate limit must be enforced');allowed=true
 check((await call({...fields,new_password:'short'})).status===400,'Reject weak password')
 check((await call()).status===200,'Valid request must succeed')
 check(writes===1,'Only one authenticated update')
 console.log('Account API session ownership, password verification, rate limit, validation and hashing passed')
} finally {Deno.serve=originalServe;globalThis.fetch=originalFetch}
