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
    set_e2e_address,
    cleanup,
    FRESH_TENANT,
)


async def run_test():
    pw, browser, context, page = await launch_page()
    try:
        await goto_home(page)
        await set_e2e_address(page, FRESH_TENANT)
        await connect_wallet_landing(page)
        await complete_tenant_entry(page)

        await page.get_by_text(
            re.compile(r"create your encrypted profile", re.I)
        ).first.wait_for(state="visible", timeout=30000)

        create_link = page.get_by_role("link", name=re.compile(r"create encrypted profile", re.I))
        await create_link.first.click()
        await page.wait_for_url("**/profile**", timeout=60000)

        await page.get_by_role("button", name=re.compile(r"get started", re.I)).first.wait_for(
            state="visible", timeout=120000
        )
        await page.get_by_role("button", name=re.compile(r"get started", re.I)).first.click()

        salary_input = page.locator('input[type="number"]').first
        await salary_input.wait_for(state="visible", timeout=30000)
        await salary_input.fill("75000")
        await page.get_by_role("button", name=re.compile(r"continue", re.I)).first.click()

        credit_input = page.locator('input[name="credit"]')
        await credit_input.wait_for(state="visible", timeout=15000)
        await credit_input.fill("740")
        await page.get_by_role("button", name=re.compile(r"continue", re.I)).first.click()

        await page.locator("button").filter(has_text=re.compile(r"1.2 years", re.I)).first.click()
        await page.get_by_role("button", name=re.compile(r"continue", re.I)).first.click()
        await page.get_by_role("button", name=re.compile(r"encrypt", re.I)).first.click()

        await page.get_by_role(
            "button", name=re.compile(r"go to dashboard", re.I)
        ).first.wait_for(state="visible", timeout=180000)
    finally:
        await cleanup(pw, browser, context)


asyncio.run(run_test())
