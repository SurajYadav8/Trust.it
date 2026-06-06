import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import (
    launch_page,
    goto_home,
    connect_wallet_landing,
    complete_tenant_entry,
    cleanup,
)


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await goto_home(page)
        await connect_wallet_landing(page)
        await complete_tenant_entry(page)
        assert "/dashboard" in page.url
        await page.get_by_text("Dashboard", exact=False).first.wait_for(
            state="visible", timeout=10000
        )
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
