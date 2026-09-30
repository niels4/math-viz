"""sRGB <-> OKLCH conversions (Björn Ottosson's Oklab), no dependencies.

python src/oklch.py '#FF26B6' 'rgb(254,140,219)'   -> prints oklch(L C H) per color
python src/oklch.py 'oklch(0.65 0.25 0)'           -> prints #RRGGBB
"""

from __future__ import annotations

import math
import re
import sys

RGB = tuple[int, int, int]
LCH = tuple[float, float, float]


def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _linear_to_srgb(c: float) -> float:
    return c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def srgb_to_oklch(rgb: RGB) -> LCH:
    r, g, b = (_srgb_to_linear(v / 255) for v in rgb)
    l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = (math.copysign(abs(v) ** (1 / 3), v) for v in (l_, m_, s_))
    lum = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    c = math.hypot(a, bb)
    h = math.degrees(math.atan2(bb, a)) % 360
    return (lum, c, h)


def oklch_to_srgb(lch: LCH, clamp: bool = True) -> tuple[float, float, float]:
    """Return sRGB 0..255 floats (unclamped if clamp=False, to detect gamut overflow)."""
    lum, c, h = lch
    a = c * math.cos(math.radians(h))
    bb = c * math.sin(math.radians(h))
    l_ = lum + 0.3963377774 * a + 0.2158037573 * bb
    m_ = lum - 0.1055613458 * a - 0.0638541728 * bb
    s_ = lum - 0.0894841775 * a - 1.2914855480 * bb
    l_, m_, s_ = (v**3 for v in (l_, m_, s_))
    r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
    g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
    b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_
    out = tuple(_linear_to_srgb(v) * 255 for v in (r, g, b))
    if clamp:
        out = tuple(min(255.0, max(0.0, v)) for v in out)
    assert len(out) == 3
    return out


def parse(color: str) -> RGB | LCH:
    color = color.strip()
    if m := re.fullmatch(r"#?([0-9a-fA-F]{6})", color):
        hx = m.group(1)
        return (int(hx[0:2], 16), int(hx[2:4], 16), int(hx[4:6], 16))
    if m := re.fullmatch(r"rgb\(\s*(\d+)\s*,?\s*(\d+)\s*,?\s*(\d+)\s*\)", color):
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    if m := re.fullmatch(r"oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)", color):
        return (float(m.group(1)), float(m.group(2)), float(m.group(3)))
    raise SystemExit(f"cannot parse color {color!r}")


def fmt_oklch(lch: LCH) -> str:
    return f"oklch({lch[0]:.4f} {lch[1]:.4f} {lch[2]:.2f})"


def fmt_hex(rgb: tuple[float, float, float]) -> str:
    return "#" + "".join(f"{int(round(v)):02X}" for v in rgb)


def main(argv: list[str]) -> None:
    for arg in argv:
        parsed = parse(arg)
        if isinstance(parsed[0], int):
            rgb = (int(parsed[0]), int(parsed[1]), int(parsed[2]))
            lch = srgb_to_oklch(rgb)
            back = oklch_to_srgb(lch)
            print(f"{arg:>22s} -> {fmt_oklch(lch)}  (roundtrip {fmt_hex(back)})")
        else:
            lch = (float(parsed[0]), float(parsed[1]), float(parsed[2]))
            raw = oklch_to_srgb(lch, clamp=False)
            gamut = (
                ""
                if all(-0.5 <= v <= 255.5 for v in raw)
                else f"  OUT OF GAMUT raw={tuple(round(v) for v in raw)}"
            )
            print(
                f"{arg:>22s} -> {fmt_hex(oklch_to_srgb(lch))} rgb{tuple(int(round(v)) for v in oklch_to_srgb(lch))}{gamut}"
            )


if __name__ == "__main__":
    main(sys.argv[1:])
