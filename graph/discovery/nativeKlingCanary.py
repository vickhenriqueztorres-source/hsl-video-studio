from __future__ import annotations

import asyncio
import logging
import os
from pathlib import Path

from firefly_bot import model_canary
from firefly_bot.logging_utils import event
from firefly_bot.worker import Worker, resolve_native_file_chooser_helper


async def force_native_file_dialog(self: Worker, path: Path, editor: object) -> None:
    if os.name != "nt":
        raise RuntimeError("FIREFLY_NATIVE_FILE_CHOOSER_REQUIRES_WINDOWS")
    helper = Path(__file__).with_name('nativeFileChooserUia.ps1')

    await self._require_human().click_element(
        editor.get_by_test_id("placeholder-upload-button").nth(0), "botao First frame"
    )
    await self._require_human().human_delay(0.3, 0.8)

    local_file = None
    for label in ("Seu dispositivo", "Your device"):
        candidates = editor.get_by_text(label, exact=True)
        for index in range(await candidates.count()):
            candidate = candidates.nth(index)
            if await candidate.is_visible(timeout=500):
                local_file = candidate
                break
        if local_file is not None:
            break
    if local_file is None:
        raise RuntimeError("FIREFLY_NATIVE_LOCAL_FILE_MENU_NOT_VISIBLE")

    process = await asyncio.create_subprocess_exec(
        "powershell.exe",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(helper),
        "-FilePath",
        str(path),
        "-TimeoutSeconds",
        "30",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await local_file.click(no_wait_after=True)
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=40)
    except TimeoutError:
        process.kill()
        await process.communicate()
        raise RuntimeError("FIREFLY_NATIVE_FILE_CHOOSER_TIMEOUT")
    if process.returncode != 0:
        raise RuntimeError(
            "FIREFLY_NATIVE_FILE_CHOOSER_FAILED: "
            f"exit={process.returncode} stdout={stdout.decode(errors='replace')} "
            f"stderr={stderr.decode(errors='replace')}"
        )
    event(
        self.logger,
        logging.INFO,
        "first_frame_native_file_selected_forced",
        job_id=self._current_job_id,
        image=path,
    )


Worker._upload_first_frame_with_native_dialog = force_native_file_dialog
raise SystemExit(model_canary.main())
