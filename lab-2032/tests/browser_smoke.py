"""Chromium smoke for the open GitHub-Pages-safe research demo."""
from __future__ import annotations
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "lab-2032" / "artifacts"
ART.mkdir(parents=True,exist_ok=True)

def check():
    p = subprocess.Popen([sys.executable,"-m","http.server","8899","--bind","127.0.0.1"],
                         cwd=str(ROOT),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            if p.poll() is not None: raise RuntimeError("static web server exited")
            try:
                with urllib.request.urlopen("http://127.0.0.1:8899/lab-2032/quick-demo.html", timeout=1) as response:
                    if response.status==200: break
            except Exception: time.sleep(.15)
        else: raise RuntimeError("test server did not start")
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                for width,height in [(1440,960),(390,844)]:
                    is_mobile=width==390
                    ctx=browser.new_context(viewport={"width":width,"height":height},
                                            is_mobile=is_mobile,has_touch=is_mobile,accept_downloads=True)
                    page=ctx.new_page()
                    errors=[]
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.goto("http://127.0.0.1:8899/lab-2032/quick-demo.html",wait_until="networkidle")
                    page.wait_for_function('document.querySelector("#resultGdp").textContent.trim() !== "—"')
                    assert "公开体验" in page.locator(".public-tag").inner_text()
                    initial=page.locator("#resultGdp").inner_text()
                    assert page.locator("#sectorCards .sector-card").count()==3
                    page.locator('[data-scene="industrial"]').click()
                    page.wait_for_function('document.querySelector("#runInfo").textContent.includes("制造业升级")')
                    assert page.locator("#resultGdp").inner_text()!=initial
                    page.locator('button[data-tab="relations"]').click()
                    assert page.locator("#serviceBars .service-item").count()==5
                    assert "680" in page.locator("#networkStats").inner_text()
                    page.locator('button[data-tab="survey"]').click()
                    page.locator("#runModel").click()
                    assert page.locator("#modelResults .model-row").count()==3
                    with page.expect_download() as download_record:
                        page.locator("#downloadData").click()
                    download=download_record.value
                    with tempfile.TemporaryDirectory() as td:
                        path=Path(td)/download.suggested_filename
                        download.save_as(str(path))
                        with zipfile.ZipFile(path) as z:
                            assert z.testzip() is None
                            assert "data/survey.csv" in z.namelist()
                            assert "model/external_result_template.json" in z.namelist()
                    page.locator('button[data-tab="data"]').click()
                    assert "500" in page.locator("#dataSummary").inner_text()
                    page.locator("#tableType").select_option("macro")
                    page.locator("#csvFile").set_input_files({
                        "name":"macro.csv","mimeType":"text/csv",
                        "buffer":b"year,primary,secondary,tertiary\n2025,120,650,380\n"})
                    page.locator("#importCsv").click()
                    page.wait_for_function('document.querySelector("#dataBadge").textContent.includes("MIXED")')
                    page.locator('button[data-tab="tunnel"]').click()
                    assert "1,150" in page.locator("#baseGdp").inner_text()
                    page.locator('button[data-tab="data"]').click()
                    page.locator("#restoreDemo").click()
                    assert page.locator("#dataBadge").inner_text()=="DEMO"
                    page.locator('button[data-tab="tunnel"]').click()
                    dimensions=page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
                    assert dimensions["scroll"]<=dimensions["width"]+2,dimensions
                    assert not errors,errors
                    page.screenshot(path=str(ART/("mobile.png" if is_mobile else "desktop.png")),full_page=True,animations="disabled")
                    ctx.close()
            finally:browser.close()
    finally:
        p.terminate()
        try:p.wait(timeout=5)
        except subprocess.TimeoutExpired:p.kill()
    print("Public Demo OK: 1440/390, scenarios, network, regression, ZIP, CSV replacement and restoration.")

if __name__=="__main__":
    check()
