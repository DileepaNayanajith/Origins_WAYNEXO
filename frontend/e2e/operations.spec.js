import { test, expect } from '@playwright/test'
async function signIn(page,role,area,fixture) {
 const user={id:1,role,fullName:'Judge account',vehicleCode:'VEH004',depot:{code:'PLG',name:'Peliyagoda',shortName:'Peliyagoda'},outlet:{id:4,code:'OUT004',name:'OUT004',brand:'FRESH',consoleLabel:'OUT004'}}
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname
  let body
  if(path==='/api/auth/login')body={token:'fixture',user}
  else if(path==='/api/auth/me')body=user
  else if(path==='/api/auth/setup')body={fields:[]}
  else body=fixture(path,route.request())
  if(body===undefined){await route.fulfill({status:404,contentType:'application/json',body:'{"message":"Trip not found"}'});return}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)})
 })
 await page.goto('/#/login');await page.getByLabel('Username').fill('judge');await page.getByLabel('Password').fill('test-password');await page.getByRole('button',{name:'Log In',exact:true}).click();await expect(page).toHaveURL(new RegExp('#/'+area+'$'))
}
for(const width of [320,390])test(`store catalog and cart reflow at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844})
 await signIn(page,'STORE_MANAGER','store',path=>path==='/api/store/catalog'?{products:[{id:1,sku:'MILK',name:'Milk',category:'CHILLED_PRODUCE',tempClass:'CHILLED',price:100,unit:'bottle',frequent:true,unitWeightKg:1,unitVolumeM3:.01}],cutoffHour:16,brand:'FRESH',suggested:[],deliveryOptions:[{date:'2026-10-05',label:'Monday'}]}:undefined)
 await expect(page.getByText('Order Cart',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Submit Stock Order'})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 const button=await page.getByRole('button',{name:'Add',exact:true}).boundingBox();expect(button.height).toBeGreaterThanOrEqual(44);expect(button.width).toBeGreaterThanOrEqual(44)
})
for(const width of [390,834])test(`loader queue reflows at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1194})
 await signIn(page,'LOADER','loader',path=>path==='/api/loader/queue'?{alert:null,rows:[{tripId:1,plate:'VEH004',reefer:true,model:'Truck',driverName:'Suresh',stops:1,packages:20,volumePct:10,weightPct:20,status:'LOADING'}]}:undefined)
 await expect(page.getByText('VEH004',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.goto('/#/loader/manifest/999');await expect(page.getByRole('alert')).toHaveText('Trip not found');await page.getByRole('button',{name:'Back to queue'}).click();await expect(page).toHaveURL(/#\/loader$/)
})
test('TV planning exposes release actions and counts orders',async({page})=>{
 await page.setViewportSize({width:1920,height:1080})
 const counts={orders:2,vehicles:60,deferrals:0}
 await signIn(page,'DISPATCHER','dispatcher',path=>{
  if(path==='/api/dispatcher/overview')return {counts,brands:[],dispatch:{pct:0,dispatched:0,standby:60,workshop:0},capacity:{reefer:0,dry:0},alerts:[],alertCount:0}
  if(path==='/api/dispatcher/planning')return {counts,vehicles:[],conflicts:[],groups:[{district:'Colombo',orders:[1,2].map(id=>({id,code:'ORD-'+id,brand:'FRESH',brandTitle:'Fresh',outletName:'OUT004',weightKg:10,volumeM3:1,reefer:true,vanOnly:false}))}]}
  if(path==='/api/dispatcher/planning/release')return {tripIds:[1]}
 })
 await page.goto('/#/dispatcher/planning');await expect(page.getByText('2 ORDERS',{exact:true})).toBeVisible();const button=page.getByRole('button',{name:'Release plan to dock'});await expect(button).toBeVisible();const box=await button.boundingBox();expect(box.x+box.width).toBeLessThanOrEqual(1920);await button.click();await expect(page.getByText('Released 1 trips to dock')).toBeVisible()
})
