import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
const browser=await chromium.launch({channel:'msedge',headless:true})
try {
 for(const role of ['public','client','admin','staff']) for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:1000}})
  const user={id:'00000000-0000-4000-8000-000000000001',email:'preview@example.test'}
  if(role==='client') await context.addInitScript(()=>localStorage.setItem('nandipham_client',JSON.stringify({client:{id:'00000000-0000-4000-8000-000000000001',full_name:'Naledi Example',shipping_mark:'NM-001'},sessionToken:'test-session',expiresAt:'2099-01-01T00:00:00Z'})))
  if(role==='admin'||role==='staff') await context.addInitScript(user=>{const token=btoa(JSON.stringify({alg:'HS256'}))+'.'+btoa(JSON.stringify({sub:user.id,exp:4070908800}))+'.test';localStorage.setItem('sb-layout-test-auth-token',JSON.stringify({access_token:token,refresh_token:'test',expires_at:4070908800,token_type:'bearer',user}))},user)
  await context.route('**/*.supabase.co/**',async route=>{
   const url=new URL(route.request().url());let data=[]
   const profile={...user,role,full_name:'Naledi Example',permissions:['dashboard','goods','scan']}
   if(url.pathname.includes('/profiles'))data=url.searchParams.has('id')?profile:[profile]
   if(url.pathname.includes('/auth/v1/user'))data=user
   if(url.pathname.includes('/client-portal'))data={goods:[],messages:[],announcements:[],settings:{company_name:'NandiphaM'}}
   if(url.pathname.includes('/client-wallet'))data={balances:[{currency:'BWP',available_balance:0}],transactions:[]}
   await route.fulfill({status:200,contentType:'application/json',headers:{'content-range':'0-0/0'},body:JSON.stringify(data)})
  })
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:5177/'+(['admin','staff'].includes(role)?'#/admin-login':''))
  await page.locator(role==='public'?'.nm-hero-display':role==='client'?'.nm-client':'.nm-admin').waitFor()
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow: '+role+' '+width)
  await page.screenshot({path:path.join(os.tmpdir(),'nandipham-new-'+role+'-'+width+'.png'),fullPage:role==='public'})
  if(role==='client') {await page.getByRole('button',{name:'Explore the store'}).click();await page.locator('.storefront').waitFor()}
  if(role==='admin'||role==='staff') {
   assert.equal(await page.locator('.nm-tool-list').getByRole('button',{name:/Storefront/}).count(),role==='admin'?1:0)
   await page.getByLabel('Search admin tools').fill('warehouse')
   assert.equal(await page.locator('.nm-tool-list>button').count(),1)
   await page.locator('.nm-tool-list').getByRole('button',{name:/Warehouse/}).click()
   await page.getByText('Goods Management',{exact:true}).waitFor()
  }
  if(role==='public'){await page.getByRole('button',{name:'Start your journey'}).click();await page.getByText('Create your client account',{exact:true}).waitFor()}
  assert.deepEqual(errors,[])
  console.log(role+' '+width+': layout, navigation and role visibility passed')
  await context.close()
 }
}finally{await browser.close()}
