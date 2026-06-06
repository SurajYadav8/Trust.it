import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import (
    launch_page,
    goto_home,
    connect_wallet_landing,
    complete_landlord_entry,
    connect_wallet_header,
    set_e2e_address,
    cleanup,
    BASE_URL,
    FRESH_LANDLORD,
)


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await goto_home(page)
        await set_e2e_address(page, FRESH_LANDLORD)
        await connect_wallet_landing(page)
        await complete_landlord_entry(page)

        await page.goto(f"{BASE_URL}/landlord/requests/new", wait_until="domcontentloaded")
        title = page.locator('input[name="title"]')
        if await title.count() == 0:
            await connect_wallet_header(page)
            await page.wait_for_timeout(2000)
        await title.first.wait_for(state="visible", timeout=30000)
        await title.fill("New Screening E2E")
        await page.locator('input[name="rent"]').fill("40000")
        await page.locator('input[name="multiplier"]').fill("2.5")
        await page.locator('input[name="credit"]').fill("680")
        await page.get_by_role("button", name="Create screening").click()
        await page.wait_for_url("**/landlord/requests/**", timeout=20000)
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
