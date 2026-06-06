import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import launch_page, connect_wallet_header, cleanup, BASE_URL


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await page.goto(f"{BASE_URL}/landlord/requests/new")
        await page.wait_for_load_state("domcontentloaded")
        await connect_wallet_header(page)
        await page.wait_for_timeout(2000)

        await page.locator('input[name="title"]').fill("E2E Test Property")
        await page.locator('input[name="propertyLabel"]').fill("Unit 9")
        await page.locator('input[name="rent"]').fill("30000")
        await page.locator('input[name="multiplier"]').fill("3")
        await page.locator('input[name="credit"]').fill("700")

        await page.get_by_role("button", name="Create screening").click()
        await page.wait_for_url("**/landlord/requests/**", timeout=20000)
        assert "/landlord/requests/" in page.url
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
