#!/usr/bin/env python3
"""v11 深色页 → 浅色高级设计系统 配色转换器。

用法:
  python3 tools/lighten_v11.py rules     # 生成 v11/light-v11.css 覆盖层（不改原文件）
  python3 tools/lighten_v11.py inline    # 直接改写单页内联 CSS/JS 配色（index/baseplan/capability）

设计原则:
  · 只处理“深色规则”:规则里出现深色背景、或出现近白色文字、或边框为深色
  · 按角色映射: 背景→浅色表面 / 文字→深墨 / 边框→浅灰线 / 强调色→按色相落到统一色板
  · 渐变、rgba 逐个颜色处理，保留 alpha
  · 蓝底白字的按钮保持白字（强色相填充视为强调面）
"""
from __future__ import annotations
import colorsys
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V11 = ROOT / "v11"

# ---------- 颜色工具 ----------

def parse_hex(tok: str):
    m = re.fullmatch(r"#([0-9a-fA-F]{3,8})", tok.strip())
    if not m:
        return None
    h = m.group(1)
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) in (6, 8):
        r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
        return r, g, b, a
    return None


def to_hex(rgb, a=None):
    r, g, b = (max(0, min(255, round(c))) for c in rgb)
    out = "#%02x%02x%02x" % (r, g, b)
    if a is not None and a < 0.999:
        out += "%02x" % max(0, min(255, round(a * 255)))
    return out


def hsl(rgb):
    r, g, b = (c / 255 for c in rgb)
    return colorsys.rgb_to_hls(r, g, b)  # h,l,s


def from_hsl(h, l, s):
    r, g, b = colorsys.hls_to_rgb(h, max(0, min(1, l)), max(0, min(1, s)))
    return (r * 255, g * 255, b * 255)


def lum(rgb):
    r, g, b = rgb
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255


def esat(rgb):
    """有效饱和度：白/灰/黑都接近 0，避免把 #fff 当成高饱和色。"""
    h, l, s = hsl(rgb)
    return s * (1 - abs(2 * l - 1))


def is_accent(rgb):
    h, l, s = hsl(rgb)
    return esat(rgb) > 0.42 and 0.22 < l < 0.72


def hue_family(rgb):
    h, l, s = hsl(rgb)
    deg = h * 360
    if 165 <= deg <= 200:
        return "cyan"
    if 200 <= deg <= 235:
        return "blue"
    if 235 < deg <= 290:
        return "violet"
    if 290 < deg <= 340:
        return "pink"
    if deg >= 340 or deg <= 18:
        return "red"
    if 18 < deg <= 42:
        return "orange"
    if 42 < deg <= 70:
        return "gold"
    if 70 < deg <= 165:
        return "green"
    return "neutral"


# 统一色板（与 legacy 浅色版一致）
PALETTE = {
    "blue": (10, 132, 255),
    "cyan": (10, 127, 149),
    "teal": (10, 127, 149),
    "green": (47, 158, 68),
    "orange": (226, 87, 0),
    "amber": (178, 91, 0),
    "gold": (178, 91, 0),
    "red": (201, 59, 59),
    "violet": (124, 58, 237),
    "pink": (190, 24, 93),
    "neutral": (95, 103, 115),
}

INK = (18, 22, 28)
INK2 = (95, 103, 115)
MUTED = (111, 124, 140)
LINE = (226, 232, 240)
SURFACE = (255, 255, 255)
SURFACE2 = (246, 247, 249)


def accent_rgb(rgb):
    """按色相把强调色落到统一色板。"""
    return PALETTE[hue_family(rgb)]


