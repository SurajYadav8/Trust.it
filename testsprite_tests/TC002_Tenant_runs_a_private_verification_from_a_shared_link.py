import asyncio
import re
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import (
    launch_page,
    goto_home,
    connect_wallet_landing,
    complete_tenant_entry,
    cleanup,
    BASE_URL,
)


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await goto_home(page)
        await connect_wallet_landing(page)
        await complete_tenant_entry(page)

        await page.goto(f"{BASE_URL}/verify/demo", wait_until="domcontentloaded")
        await page.get_by_text(re.compile(r"demo property", re.I)).first.wait_for(
            state="visible", timeout=30000
        )

        view_result = page.get_by_role("button", name=re.compile(r"view result", re.I))
        run_btn = page.get_by_role("button", name=re.compile(r"run verification", re.I))
        await page.wait_for_timeout(2000)
        if await view_result.count() > 0:
            await view_result.first.click()
        elif await run_btn.count() > 0:
            await run_btn.first.click()
        else:
            await page.goto(f"{BASE_URL}/results/demo", wait_until="domcontentloaded")

        await page.wait_for_url("**/results/**", timeout=60000)
        await page.get_by_text(re.compile(r"eligible", re.I)).first.wait_for(
            state="visible", timeout=30000
        )
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
