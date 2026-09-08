"""Read-only Firefly request probe. It never clicks or modifies the provider UI."""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

from patchright.async_api import async_playwright


async def main() -> None:
    profile = Path(os.environ["HSL_FIREFLY_CHROME_PROFILE"]).resolve()
    async with async_playwright() as playwright:
        context = await playwright.chromium.launch_persistent_context(
            user_data_dir=str(profile), channel="chrome", headless=False, no_viewport=True,
            args=["--disable-blink-features=AutomationControlled"],
            ignore_default_args=["--enable-automation"],
        )
        records: list[dict[str, object]] = []

        def capture(request: object) -> None:
            url = str(request.url)
            if "/jobs/" not in url.casefold():
                return
            parsed = urlsplit(url)
            headers = request.headers
            records.append({
                "method": request.method,
                "origin_path_query": f"{parsed.scheme}://{parsed.netloc}{parsed.path}?{parsed.query}" if parsed.query else f"{parsed.scheme}://{parsed.netloc}{parsed.path}",
                "header_names": sorted(headers),
                "post_data_present": bool(request.post_data),
            })

        def on_request(request: object) -> None:
            capture(request)

        page = context.pages[0] if context.pages else await context.new_page()
        page.on("request", on_request)
        target = sys.argv[1] if len(sys.argv) > 1 else "https://firefly.adobe.com/generate/video"
        await page.goto(target, wait_until="domcontentloaded", timeout=90_000)
        await page.wait_for_timeout(20_000)
        labels = {}
        for label in ("Files", "Arquivos", "Generation history", "Histórico"):
            locator = page.get_by_text(label, exact=False)
            labels[label] = {"count": await locator.count(), "texts": (await locator.all_text_contents())[:15]}
        links = await page.locator("a[href]").evaluate_all("els => els.slice(0,100).map(e => ({text:(e.textContent||'').trim().slice(0,120),href:e.href}))")
        elements = await page.locator("button, [role=button], video, img, [data-testid], [data-id]").evaluate_all("""els => els.slice(0,250).map(e => ({tag:e.tagName,text:(e.textContent||'').trim().slice(0,160),aria:e.getAttribute('aria-label'),testid:e.getAttribute('data-testid'),dataid:e.getAttribute('data-id')||e.getAttribute('data-asset-id')||e.getAttribute('data-generation-id'),src:e.currentSrc||e.src||null,visible:!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)}))""")
        cards = [item for item in elements if str(item.get("testid") or "").startswith("horizontal-masonry-grid-item-")]
        print(json.dumps({"url": page.url, "title": await page.title(), "labels": labels, "links": links, "cards": cards, "requests": records}, ensure_ascii=False, indent=2))
        await context.close()


if __name__ == "__main__":
    asyncio.run(main())