def remap(rgb, role, accent_fill=False):
    """role: surface | text | line | shadow"""
    if role == "surface":
        l = hsl(rgb)[1]
        if l > 0.85 and esat(rgb) < 0.30:
            return rgb
        if is_accent(rgb):
            # 强调面（按钮、标签）保持色相，统一到色板
            return accent_rgb(rgb)
        h, l, s = hsl(rgb)
        if l < 0.52:                      # 深色背景 → 近白表面
            return from_hsl(h, 0.965, min(s, 0.22))
        if l < 0.80:                      # 中灰底 → 浅灰面
            return from_hsl(h, 0.94, min(s, 0.20))
        return rgb                        # 已经是浅底
    if role == "text":
        if accent_fill:
            return (255, 255, 255)        # 蓝底白字保持
        h, l, s = hsl(rgb)
        e = esat(rgb)
        if l > 0.85 and e < 0.30:         # 近白文字 → 深墨
            return INK
        if e > 0.35:                      # 浅色强调字 → 深强调
            return accent_rgb(rgb)
        if l > 0.62:                      # 浅色文字 → 深墨
            return from_hsl(h, 0.135, min(s, 0.30))
        if l > 0.45:                      # 中亮文字 → 次级墨
            return from_hsl(h, 0.38, min(s, 0.22))
        return rgb
    if role == "line":
        h, l, s = hsl(rgb)
        if l < 0.55:
            return from_hsl(h, 0.885, min(s, 0.14))
        return rgb
    if role == "shadow":
        h, l, s = hsl(rgb)
        if l < 0.5:
            return from_hsl(h, 0.35, min(s, 0.35))
        return rgb
    return rgb


COLOR_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGBA_RE = re.compile(r"rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)")


CONTROL_RE = re.compile(r"hero|stage|band|section|panel|wrap|page|screen|shell|frame|surface|canvas", re.I)


def remap_value(value: str, role: str, accent_fill: bool, force_light: bool = False):
    def hex_sub(m):
        p = parse_hex(m.group(0))
        if not p:
            return m.group(0)
        r, g, b, a = p
        if force_light and role == "surface" and esat((r, g, b)) > 0.25:
            h, l, sa = hsl((r, g, b))
            if l < 0.72:
                return to_hex(from_hsl(h, 0.96, min(esat((r, g, b)), 0.30)), a)
        if (r, g, b) == (255, 255, 255) or (r, g, b) == (0, 0, 0):
            # 纯白/纯黑按角色处理
            if role == "surface" and not accent_fill:
                return to_hex(remap((r, g, b), role))
            if role == "text" and (r, g, b) == (255, 255, 255) and accent_fill:
                return m.group(0)
            if role == "text" and (r, g, b) == (255, 255, 255):
                return to_hex(INK, a)
            if role == "text" and (r, g, b) == (0, 0, 0):
                return m.group(0)
            if role == "line":
                return to_hex(LINE, a)
            return m.group(0)
        return to_hex(remap((r, g, b), role, accent_fill), a)

    out = COLOR_RE.sub(hex_sub, value)

    def rgba_sub(m):
        r, g, b = float(m.group(1)), float(m.group(2)), float(m.group(3))
        a = float(m.group(4)) if m.group(4) not in (None, "") else 1.0
        if role == "text" and (r, g, b) == (255, 255, 255) and accent_fill:
            return m.group(0)
        nr, ng, nb = remap((r, g, b), role, accent_fill)
        if role == "text":
            return "rgba(%d,%d,%d,1)" % (nr, ng, nb)
        return "rgba(%d,%d,%d,%s)" % (nr, ng, nb, ("%g" % a))

    return RGBA_RE.sub(rgba_sub, out)


def role_of(prop: str) -> str:
    p = prop.strip().lower()
    if p.startswith("background") or p in ("fill",):
        return "surface"
    if p == "color":
        return "text"
    if p in ("fill",):
        return "text"
    if p.startswith("border") or p.startswith("outline") or "stroke" in p or p in ("stroke", "text-decoration-color", "column-rule", "text-decoration"):
        return "line"
    if "shadow" in p:
        return "shadow"
    return "other"


# ---------- CSS 解析 ----------

