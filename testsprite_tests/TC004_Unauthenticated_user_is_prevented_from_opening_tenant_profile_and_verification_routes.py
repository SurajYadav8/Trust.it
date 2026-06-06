import asyncio
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import launch_page, cleanup, BASE_URL


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await page.goto(f"{BASE_URL}/profile")
        await page.wait_for_load_state("domcontentloaded")
        await page.get_by_text(re.compile(r"connect your wallet", re.I)).first.wait_for(
            state="visible", timeout=30000
        )

        await page.goto(f"{BASE_URL}/verify/sample-share")
        await page.wait_for_load_state("domcontentloaded")
        await page.get_by_text(
            re.compile(r"connect your wallet|verification request", re.I)
        ).first.wait_for(state="visible", timeout=60000)
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
