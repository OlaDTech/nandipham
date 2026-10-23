import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:900}})
  const client={id:'00000000-0000-4000-8000-000000000001',full_name:'Test Client',phone:'+26771234567',country:'Botswana',state:'Gaborone',shipping_mark:'MARK-A'}
  await context.addInitScript(client=>localStorage.setItem('nandipham_client',JSON.stringify({client,sessionToken:'test-token',expiresAt:'2099-01-01T00:00:00Z'})),client)
  let fail=true,calls=0
  await context.route('**/*.supabase.co/**',async route=>{
   const req=route.request();let data={},status=200
   if(req.url().includes('client-portal')){
    if(req.method()==='GET')data={client,goods:[],messages:[],settings:{}}
    else if(req.postDataJSON()?.action==='update_account'){
     calls++;assert.equal(req.headers().authorization,'Bearer test-token')
     if(fail){status=403;data={error:'Current password is incorrect.'}}
     else {const body=req.postDataJSON();data={client:{...client,full_name:body.full_name,phone:body.phone}}}
    }
   }
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)})
  })
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:5175')
  if(width<1000) await page.getByRole('button',{name:'More',exact:true}).click()
  await page.getByRole('button',{name:/Account & security/}).last().click()
  await page.getByLabel('Full name',{exact:true}).fill('Updated Client')
  await page.getByLabel('Phone number',{exact:true}).fill('+26771111111')
  await page.getByLabel('Current password',{exact:true}).fill('wrong-password')
  await page.getByRole('button',{name:'Save account changes'}).click()
  await page.getByRole('alert').getByText('Current password is incorrect.').waitFor()
  fail=false
  await page.getByLabel('Current password',{exact:true}).fill('correct-password')
  await page.getByLabel('New password (optional)',{exact:true}).fill('new-password-123')
  await page.getByLabel('Confirm new password',{exact:true}).fill('not-matching')
  await page.getByRole('button',{name:'Save account changes'}).click()
  await page.getByText('New passwords do not match.',{exact:true}).waitFor()
  assert.equal(calls,1)
  await page.getByLabel('Confirm new password',{exact:true}).fill('new-password-123')
  await page.getByRole('button',{name:'Save account changes'}).click()
  await page.getByRole('status').filter({hasText:'Account updated.'}).waitFor()
  assert.equal(await page.getByLabel('Current password',{exact:true}).inputValue(),'')
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nandipham_client')))
  assert.equal(stored.client.full_name,'Updated Client');assert.equal(stored.client.phone,'+26771111111')
  assert.equal(stored.sessionToken,'test-token');assert.ok(!JSON.stringify(stored).includes('password'))
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  assert.deepEqual(errors,[])
  console.log(`Client account validation, errors, successful save and storage passed at ${width}px`)
  await context.close()
 }
}finally{await browser.close()}