def split_rules(css: str):
    """yield (prefix, selector, body) — 保留 @media / @supports 包裹。"""
    i = 0
    n = len(css)
    while i < n:
        b = css.find("{", i)
        if b < 0:
            break
        sel = css[i:b].strip()
        # 跳过注释
        if sel.startswith("/*"):
            e = css.find("*/", i)
            i = (e + 2) if e >= 0 else n
            continue
        if sel.startswith("@media") or sel.startswith("@supports") or sel.startswith("@container"):
            # 找到配对的 }
            depth = 1
            j = b + 1
            while j < n and depth:
                if css[j] == "{":
                    depth += 1
                elif css[j] == "}":
                    depth -= 1
                j += 1
            inner = css[b + 1:j - 1]
            for pre, s2, body2 in split_rules(inner):
                yield (sel, s2, body2)
            i = j
            continue
        # 普通规则
        e = css.find("}", b)
        if e < 0:
            break
        yield ("", sel, css[b + 1:e])
        i = e + 1


def rule_colors(body: str):
    return COLOR_RE.findall(body)


def is_dark_rule(sel: str, body: str):
    """判定这条规则是否属于深色体系。"""
    if "background-clip:text" in body.replace(" ", "") or "-webkit-text-fill-color:transparent" in body.replace(" ", ""):
        return True
    bg_dark = False
    text_light = False
    for decl in body.split(";"):
        if ":" not in decl:
            continue
        prop, val = decl.split(":", 1)
        val = re.sub(r"(?<![-\w])white(?![-\w])", "#ffffff", val)
        val = re.sub(r"(?<![-\w])black(?![-\w])", "#000000", val)
        role = role_of(prop)
        if role == "surface":
            for c in COLOR_RE.findall(val):
                p = parse_hex(c)
                if p and lum(p[:3]) < 0.45:
                    bg_dark = True
            for m in RGBA_RE.finditer(val):
                rgb = (float(m.group(1)), float(m.group(2)), float(m.group(3)))
                if lum(rgb) < 0.45:
                    bg_dark = True
        if role == "text":
            for c in COLOR_RE.findall(val):
                p = parse_hex(c)
                if p and lum(p[:3]) > 0.72 and esat(p[:3]) < 0.55:
                    text_light = True
            for m in RGBA_RE.finditer(val):
                rgb = (float(m.group(1)), float(m.group(2)), float(m.group(3)))
                if lum(rgb) > 0.72 and esat(rgb) < 0.55:
                    text_light = True
    return bg_dark or text_light


def has_text_decl(body: str) -> bool:
    for decl in body.split(";"):
        if ":" not in decl:
            continue
        prop, val = decl.split(":", 1)
        if role_of(prop) in ("text", "line") and (COLOR_RE.search(val) or RGBA_RE.search(val) or re.fullmatch(r"\s*(white|black)\s*", val)):
            return True
    return False


def rule_bg_dark(body: str) -> bool:
    for decl in body.split(";"):
        if ":" not in decl:
            continue
        prop, val = decl.split(":", 1)
        if role_of(prop) != "surface":
            continue
        for c in COLOR_RE.findall(val):
            p = parse_hex(c)
            if p and p[3] >= 0.3 and lum(p[:3]) < 0.45:
                return True
        for m in RGBA_RE.finditer(val):
            a = float(m.group(4)) if m.group(4) not in (None, "") else 1.0
            rgb = (float(m.group(1)), float(m.group(2)), float(m.group(3)))
            if a >= 0.3 and lum(rgb) < 0.45:
                return True
    return False


def has_accent_fill(body: str):
    for decl in body.split(";"):
        if ":" not in decl:
            continue
        prop, val = decl.split(":", 1)
        if role_of(prop) == "surface":
            for c in COLOR_RE.findall(val):
                p = parse_hex(c)
                if p and p[3] >= 0.3 and is_accent(p[:3]):
                    return True
            for m in RGBA_RE.finditer(val):
                a = float(m.group(4)) if m.group(4) not in (None, "") else 1.0
                rgb = (float(m.group(1)), float(m.group(2)), float(m.group(3)))
                if a >= 0.3 and is_accent(rgb):
                    return True
    return False


SKIP_PROPS = ("background-image",)  # 图片/纹理不动


