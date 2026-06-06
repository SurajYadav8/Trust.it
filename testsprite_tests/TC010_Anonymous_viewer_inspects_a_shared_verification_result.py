import asyncio
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import launch_page, cleanup, BASE_URL


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await page.goto(f"{BASE_URL}/results/demo", wait_until="domcontentloaded")
        await page.wait_for_url("**/results/**", timeout=30000)
        await page.get_by_text(re.compile(r"eligible", re.I)).first.wait_for(
            state="visible", timeout=30000
        )
        content = await page.content()
        assert "salary" not in content.lower() or "requirement" in content.lower()
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
