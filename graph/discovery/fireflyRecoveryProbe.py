"""Read-only diagnostics for an existing Adobe job. Never submits generation."""
import asyncio
import json
import os
import re
import uuid
from pathlib import Path
from urllib.parse import urlsplit
from patchright.async_api import async_playwright


async def main():
    out = Path('out/firefly-recovery-debug')
    out.mkdir(parents=True, exist_ok=True)
    headers = {}
    requests = []
    snippets = []
    tasks = []
    async with async_playwright() as pw:
        context = await pw.chromium.launch_persistent_context(
            os.environ['HSL_FIREFLY_CHROME_PROFILE'], channel='chrome', headless=False,
            no_viewport=True, args=['--disable-blink-features=AutomationControlled'],
            ignore_default_args=['--enable-automation'])
        page = await context.new_page()
        async def observe(response):
            url = response.url
            host = urlsplit(url).hostname or ''
            if host.startswith('bks') and host.endswith('.adobe.io'):
                current = await response.request.all_headers()
                headers.update({k: v for k, v in current.items() if k in ('authorization', 'x-api-key', 'origin', 'referer') or k.startswith('x-adobe')})
                requests.append({'url': url, 'header_names': sorted(current), 'method': response.request.method})
            if response.request.resource_type == 'script' and 'firefly.adobe.com' in url:
                try:
                    body = await response.text()
                    for match in re.finditer(r'jobs/result|Missing required params', body):
                        snippets.append({'url': url, 'snippet': body[max(0,match.start()-800):match.end()+1000]})
                except Exception:
                    pass
        page.on('response', lambda r: tasks.append(asyncio.create_task(observe(r))))
        await page.goto('https://firefly.adobe.com/generate/video', wait_until='domcontentloaded', timeout=90000)
        await asyncio.sleep(20)
        if tasks:
            await asyncio.gather(*tasks)
        target = 'https://bks-epo8552.adobe.io/v2/jobs/result/accd5ac8-1593-43ff-9439-726133feb47a'
        results = []
        for accept in ['application/json', '*/*', 'multipart/mixed']:
            response = await context.request.get(target, headers={**headers, 'accept': accept, 'x-request-id':str(uuid.uuid4())}, timeout=30000)
            payload = await response.text()
            results.append({'accept':accept,'status':response.status,'headers':{k:v for k,v in response.headers.items() if k in ('content-type','x-task-status')},'body':payload[:16000]})
            if response.ok:
                break
        (out/'job-response.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
        await page.screenshot(path=str(out/'page.png'))
        dom = await page.evaluate('''() => {
            const result=[];function walk(root){for(const e of root.querySelectorAll('*')){
              if(e.shadowRoot)walk(e.shadowRoot);
              if(e.matches('button,[role=button],video,[data-testid]') && e.getBoundingClientRect().width)
                result.push({tag:e.tagName,testid:e.getAttribute('data-testid'),text:(e.innerText||'').slice(0,200),src:e.currentSrc||e.src,disabled:e.hasAttribute('disabled')});
            }}walk(document);return result;
        }''')
        (out/'probe.json').write_text(json.dumps({'requests': requests,'snippets':snippets,'dom':dom},ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps({'requests':requests,'snippet_count':len(snippets),'out':str(out)},ensure_ascii=False))
        await context.close()

if __name__ == '__main__':
    asyncio.run(main())