def has_var_bg(body: str) -> bool:
    for decl in body.split(";"):
        if ":" not in decl:
            continue
        prop, val = decl.split(":", 1)
        if role_of(prop) == "surface" and "var(--" in val:
            return True
    return False


def transform_rule(body: str, bg_dark: bool = True, sel: str = ""):
    text_clip = ("background-clip:text" in body.replace(" ", "")) or ("-webkit-text-fill-color:transparent" in body.replace(" ", ""))
    accent_fill = (not text_clip) and (has_accent_fill(body) or has_var_bg(body))
    changed = []
    for decl in body.split(";"):
        if ":" not in decl:
            continue
        prop, val = decl.split(":", 1)
        val = re.sub(r"(?<![-\w])white(?![-\w])", "#ffffff", val)
        val = re.sub(r"(?<![-\w])black(?![-\w])", "#000000", val)
        role = role_of(prop)
        if text_clip and role == "surface":
            role = "text"
        if role == "other" or prop.strip().lower() in SKIP_PROPS:
            continue
        if not (COLOR_RE.search(val) or RGBA_RE.search(val)):
            continue
        new = remap_value(val, role, accent_fill, force_light=bool(CONTROL_RE.search(sel)))
        if new != val:
            changed.append((prop.strip(), val.strip(), new.strip()))
    return changed


def build_override():
    targets = [
        "discovery.css", "base-target-v2.css", "base-target-compare.css",
        "future.css", "impact.css", "impact-premium.css", "plan.css",
        "plan-ux.css", "plan-premium.css", "industry-structure.css",
        "visual-story.css",
        # 2026-11-24 追加：此前判定为「已浅色」但 story 面板仍为深色的 5 页
        "region.css", "brief.css", "challenge.css",
        "insight-workbench.css", "insight-discovery.css",
        "wind.css", "wind-exp.css", "wind-pathway.css",
    ]
    out = []
    out.append("/* =====================================================================\n"
               "   v11 浅色高级设计系统 · 深色页覆盖层\n"
               "   由 tools/lighten_v11.py 生成：只覆盖原 CSS 中属于深色体系的规则。\n"
               "   加载顺序：必须在页面原有样式之后。\n"
               "   ===================================================================== */\n")
    total = 0
    for fn in targets:
        path = V11 / fn
        if not path.exists():
            continue
        css = path.read_text(encoding="utf-8")
        buf = []
        for media, sel, body in split_rules(css):
            if not (is_dark_rule(sel, body) or has_text_decl(body)):
                continue
            changed = transform_rule(body, rule_bg_dark(body), sel)
            if not changed:
                continue
            decls = ";".join("%s:%s!important" % (p, v) for p, _, v in changed)
            rule = "%s{%s}" % (sel.replace("\n", " "), decls)
            if media:
                rule = "%s{%s}" % (media, rule)
            buf.append(rule)
        if buf:
            out.append("\n/* ---- %s : %d 条 ---- */\n" % (fn, len(buf)))
            out.append("\n".join(buf) + "\n")
            total += len(buf)
    tune = ROOT / "tools" / "light_tune.css"
    if tune.exists():
        out.append("\n/* =====================================================================\n"
                   "   人工微调层（tools/light_tune.css）\n"
                   "   ===================================================================== */\n")
        out.append(tune.read_text(encoding="utf-8"))
    text = "".join(out)
    (V11 / "light-v11.css").write_text(text, encoding="utf-8")
    print("wrote v11/light-v11.css  rules=%d  bytes=%d" % (total, len(text)))


