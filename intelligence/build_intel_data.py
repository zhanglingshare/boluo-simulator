#!/usr/bin/env python3
"""把 intelligence 四个 JSON 编译成浏览器可直读的 intel-data.js（window.BOLUO_INTEL）。
单一数据源仍是 *.json；本脚本只负责生成，避免 file:// 下 fetch 被拦。
改完 JSON 后重跑：python3 build_intel_data.py
"""
import json, os

d = os.path.dirname(os.path.abspath(__file__))
FILES = ["topics", "evidence", "viewpoints", "watchlist"]
bundle = {}
for f in FILES:
    with open(os.path.join(d, f + ".json"), encoding="utf-8") as fh:
        bundle[f] = json.load(fh)

out = (
    "/* 自动生成，请勿手改。数据源：同目录 topics/evidence/viewpoints/watchlist.json；\n"
    "   改完 JSON 后运行 build_intel_data.py 重新生成。 */\n"
    "window.BOLUO_INTEL = "
    + json.dumps(bundle, ensure_ascii=False, indent=2)
    + ";\n"
)
with open(os.path.join(d, "intel-data.js"), "w", encoding="utf-8") as fh:
    fh.write(out)
print("已生成 intel-data.js（%d 字节）" % len(out.encode("utf-8")))
