"""Executable 19-workspace Boluo 2032 public studio acceptance suite.
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
PAGES=["mission","industry","data","macro","relations","service","agri","industries","towns","network","projects","labor",
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
                    assert page.locator("#targetCurrentBar .mix-segment").count()==3
                    assert page.locator("#targetGoalBar .mix-segment").count()==3
                    assert "10.7" in page.locator("#targetCurrentRatio").inner_text()
                    assert "54.6" in page.locator("#targetCurrentRatio").inner_text()
                    page.locator('[data-focus="service"]').click()
                    assert "生产性服务" in page.locator("#targetFocusPanel").inner_text()
                    page.locator('[data-focus="agriculture"]').click()
                    assert "加工" in page.locator("#targetFocusPanel").inner_text()
                    page.locator('[data-focus="balanced"]').click()
                    assert page.locator('[data-focus="balanced"]').get_attribute("aria-pressed")=="true"
                    assert page.locator("#mainNav .nav-link").count()==len(PAGES)
                    go(page,"macro")
                    assert "千亿博罗" in page.locator(".base-hero").inner_text()
                    assert "1,005.45" in page.locator(".base-hero").inner_text()
                    assert "10.7" in page.locator(".base-hero").inner_text()
                    assert "1 : 5 : 4" in page.locator(".base-hero").inner_text()
                    assert page.locator("#base-mix-chart .base-mix-row").count()==2
                    page.locator('#base-sector-select [data-base-sector="primary"]').click()
                    assert "+7.8%" in page.locator("#base-sector-detail").inner_text()
                    page.locator('#base-sector-select [data-base-sector="secondary"]').click()
                    assert "549.01亿" in page.locator("#base-sector-detail").inner_text()
                    page.locator('#base-sector-select [data-base-sector="tertiary"]').click()
                    assert "-5.3个百分点" in page.locator("#base-sector-detail").inner_text()
                    page.locator('#base-history-years [data-history-year="2024"]').click()
                    assert "970.87亿" in page.locator("#base-history-detail").inner_text()
                    assert "初步数" in page.locator("#base-history-detail").inner_text()
                    assert "4.2" in page.locator(".base-pulse-insight").inner_text()
                    assert "+1.2%" in page.locator("#base-pulse-chart").inner_text()
                    page.locator('#base-service-tabs [data-service-view="living"]').click()
                    assert "+13.9%" in page.locator("#base-service-content").inner_text()
                    page.locator('#base-service-tabs [data-service-view="tourism"]').click()
                    assert "51.88" in page.locator("#base-service-content").inner_text()
                    page.locator('#base-gap-tabs [data-gap-sector="tertiary"]').click()
                    assert "制造业采购服务金额与来源" in page.locator("#base-gap-content").inner_text()
                    assert page.locator("#base-source-list a").count()==4
                    page.screenshot(path=str(ART/("base-mobile.png" if mobile else "base-desktop.png")),
                      full_page=True,animations="disabled")
                    go(page,"service")
                    assert "服务的机会留在了哪里" in page.locator(".svc-hero").inner_text()
                    assert "34.7" in page.locator(".svc-hero").inner_text()
                    assert "待核实" in page.locator(".svc-hero-insight").inner_text()
                    assert page.locator("#svc-signal-bars [data-svc-signal]").count()==5
                    assert "+1.2%" in page.locator("#svc-signal-bars").inner_text()
                    page.locator('#svc-signal-bars [data-svc-signal="transport"]').click()
                    assert "+7.7%" in page.locator("#svc-signal-bars .active").inner_text()
                    assert "县内工厂" in page.locator("#svc-signal-explain").inner_text()
                    assert page.locator("#svc-matrix .svc-matrix-cell").count()>=20
                    assert "合成Demo" in page.locator("#svc-sample-badge").inner_text()
                    assert page.locator("#svc-sample-strip > div").count()==4
                    assert "百万元" in page.locator("#svc-sample-strip").inner_text()
                    all_edges=page.locator("#svc-sample-strip > div").first.locator("strong").inner_text()
                    page.locator('[data-svc-weight="top10"]').click()
                    top_edges=page.locator("#svc-sample-strip > div").first.locator("strong").inner_text()
                    assert int(top_edges.replace(",","").replace("条",""))<int(all_edges.replace(",","").replace("条",""))
                    assert "权重前10%" in page.locator("#svc-sim-origin").inner_text()
                    assert "筛选造成" in page.locator("#svc-matrix-hint").inner_text()
                    page.locator("#svc-sim-run").click()
                    assert "WHAT-IF" in page.locator("#svc-sim-result").inner_text()
                    page.locator('[data-svc-weight="all"]').click()
                    assert "全部关系" in page.locator("#svc-sim-origin").inner_text()
                    page.locator('#svc-matrix [data-svc-cell="0-0"]').click()
                    assert "样本关系条数" in page.locator("#svc-pair-detail").inner_text()
                    assert "→" in page.locator("#svc-feedback-topic").inner_text()
                    page.locator("#svc-demand").fill("40")
                    page.locator("#svc-response").fill("15")
                    assert "+40%" in page.locator("#svc-demand-value").inner_text()
                    page.locator("#svc-sim-run").click()
                    assert "条件性" in page.locator("#svc-sim-result").inner_text()
                    assert page.locator("#svc-sim-result .svc-sim-metrics > div").count()==3
                    page.locator("#svc-response").fill("60")
                    assert "可以覆盖需求" in page.locator("#svc-sim-result").inner_text()
                    page.locator("#svc-sim-reset").click()
                    assert "+20%" in page.locator("#svc-demand-value").inner_text()
                    assert "+10%" in page.locator("#svc-response-value").inner_text()
                    page.locator('[data-svc-feedback="may-differ"]').click()
                    page.locator("#svc-feedback-save").click()
                    assert "1 条本地反馈" in page.locator("#svc-feedback-count").inner_text()
                    with page.expect_download() as review_info:
                        page.locator("#svc-feedback-export").click()
                    review_dl=review_info.value
                    assert review_dl.suggested_filename=="boluo-service-review.json"
                    page.locator('[data-svc-origin="primary"]').click()
                    assert page.locator('[data-svc-origin="primary"]').get_attribute("aria-pressed")=="true"
                    assert page.locator("#svc-matrix .svc-matrix-cell").count()>0
                    assert "农业" in page.locator("#svc-sim-origin").inner_text()
                    page.locator("#svc-sim-run").click()
                    assert "WHAT-IF" in page.locator("#svc-sim-result").inner_text()
                    page.locator('[data-svc-origin="secondary"]').click()
                    assert "工业" in page.locator("#svc-sim-origin").inner_text()
                    imported_probe=page.evaluate("""() => {
                        const sample=BoluoCore.demo();
                        sample.tables.relations=[{source:"I0001",target:"S0001",type:"professional_service",value:100}];
                        sample.evidence.relations="IMPORTED_UNVERIFIED";
                        BoluoServicePage.render({data:sample});
                        return {
                          label:document.querySelector("#svc-sample-badge").textContent,
                          count:document.querySelector("#svc-sample-strip").textContent,
                          grid:document.querySelectorAll("#svc-matrix .svc-matrix-cell").length
                        };
                    }""")
                    assert "待核验" in imported_probe["label"],imported_probe
                    assert "100.00" in imported_probe["count"],imported_probe
                    assert imported_probe["grid"]>0,imported_probe
                    page.evaluate("() => BoluoServicePage.render({data:BoluoCore.demo()})")
                    page.screenshot(path=str(ART/("service-mobile.png" if mobile else "service-desktop.png")),
                      full_page=True,animations="disabled")
                    go(page,"agri")
                    assert "种得多" in page.locator(".ag-hero").inner_text()
                    assert "107.44" in page.locator(".ag-hero").inner_text()
                    assert page.locator("#ag-real-grid .ag-real-cell").count()==4
                    assert page.locator("#ag-chain-tracks [data-ag-stage]").count()==4
                    page.locator('[data-ag-scope="tea"]').click()
                    assert "2449吨" in page.locator("#ag-real-grid").inner_text()
                    assert "4.32万亩" in page.locator("#ag-real-grid").inner_text()
                    page.locator('[data-ag-scope="county"]').click()
                    assert "107.44亿元" in page.locator("#ag-real-grid").inner_text()
                    page.locator('[data-ag-stage="cash"]').click()
                    assert "付款" in page.locator("#ag-chain-detail").inner_text()
                    assert "63天" in page.locator("#ag-output-metrics").inner_text()
                    assert "212.5万元" in page.locator("#ag-output-metrics").inner_text()
                    assert page.locator("#ag-cash-chart svg").count()==1
                    cash_probe=page.evaluate("""() => {
                      const f=BoluoAgriculturePage.simulate;
                      const a=f({season:25,pick:85,process:90,farmPay:12,channelPay:75,dayCost:10});
                      const b=f({season:25,pick:85,process:90,farmPay:12,channelPay:30,dayCost:10});
                      const c=f({season:25,pick:65,process:90,farmPay:12,channelPay:75,dayCost:10});
                      return {peak:a.peak,day:a.peakDay,delay:a.delay,shorter:b.peak,lessLabor:c.peak,atEnd:a.path.at(-1).amount};
                    }""")
                    assert abs(cash_probe["peak"]-212.5)<0.001,cash_probe
                    assert cash_probe["day"]==36,cash_probe
                    assert cash_probe["delay"]==63,cash_probe
                    assert cash_probe["shorter"]<cash_probe["peak"],cash_probe
                    assert cash_probe["lessLabor"]<cash_probe["peak"],cash_probe
                    assert cash_probe["atEnd"]==0,cash_probe
                    page.locator("#ag-pick").fill("65")
                    assert "162.5万元" in page.locator("#ag-output-metrics").inner_text()
                    page.locator("#ag-reset").click()
                    assert "212.5万元" in page.locator("#ag-output-metrics").inner_text()
                    with page.expect_download() as ag_cash_download:
                        page.locator("#ag-export").click()
                    assert ag_cash_download.value.suggested_filename=="boluo-agriculture-cashflow-demo.json"
                    assert "合成Demo" in page.locator("#ag-network-caveat").inner_text()
                    assert page.locator("#ag-network-stats > div").count()==3
                    page.locator('[data-ag-kind="agricultural_distribution"]').click()
                    assert page.locator('[data-ag-kind="agricultural_distribution"]').get_attribute("aria-pressed")=="true"
                    page.locator('[data-ag-kind="agricultural_processing"]').click()
                    assert page.locator("#ag-network-chart .ag-network-row").count()>0
                    page.locator('[data-ag-question="channel"]').click()
                    assert "合同账期" in page.locator("#ag-questions-detail").inner_text()
                    with page.expect_download() as ag_question_download:
                        page.locator("#ag-export-questions").click()
                    assert ag_question_download.value.suggested_filename=="boluo-agriculture-verification-channel.json"
                    page.screenshot(path=str(ART/("agri-mobile.png" if mobile else "agri-desktop.png")),
                      full_page=True,animations="disabled")
                    go(page,"relations")
                    assert "彼此牵动的一张网" in page.locator(".rl-hero").inner_text()
                    assert page.locator("#rl-stats .rl-stat").count()==4
                    assert "合成Demo" in page.locator("#rl-hero-evidence").inner_text()
                    assert page.locator("#rl-graph-stage svg [data-rl-node]").count()>=8
                    assert page.locator("#rl-graph-stage svg [data-rl-edge]").count()>5
                    assert "可见相关连接" in page.locator("#rl-inspector").inner_text()
                    page.locator('#rl-sector-filters [data-rl-sector="secondary"]').click()
                    assert page.locator('#rl-sector-filters [data-rl-sector="secondary"]').get_attribute("aria-pressed")=="true"
                    page.locator('#rl-sector-filters [data-rl-sector="all"]').click()
                    page.locator("#rl-type-filter").select_option("agricultural_processing")
                    assert "农业加工" in page.locator("#rl-type-filter option:checked").inner_text()
                    assert page.locator("#rl-graph-stage svg [data-rl-node]").count()>0
                    page.locator("#rl-type-filter").select_option("all")
                    page.locator('#rl-mode-buttons [data-rl-mode="actors"]').click()
                    assert page.locator("#rl-graph-stage svg [data-rl-actor]").count()>=2
                    assert "入向关系" in page.locator("#rl-inspector").inner_text()
                    first_actor=page.locator("#rl-graph-stage [data-rl-actor]").first.get_attribute("data-rl-actor")
                    page.locator("#rl-graph-stage [data-rl-actor]").first.click()
                    assert page.locator("#rl-graph-stage svg [data-rl-actor]").count()>=2
                    page.locator("#rl-shock").fill("60")
                    assert "60%" in page.locator("#rl-shock-value").inner_text()
                    page.locator("#rl-run").click()
                    assert "实验完成" in page.locator("#rl-results").inner_text()
                    assert "三步" not in page.locator("#rl-results .rl-run-header").inner_text()
                    assert page.locator("#rl-results .rl-wave-row").count()==3
                    page.locator("#rl-reset").click()
                    assert page.locator('#rl-mode-buttons [data-rl-mode="structure"]').get_attribute("aria-pressed")=="true"
                    assert "35%" in page.locator("#rl-shock-value").inner_text()
                    page.screenshot(path=str(ART/("relations-mobile.png" if mobile else "relations-desktop.png")),
                      full_page=True,animations="disabled")
                    go(page,"industry")
                    assert "投资却踩下刹车" in page.locator(".in-hero").inner_text()
                    assert "+8.7" in page.locator(".in-hero").inner_text()
                    assert page.locator("#in-industry-chart svg [data-industrial-key]").count()==5
                    assert page.locator("#in-region-chart svg [data-region-key]").count()==4
                    page.locator('[data-industrial-year="2024"]').click()
                    assert "+10.5%" in page.locator("#in-year-comparison").inner_text()
                    assert "工业与投资都在增长" in page.locator("#in-year-headline").inner_text()
                    page.locator('[data-industrial-year="2025"]').click()
                    assert "-12.7%" in page.locator("#in-year-comparison").inner_text()
                    page.locator('[data-industrial-chart="rank"]').click()
                    assert page.locator("#in-industry-chart .in-lolli").count()==5
                    page.locator('#in-industry-chart [data-industrial-key="rubber"]').click()
                    assert "-4.2%" in page.locator("#in-industry-detail").inner_text()
                    page.locator('[data-industrial-chart="scatter"]').click()
                    assert page.locator("#in-industry-chart svg [data-industrial-key]").count()==5
                    page.locator('#in-size-tabs [data-size="medium"]').click()
                    assert "+4.8%" in page.locator("#in-size-detail").inner_text()
                    page.locator('#in-region-pills [data-region-key="sihui"]').click()
                    assert "-1.2%" in page.locator("#in-region-detail").inner_text()
                    assert page.locator("#in-capacity-grid .in-capacity-cell").count()==5
                    assert page.locator("#in-source-entries a").count()>=5
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
                    assert "1,005.45" in page.locator(".base-hero").inner_text()
                    assert page.locator("#base-history-chart svg").count()==1
                    assert page.locator("#base-pulse-chart .base-growth-row").count()==3
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
                    assert "1,150" in page.locator("#base-gdp-total").inner_text()
                    assert "待核验" in page.locator("#base-gdp-growth").inner_text()
                    page.locator('#base-history-years [data-history-year="2025"]').click()
                    assert "1,150.00亿" in page.locator("#base-history-detail").inner_text()
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
                    assert "1,150" in page.locator("#base-gdp-total").inner_text()
                    assert "待核验" in page.locator("#base-gdp-growth").inner_text()
                    page.locator('#base-history-years [data-history-year="2025"]').click()
                    assert "1,150.00亿" in page.locator("#base-history-detail").inner_text()
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
                    go(page,"industry")
                    page.screenshot(path=str(ART/("industry-mobile.png" if mobile else "industry-desktop.png")),
                      full_page=True,animations="disabled")
                    go(page,"mission")
                    page.screenshot(path=str(ART/("full-mobile.png" if mobile else "full-desktop.png")),
                      full_page=True,animations="disabled")
                    ctx.close()
            finally:browser.close()
    finally:
        server.terminate()
        try:server.wait(timeout=5)
        except subprocess.TimeoutExpired:server.kill()
    print("PASS: full studio public, all 19 workspaces, scenario, SNA, projects, workforce, survey, models, ZIP, XLSX/CSV, report, desktop/mobile.")

if __name__=="__main__":
    main()