def build_inline(page: str, out_name: str):
    """把单页内联 <style> 也走一遍映射，生成该页专属覆盖层。"""
    html = (V11 / page).read_text(encoding="utf-8")
    css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S))
    out = ["/* =====================================================================\n"
           "   %s 浅色覆盖层（内联样式映射，tools/lighten_v11.py 生成）\n"
           "   ===================================================================== */\n" % page]
    n = 0
    for media, sel, body in split_rules(css):
        if "backdrop" in sel:
            continue
        if not (is_dark_rule(sel, body) or has_text_decl(body)):
            continue
        changed = transform_rule(body, rule_bg_dark(body), sel)
        if not changed:
            continue
        decls = ";".join("%s:%s!important" % (pr, v) for pr, _, v in changed)
        rule = "%s{%s}" % (sel.replace("\n", " "), decls)
        if media:
            rule = "%s{%s}" % (media, rule)
        out.append(rule)
        n += 1
    tune = ROOT / "tools" / ("tune_" + out_name)
    if tune.exists():
        out.append("\n/* 人工微调 */\n")
        out.append(tune.read_text(encoding="utf-8"))
    (V11 / out_name).write_text("\n".join(out) + "\n", encoding="utf-8")
    print("wrote v11/%s rules=%d" % (out_name, n))


def build_root_index():
    """仓库根 index.html（落地页）内联样式映射。"""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", html, re.S))
    out = ["/* 根落地页浅色覆盖层（tools/lighten_v11.py 生成） */\n"]
    n = 0
    for media, sel, body in split_rules(css):
        if "backdrop" in sel:
            continue
        if not (is_dark_rule(sel, body) or has_text_decl(body)):
            continue
        changed = transform_rule(body, rule_bg_dark(body), sel)
        if not changed:
            continue
        decls = ";".join("%s:%s!important" % (pr, v) for pr, _, v in changed)
        rule = "%s{%s}" % (sel.replace("\n", " "), decls)
        if media:
            rule = "%s{%s}" % (media, rule)
        out.append(rule)
        n += 1
    tune = ROOT / "tools" / "tune_light-index.css"
    if tune.exists():
        out.append("\n/* 人工微调 */\n")
        out.append(tune.read_text(encoding="utf-8"))
    (ROOT / "light-index.css").write_text("\n".join(out) + "\n", encoding="utf-8")
    print("wrote light-index.css rules=%d" % n)



def build_lab():
    """lab-2032 决策实验室：把 7 份深色页面 CSS 映射成浅色覆盖层。"""
    lab = ROOT / "lab-2032"
    out = ["/* =====================================================================\n"
           "   博罗2032 决策实验室 · 浅色高级设计系统覆盖层\n"
           "   由 tools/lighten_v11.py lab 生成：原 CSS 一行未改。\n"
           "   ===================================================================== */\n"]
    total = 0
    for path in sorted(lab.glob("*.css")):
        if path.name.startswith("light-"):
            continue
        css = path.read_text(encoding="utf-8")
        buf = []
        for media, sel, body in split_rules(css):
            if not (is_dark_rule(sel, body) or has_text_decl(body)):
                continue
            changed = transform_rule(body, rule_bg_dark(body), sel)
            if not changed:
                continue
            decls = ";".join("%s:%s!important" % (p_, v) for p_, _, v in changed)
            rule = "%s{%s}" % (sel.replace("\n", " "), decls)
            if media:
                rule = "%s{%s}" % (media, rule)
            buf.append(rule)
        if buf:
            out.append("\n/* ---- %s : %d 条 ---- */\n" % (path.name, len(buf)))
            out.append("\n".join(buf) + "\n")
            total += len(buf)
    tune = ROOT / "tools" / "tune_light-lab.css"
    if tune.exists():
        out.append("\n/* =====================================================================\n"
                   "   人工微调层（tools/tune_light-lab.css）\n"
                   "   ===================================================================== */\n")
        out.append(tune.read_text(encoding="utf-8"))
    text = "".join(out)
    (lab / "light-lab.css").write_text(text, encoding="utf-8")
    print("wrote lab-2032/light-lab.css  rules=%d  bytes=%d" % (total, len(text)))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "rules"
    if cmd == "rules":
        build_override()
    if cmd == "inline":
        build_inline("baseplan.html", "light-baseplan.css")
        build_inline("capability.html", "light-capability.css")
    if cmd == "lab":
        build_lab()
    if cmd == "root":
        build_root_index()
