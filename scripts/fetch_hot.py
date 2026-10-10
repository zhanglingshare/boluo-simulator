#!/usr/bin/env python3
"""每天拉12源热搜，过滤博罗关键词，生成hot.json"""
import json, urllib.request, ssl
from datetime import datetime

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

SOURCES = [
    ("微博", "https://api.vvhan.com/api/hotlist/wbHot"),
    ("百度", "https://api.vvhan.com/api/hotlist/baiduRD"),
    ("知乎", "https://api.vvhan.com/api/hotlist/zhihuHot"),
    ("抖音", "https://api.vvhan.com/api/hotlist/douyinHot"),
    ("头条", "https://api.vvhan.com/api/hotlist/toutiao"),
    ("B站", "https://api.vvhan.com/api/hotlist/bili"),
    ("微信", "https://api.vvhan.com/api/hotlist/weixin"),
    ("澎湃", "https://api.vvhan.com/api/hotlist/thepaper"),
    ("人民", "https://api.vvhan.com/api/hotlist/people"),
    ("网易", "https://api.vvhan.com/api/hotlist/wangyi"),
    ("新浪", "https://api.vvhan.com/api/hotlist/sina"),
    ("环球", "https://api.vvhan.com/api/hotlist/huanqiu"),
]

KW = ["博罗","罗浮山","园洲","石湾","罗阳","龙溪","柏塘","福田","长宁","横河",
      "公庄","杨村","观音阁","泰美","龙华","惠州","东江","赣深","菜心","山茶",
      "荔枝","龙眼","花生","古村","象头山","酥醪","大湾区"]

all_items = []
for name, url in SOURCES:
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=12, context=ctx) as r:
            data = json.loads(r.read())
        items = data.get("data", [])
        for it in items[:20]:
            title = it.get("title","")
            if any(k in title for k in KW):
                all_items.append({"title": title, "source": name, "hot": it.get("hot","")})
    except Exception as e:
        print(f"{name} fail: {e}")

result = {
    "updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
    "count": len(all_items),
    "items": all_items[:20]
}

with open("hot.json","w",encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"done: {len(all_items)} items")
