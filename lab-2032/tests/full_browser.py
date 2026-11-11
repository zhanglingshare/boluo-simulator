"""Executable 15-workspace Boluo 2032 public studio acceptance suite.
Tests actual computation, CSV/XLSX/JSON replacement, professional ZIP, report,
desktop 1440 and Android-width 390, no JS page errors/overflow.
"""
from __future__ import annotations
import io
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/"lab-2032"/"artifacts"
ART.mkdir(exist_ok=True,parents=True)
PAGES=["mission","data","macro","industries","towns","network","projects","labor",
       "survey","models","wind","stress","blindspots","strategy","report"]
def go(page,key):
    page.evaluate("(pageName)=>{window.location.hash='#'+pageName}",key)
    page.locator('[data-page="'+key+'"]').wait_for(state="visible")

def main():
    server=subprocess.Popen([sys.executable,"-m","http.server","8899","--bind","127.0.0.1"],
      cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for attempt in range(100):
            if server.poll() is not None:raise AssertionError("HTTP server exited")
            try:
                with urllib.request.urlopen("http://127.0.0.1:8899/lab-2032/studio.html",timeout=1) as r:
                    if r.status==200:break
            except Exception:time.sleep(.12)
        else:raise AssertionError("HTTP server failed to start")
        with sync_playwright() as pw:
            browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
            try:
                for width,height in [(1440,960),(390,844)]:
                    mobile=width==390
                    ctx=browser.new_context(viewport={"width":width,"height":height},
                      is_mobile=mobile,has_touch=mobile,accept_downloads=True)
                    page=ctx.new_page()
                    errors=[]
                    page.on("pageerror",lambda exc:errors.append(str(exc)))
                    page.goto("http://127.0.0.1:8899/lab-2032/",wait_until="networkidle")
                    assert "studio.html" in page.url,page.url
                    page.locator("#missionStats .stat-card").first.wait_for(timeout=15000)
                    assert page.locator("#missionStats .stat-card").count()==4
                    assert page.locator("#mainNav .nav-link").count()==len(PAGES)
                    for name in PAGES:
                        go(page,name)
                        assert page.locator('[data-page="'+name+'"]').is_visible()
                        assert not errors, (name,errors)
                    calibration_probe=page.evaluate("""() => {
                      const bundle=BoluoCore.demo();
                      const a=BoluoEngine.simulate(bundle,{trials:300,seed:2032});
                      bundle.tables.enterprises.filter(e=>e.sector==='tertiary').forEach(e=>e.revenue*=1.6);
                      bundle.evidence.enterprises='IMPORTED_UNVERIFIED';
                      const b=BoluoEngine.simulate(bundle,{trials:300,seed:2032});
                      return {a:a.totals.p50,b:b.totals.p50,delta:b.calibration.annualRateDelta[2]};
                    }""")
                    assert calibration_probe["delta"]>0,calibration_probe
                    assert calibration_probe["b"]>calibration_probe["a"],calibration_probe
                    go(page,"macro")
                    assert "1,005.5" in page.locator("#macroStats").inner_text()
                    assert page.locator("#macroTimeline svg").count()==1
                    go(page,"industries")
                    assert page.locator("#enterpriseTable tr").count()>20
                    page.locator("#industryFilter").select_option("tertiary")
                    assert page.locator("#subsectorBars .bar-item").count()>3
                    go(page,"towns")
                    assert page.locator("#townMatrix .town-cell").count()==12
                    page.locator("#townFilter").select_option("柏塘镇")
                    assert "柏塘镇" in page.locator("#townDetails").inner_text()
                    go(page,"network")
                    assert page.locator("#networkSankey svg").count()==1
                    assert page.locator("#topNetworkEntities button").count()>0
                    page.locator("#runNetworkShock").click()
                    assert "传导实验" in page.locator("#shockResults").inner_text()
                    go(page,"projects")
                    assert page.locator("#projectFunnel .funnel-stage").count()==4
                    page.locator("#projectDelay").fill("2")
                    assert "2年" in page.locator("#projectDelayOutput").inner_text()
                    go(page,"labor")
                    assert page.locator("#laborHistogram svg").count()==1
                    go(page,"survey")
                    assert page.locator("#surveyConstructs .construct-box").count()==3
                    go(page,"models")
                    page.locator("#runModels").click()
                    page.locator("#modelPaths .path-row").first.wait_for(timeout=45000)
                    assert page.locator("#modelPaths .path-row").count()==3
                    with page.expect_download() as info:
                        page.locator("#exportProfessional").click()
                    with tempfile.TemporaryDirectory() as td:
                        pkg=Path(td)/info.value.suggested_filename
                        info.value.save_as(pkg)
                        with zipfile.ZipFile(pkg) as archive:
                            assert archive.testzip() is None
                            assert "data/surveys.csv" in archive.namelist()
                            template=json.loads(archive.read("model/external_result_template.json"))
                        template.update({
                          "software":"SmartPLS","software_version":"4.3-demo-manually-tested",
                          "method":"PLS-SEM","paths":{"SA->SU":.42,"SA->OP":.21,"SU->OP":.29}
                        })
                        page.locator("#externalModelFile").set_input_files({
                          "name":"analysis-output.json","mimeType":"application/json",
                          "buffer":json.dumps(template).encode("utf-8")
                        })
                        expect(page.locator('#modelComparison')).to_contain_text('SmartPLS',timeout=20000)
                    go(page,"wind")
                    original=page.locator("#windStats .stat-card").first.inner_text()
                    page.locator("#scenarioSelect").select_option("service")
                    assert page.locator('#windStats .stat-card').count()==4
                    assert page.locator("#windStats .stat-card").first.inner_text()!=original
                    page.locator("#pinScenarioA").click()
                    page.locator("#scenarioSelect").select_option("stress")
                    page.locator("#pinScenarioB").click()
                    assert "同一2025数据基准" in page.locator("#windComparison").inner_text()
                    go(page,"stress")
                    page.locator("#runStress").click()
                    assert "联合压力" in page.locator("#stressOutcomes").inner_text() or page.locator("#stressOutcomes .stress-summary").count()==1
                    go(page,"strategy")
                    assert page.locator("#actionCards .action-card").count()>=4
                    go(page,"blindspots")
                    assert page.locator("#blindspotCards .blind-card").count()>=5
                    go(page,"report")
                    assert "三次产业协同研究报告" in page.locator("#reportContent").inner_text()
                    with page.expect_download() as report_dl:
                        page.locator("#exportReport").click()
                    assert report_dl.value.suggested_filename.endswith(".md")
                    go(page,"data")
                    page.locator("#importType").select_option("macro")
                    page.locator("#importFile").set_input_files({
                      "name":"macro.csv","mimeType":"text/csv",
                      "buffer":b"year,primary,secondary,tertiary\n2025,120,650,380\n"})
                    page.locator("#importStart").click()
                    page.locator("#mappingFields select").first.wait_for()
                    page.locator("#importConfirm").click()
                    expect(page.locator('#topMode')).to_contain_text('MIXED',timeout=12000)
                    go(page,"macro")
                    assert "1,150" in page.locator("#macroStats").inner_text()
                    go(page,"data")
                    page.locator("#restoreDemoTop").click()
                    expect(page.locator('#topMode')).to_contain_text('DEMO',timeout=12000)
                    # XLSX is an explicit functional requirement; verify first worksheet parse.
                    from openpyxl import Workbook
                    wb=Workbook();ws=wb.active;ws.append(["year","primary","secondary","tertiary"]);ws.append([2025,121,641,388])
                    buf=io.BytesIO();wb.save(buf)
                    page.locator("#importType").select_option("macro")
                    page.locator("#importFile").set_input_files({
                      "name":"macro.xlsx","mimeType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                      "buffer":buf.getvalue()
                    })
                    page.locator("#importStart").click()
                    page.locator("#importConfirm").wait_for(state="attached",timeout=12000)
                    expect(page.locator('#importConfirm')).to_be_enabled(timeout=12000)
                    page.locator("#importConfirm").click()
                    page.wait_for_function('document.querySelector("#topMode").textContent.includes("MIXED")',timeout=12000)
                    go(page,"macro")
                    assert "1,150" in page.locator("#macroStats").inner_text()
                    go(page,"data")
                    page.locator("#restoreDemoTop").click()
                    # Real imports can introduce previously unseen town names; lists must adapt.
                    page.locator("#importType").select_option("enterprises")
                    page.locator("#importFile").set_input_files({
                      "name":"new-town.csv","mimeType":"text/csv",
                      "buffer":b"id,sector,subsector,town,employees,revenue,productivity\nX001,secondary,Demo,TestNewTown,31,21.5,0.693\n"
                    })
                    page.locator("#importStart").click()
                    expect(page.locator("#importConfirm")).to_be_enabled(timeout=12000)
                    page.locator("#importConfirm").click()
                    expect(page.locator("#topMode")).to_contain_text("MIXED",timeout=12000)
                    go(page,"towns")
                    assert "TestNewTown" in page.locator("#townFilter").inner_text()
                    go(page,"data")
                    page.locator("#restoreDemoTop").click()
                    dims=page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
                    assert dims["scroll"]<=dims["width"]+2,dims
                    assert not errors,errors
                    go(page,"mission")
                    page.screenshot(path=str(ART/("full-mobile.png" if mobile else "full-desktop.png")),
                      full_page=True,animations="disabled")
                    ctx.close()
            finally:browser.close()
    finally:
        server.terminate()
        try:server.wait(timeout=5)
        except subprocess.TimeoutExpired:server.kill()
    print("PASS: full studio public, all 15 workspaces, scenario, SNA, projects, workforce, survey, models, ZIP, XLSX/CSV, report, desktop/mobile.")

if __name__=="__main__":
    main()