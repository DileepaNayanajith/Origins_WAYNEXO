// Browser contract tests use controlled API fixtures. Backend persistence/authorization
// and real HTTPS proxy behavior are covered independently by Spring integration tests.
import { test, expect } from '@playwright/test'
const roles = [
  ['DRIVER','driver','vehicleCode','Vehicle'], ['LOADER','loader','depotCode','Loading hub'],
  ['STORE_MANAGER','store','outletCode','Store / branch'], ['DISPATCHER','dispatcher',null,null],
]
const viewports = [{width:320,height:568},{width:844,height:390},{width:768,height:1024},{width:1366,height:768},{width:1920,height:1080}]
for (const viewport of viewports) for (const [role,home,field,label] of roles) {
  test(`${role} at ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport)
    let configured = !field
    let saved = null
    const user = {id:1,role,fullName:'Test account',initials:'TA',vehicleCode:'V1',depot:{code:'HUB',name:'Test hub',shortName:'Hub'},outlet:{id:1,code:'B1',name:'Test store',brand:'FRESH',consoleLabel:'Test store'}}
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname
      let data = null
      if (path === '/api/auth/login') {
        expect(route.request().postDataJSON()).toEqual({username:'test',password:'valid-pass'})
        data = {token:'fixture-token',user}
      } else if (path === '/api/auth/me') data = user
      else if (path === '/api/auth/setup' && route.request().method() === 'PUT') {
        saved = route.request().postDataJSON(); configured = true; data = user
      } else if (path === '/api/auth/setup') data = {fields: configured ? [] : [{name:field,label,options:[{value:'assigned',label:'Assigned workspace'}]}]}
      else { await route.fulfill({status:503,contentType:'application/json',body:'{"message":"Operational data fixture unavailable"}'}); return }
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)})
    })
    await page.goto('/#/login')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.locator('input')).toHaveCount(2)
    await expect(page.locator('select')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByLabel('Username').fill('test')
    await page.getByLabel('Password').fill('valid-pass')
    await page.getByRole('button',{name:'Log In',exact:true}).click()
    await expect(page).toHaveURL(new RegExp('#/'+home+'$'))
    if (field) {
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.locator('select')).toHaveCount(1)
      const bounds = await page.getByRole('dialog').boundingBox()
      expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.width).toBeLessThanOrEqual(viewport.width)
      expect(bounds.y).toBeGreaterThanOrEqual(0); expect(bounds.height).toBeLessThanOrEqual(viewport.height)
      await page.getByLabel(label).selectOption('assigned')
      await page.getByRole('button',{name:'Continue',exact:true}).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(saved).toEqual({[field]:'assigned'})
    }
    await page.goto('/#/'+(home === 'driver' ? 'dispatcher' : 'driver'))
    await expect(page).toHaveURL(new RegExp('#/'+home+'$'))
    await page.reload()
    await expect(page).toHaveURL(new RegExp('#/'+home+'$'))
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
}
