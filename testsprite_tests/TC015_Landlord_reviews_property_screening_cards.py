import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import launch_page, connect_wallet_header, cleanup, BASE_URL


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await page.goto(f"{BASE_URL}/landlord/properties")
        await page.wait_for_load_state("domcontentloaded")
        await connect_wallet_header(page)
        await page.wait_for_timeout(2000)

        await page.get_by_text("Demo Property", exact=False).first.wait_for(
            state="visible", timeout=10000
        )
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
