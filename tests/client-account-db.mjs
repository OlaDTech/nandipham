import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const db=new PGlite(), a='00000000-0000-4000-8000-000000000001', b='00000000-0000-4000-8000-000000000002', s='00000000-0000-4000-8000-000000000003', other='00000000-0000-4000-8000-000000000004'
const hash='$2a$12$'+'a'.repeat(53)
try {
 await db.exec(`create role anon;create role authenticated;create role service_role;
 create table clients(id uuid primary key,full_name text,phone text,country text,state text,password_hash text,shipping_mark text);
 create table client_sessions(id uuid primary key,client_id uuid,expires_at timestamptz);
 insert into clients values('${a}','Customer A','+26771234567','Botswana','Gaborone','old-hash','MARK-A'),('${b}','Customer B','+26772987654','Botswana','Gaborone','other-hash','MARK-B');
 insert into client_sessions values('${s}','${a}',now()+interval '1 day'),('${other}','${a}',now()+interval '1 day');`)
 await db.exec(await readFile(new URL('../supabase/migrations/202610180001_client_account.sql',import.meta.url),'utf8'))
 const update=(client=a,session=s,expected='old-hash',phone='+26771234567',newHash=null)=>db.query('select update_client_account($1,$2,$3,$4,$5,$6,$7,$8) as client',[client,session,expected,'Updated Name',phone,'Botswana','Gaborone',newHash])
 await assert.rejects(update(b,s,'other-hash'),/session has expired/)
 await assert.rejects(update(a,s,'wrong'),/Account changed/)
 await assert.rejects(update(a,s,'old-hash','+26772987654'),/cannot be used/)
 await assert.rejects(update(a,s,'old-hash','invalid'),/Check your profile/)
 await assert.rejects(update(a,s,'old-hash','+26771234567','plaintext'),/Invalid password hash/)
 await db.exec('set role authenticated')
 await assert.rejects(update(),/permission denied/)
 await db.exec('reset role;set role service_role')
 const result=await update(a,s,'old-hash','+26771111111',hash)
 assert.equal(result.rows[0].client.shipping_mark,'MARK-A')
 assert.equal(result.rows[0].client.password_hash,undefined)
 await db.exec('reset role')
 assert.equal((await db.query('select * from client_sessions')).rows.length,1)
 assert.equal((await db.query('select * from clients where id=$1',[b])).rows[0].full_name,'Customer B')
 await assert.rejects(update(a,s,'old-hash'),/Account changed/)
 console.log('Account ownership, expected-password check, phone validation, privilege checks, protected fields and session revocation passed')
} finally {await db.close()}
