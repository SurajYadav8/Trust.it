import asyncio
import os
import re
from playwright import async_api

BASE_URL = os.environ.get("TRSTIT_BASE_URL", "http://localhost:3000")
BROWSER_ARGS = [
    "--window-size=1280,720",
    "--disable-dev-shm-usage",
    "--ipc=host",
    "--single-process",
]

CONNECT_WALLET = re.compile(r"connect wallet", re.I)


async def launch_page():
    pw = await async_api.async_playwright().start()
    browser = await pw.chromium.launch(headless=True, args=BROWSER_ARGS)
    context = await browser.new_context()
    context.set_default_timeout(30000)
    page = await context.new_page()
    return pw, browser, context, page


async def goto_home(page):
    await page.goto(BASE_URL, wait_until="domcontentloaded")
    await page.wait_for_timeout(4000)


async def connect_wallet_header(page):
    btn = page.get_by_role("button", name=CONNECT_WALLET).first
    await btn.wait_for(state="visible", timeout=30000)
    await btn.click()
    await page.wait_for_timeout(2000)


async def connect_wallet_landing(page):
    await connect_wallet_header(page)
    enter = page.get_by_role("button", name=re.compile(r"connect wallet to enter", re.I))
    if await enter.count() > 0:
        await enter.wait_for(state="visible", timeout=30000)
        await enter.click()
        await page.wait_for_timeout(3500)


async def set_e2e_address(page, address: str):
    await page.evaluate(
        "(addr) => sessionStorage.setItem('e2eAddress', addr)",
        address,
    )


async def complete_tenant_entry(page):
    enter = page.get_by_role("link", name=re.compile(r"enter trst", re.I))
    tenant_btn = page.locator("button").filter(has_text=re.compile(r"^Tenant", re.I))
    await enter.or_(tenant_btn.first).wait_for(state="visible", timeout=30000)
    if await enter.count() > 0:
        await enter.click()
        await page.wait_for_url("**/dashboard**", timeout=30000)
        return
    await select_tenant_role(page)


async def select_tenant_role(page):
    tenant = page.locator("button").filter(has_text=re.compile(r"^Tenant", re.I)).first
    await tenant.wait_for(state="visible", timeout=30000)
    await tenant.click()
    await page.wait_for_url("**/dashboard**", timeout=30000)


async def select_landlord_role(page):
    landlord = page.locator("button").filter(has_text=re.compile(r"^Landlord", re.I)).first
    await landlord.wait_for(state="visible", timeout=30000)
    await landlord.click()
    await page.wait_for_url("**/landlord**", timeout=30000)


async def complete_landlord_entry(page):
    enter = page.get_by_role("link", name=re.compile(r"enter trst", re.I))
    landlord_btn = page.locator("button").filter(has_text=re.compile(r"^Landlord", re.I))
    await enter.or_(landlord_btn.first).wait_for(state="visible", timeout=30000)
    if await enter.count() > 0:
        await enter.click()
        await page.wait_for_url("**/landlord**", timeout=30000)
        return
    await select_landlord_role(page)


async def cleanup(pw, browser, context):
    if context:
        await context.close()
    if browser:
        await browser.close()
    if pw:
        await pw.stop()


FRESH_LANDLORD = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
FRESH_TENANT = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
