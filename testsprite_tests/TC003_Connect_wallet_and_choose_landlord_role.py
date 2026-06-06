import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import (
    launch_page,
    goto_home,
    connect_wallet_landing,
    complete_landlord_entry,
    set_e2e_address,
    cleanup,
    FRESH_LANDLORD,
)


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await goto_home(page)
        await set_e2e_address(page, FRESH_LANDLORD)
        await connect_wallet_landing(page)
        await complete_landlord_entry(page)
        assert "/landlord" in page.url
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
