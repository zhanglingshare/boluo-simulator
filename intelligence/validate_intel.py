#!/usr/bin/env python3
"""观点情报引擎数据包校验：JSON合法性 + 引用完整性 + 来源与非民意字段。
用法: python3 validate_intel.py [intelligence目录]
退出码 0=通过, 1=有错误。
"""
import json, os, sys

errs = []
def err(m): errs.append(m)

def load(d, fn):
    p = os.path.join(d, fn)
    if not os.path.exists(p):
        err(f"缺少文件 {fn}"); return None
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        err(f"{fn} JSON解析失败: {e}"); return None

CONF = {"高", "中高", "中", "低"}
RELIAB = {"A", "B", "C", "D"}

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
    topics = load(d, "topics.json")
    evidence = load(d, "evidence.json")
    viewpoints = load(d, "viewpoints.json")
    watchlist = load(d, "watchlist.json")
    if not all([topics, evidence, viewpoints, watchlist]):
        return finish()

    ev_ids = {e["evidence_id"] for e in evidence["evidence"]}
    tp_ids = {t["topic_id"] for t in topics["topics"]}
    wl_ids = {w["watch_id"] for w in watchlist["watchlist"]}

    # evidence 必备字段与url
    for e in evidence["evidence"]:
        eid = e.get("evidence_id", "?")
        for k in ("statement","metric","period","source_type","reliability","source","url"):
            if not e.get(k):
                err(f"证据 {eid} 缺字段 {k}")
        if not str(e.get("url","")).startswith("http"):
            err(f"证据 {eid} 缺少真实 http(s) url")
        if e.get("reliability") not in RELIAB:
            err(f"证据 {eid} 可信度非法: {e.get('reliability')}")

    # topics 引用
    for t in topics["topics"]:
        tid = t.get("topic_id", "?")
        for eid in t.get("evidence_ids", []):
            if eid not in ev_ids:
                err(f"议题 {tid} 引用了不存在的证据 {eid}")
        if t.get("evidence_sufficiency") == "insufficient" and t.get("status") == "active":
            pass  # 允许证据不足议题存在，仅应少给观点

    # viewpoints 引用 + 合规字段
    for v in viewpoints["viewpoints"]:
        vid = v.get("viewpoint_id", "?")
        if v.get("origin") != "ai_synthesized":
            err(f"观点 {vid} origin 应为 ai_synthesized（当前 {v.get('origin')}）")
        if v.get("population_representativeness") != "not_established":
            err(f"观点 {vid} 必须含 population_representativeness=not_established")
        if v.get("topic_id") not in tp_ids:
            err(f"观点 {vid} 引用了不存在的议题 {v.get('topic_id')}")
        if v.get("confidence") not in CONF:
            err(f"观点 {vid} 置信度非法: {v.get('confidence')}")
        for k in ("position_archetype","structural_position","information_environment",
                  "claim","blind_spot","review_status","generated_at","source_refs"):
            if not v.get(k):
                err(f"观点 {vid} 缺字段 {k}")
        for eid in v.get("support_evidence_ids", []) + v.get("contradict_evidence_ids", []):
            if eid not in ev_ids:
                err(f"观点 {vid} 引用了不存在的证据 {eid}")
        for wid in v.get("discriminating_tests", []):
            if wid not in wl_ids:
                err(f"观点 {vid} 引用了不存在的鉴别项 {wid}")
        if not v.get("source_refs"):
            err(f"观点 {vid} 缺 source_refs")
        for u in v.get("source_refs", []):
            if not str(u).startswith("http"):
                err(f"观点 {vid} source_refs 含非 http 来源")

    # watchlist 引用
    for w in watchlist["watchlist"]:
        if w.get("topic_id") not in tp_ids:
            err(f"鉴别项 {w.get('watch_id')} 引用了不存在的议题")

    # 每个议题至少有1个观点；证据不足议题应明确克制
    from collections import defaultdict
    by_topic = defaultdict(int)
    for v in viewpoints["viewpoints"]:
        by_topic[v["topic_id"]] += 1
    for t in topics["topics"]:
        if by_topic[t["topic_id"]] < 1:
            err(f"议题 {t['topic_id']} 没有任何观点")

    return finish()

def finish():
    if errs:
        print("校验失败:")
        for e in errs: print("  -", e)
        sys.exit(1)
    print("情报数据包校验通过：JSON合法 / 证据ID引用完整 / 来源URL齐全 / 非民意标识完整")
    sys.exit(0)

if __name__ == "__main__":
    main()
