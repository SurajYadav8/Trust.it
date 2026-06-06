import asyncio
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import launch_page, cleanup, BASE_URL


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await page.goto(f"{BASE_URL}/verify")
        await page.wait_for_load_state("domcontentloaded")

        await page.get_by_label("Verification link or code").fill("abc123")
        await page.get_by_role("button", name="Continue").click()

        await page.wait_for_url("**/verify/abc123**", timeout=10000)
        await page.get_by_text("Demo Property", exact=False).first.wait_for(
            state="visible", timeout=10000
        )

        await page.goto(f"{BASE_URL}/results/demo", wait_until="domcontentloaded")
        await page.wait_for_url("**/results/**", timeout=30000)
        await page.get_by_text(re.compile(r"eligible", re.I)).first.wait_for(
            state="visible", timeout=30000
        )
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
