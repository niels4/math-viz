"""Compare a glowing ring marker + dashed drop line between a reference PNG and a screenshot.

    python src/sample_marker.py REF SHOT [--scale 0.6667] [--ref-box x0 y0 x1 y1] [--shot-box x0 y0 x1 y1]
                                [--crop-dir /tmp]

For each image the marker center is the centroid of saturated pink pixels (the disc) inside the search
box. Prints, side by side, the median radial color profile (median over angles, so the chart line and the
drop line do not skew it) with the screenshot radius mapped onto the reference radius via --scale, and the
run-length pattern of the drop line below the ring (stem, gaps, dashes, stroke width). Writes 6x
nearest-neighbour crops of both markers for eyeballing.
"""

from __future__ import annotations

import argparse
import math
import statistics
from collections.abc import Sequence

from PIL import Image

from oklch import fmt_oklch, srgb_to_oklch

RGB = tuple[int, int, int]
Box = tuple[int, int, int, int]


def hexs(p: RGB) -> str:
    return f"#{p[0]:02X}{p[1]:02X}{p[2]:02X}"


def px(im: Image.Image, x: int, y: int) -> RGB:
    x = min(max(x, 0), im.width - 1)
    y = min(max(y, 0), im.height - 1)
    p = im.getpixel((x, y))
    assert isinstance(p, tuple)
    return (p[0], p[1], p[2])


def is_disc_pink(p: RGB) -> bool:
    r, g, b = p
    return r > 225 and g < 90 and b > 110 and b < 235


def find_center(im: Image.Image, box: Box) -> tuple[float, float]:
    x0, y0, x1, y1 = box
    xs: list[int] = []
    ys: list[int] = []
    for y in range(y0, y1):
        for x in range(x0, x1):
            if is_disc_pink(px(im, x, y)):
                xs.append(x)
                ys.append(y)
    if len(xs) < 20:
        raise SystemExit(f"only {len(xs)} disc pixels found in {box}")
    # keep the densest blob: drop pixels far from the median (rejects the drop line / legend dot)
    mx, my = statistics.median(xs), statistics.median(ys)
    keep = [(x, y) for x, y in zip(xs, ys, strict=True) if abs(x - mx) < 25 and abs(y - my) < 25]
    return statistics.mean(x for x, _ in keep), statistics.mean(y for _, y in keep)


def radial_median(
    im: Image.Image, cx: float, cy: float, rad: float, skip: Sequence[tuple[float, float]]
) -> RGB:
    samples: list[RGB] = []
    n = max(16, int(4 * math.pi * rad))
    for i in range(n):
        a = 2 * math.pi * i / n
        deg = math.degrees(a) % 360
        if any(lo <= deg <= hi for lo, hi in skip):
            continue
        samples.append(
            px(im, int(round(cx + rad * math.cos(a))), int(round(cy + rad * math.sin(a))))
        )
    return (
        int(statistics.median(s[0] for s in samples)),
        int(statistics.median(s[1] for s in samples)),
        int(statistics.median(s[2] for s in samples)),
    )


def column_runs(
    im: Image.Image, cx: int, y0: int, y1: int, bg_col_offset: int = 6
) -> list[tuple[str, int, int, RGB]]:
    """Run-length encode the drop line column into dash/gap runs, 'on' = clearly pinker than 6px aside."""
    runs: list[tuple[str, int, int, RGB]] = []
    cur = None
    start = y0
    peak: RGB = (0, 0, 0)
    for y in range(y0, y1):
        p = px(im, cx, y)
        ref = px(im, cx + bg_col_offset, y)
        on = (p[0] - ref[0]) > 45 and p[0] - p[1] > 40
        state = "dash" if on else "gap"
        if state != cur:
            if cur is not None:
                runs.append((cur, start, y - start, peak))
            cur = state
            start = y
            peak = p
        elif sum(p) > sum(peak):
            peak = p
    if cur is not None:
        runs.append((cur, start, y1 - start, peak))
    return runs


def line_column(im: Image.Image, cx: int, y0: int, y1: int) -> int:
    """The column carrying the drop line: max summed redness over the scan range, within +-4px."""
    best = max(
        range(cx - 4, cx + 5),
        key=lambda x: sum(px(im, x, y)[0] - px(im, x, y)[1] for y in range(y0, y1)),
    )
    return best


def report(name: str, im: Image.Image, box: Box, scale: float) -> tuple[float, float]:
    """Print the marker center + core color and return the center."""
    cx, cy = find_center(im, box)
    print(
        f"\n== {name}: {im.width}x{im.height}  center ({cx:.1f}, {cy:.1f})  1 ref px = {scale:.4f} px here"
    )
    core = px(im, int(round(cx)), int(round(cy)))
    print(f"   core {hexs(core)} {core} {fmt_oklch(srgb_to_oklch(core))}")
    return cx, cy


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("ref")
    ap.add_argument("shot")
    ap.add_argument("--scale", type=float, default=2 / 3, help="shot px per ref px")
    ap.add_argument("--ref-box", nargs=4, type=int, default=[1380, 320, 1490, 420])
    ap.add_argument("--shot-box", nargs=4, type=int)
    ap.add_argument("--rmax", type=int, default=72, help="max reference radius to print")
    ap.add_argument("--crop-dir", default="/tmp")
    args = ap.parse_args()

    ref = Image.open(args.ref).convert("RGB")
    shot = Image.open(args.shot).convert("RGB")
    sb: list[int] = args.shot_box or [0, 0, shot.width, shot.height]
    rb: list[int] = args.ref_box
    shot_box: Box = (sb[0], sb[1], sb[2], sb[3])
    ref_box: Box = (rb[0], rb[1], rb[2], rb[3])

    # screen angles (deg, y down): chart line arrives lower-left / right, drop line straight down, tooltip box above
    skip = ((100, 200), (80, 100), (330, 30), (240, 300))
    rcx, rcy = report("ref", ref, ref_box, 1.0)
    scx, scy = report("shot", shot, shot_box, args.scale)

    print("\nradial profile, ref radius -> ref median | shot median (at radius*scale) | dR dG dB")
    worst = 0
    for rr in range(0, args.rmax + 1):
        rm = radial_median(ref, rcx, rcy, rr, skip)
        sm = radial_median(shot, scx, scy, rr * args.scale, skip)
        d = tuple(sm[k] - rm[k] for k in range(3))
        worst = max(worst, max(abs(v) for v in d)) if rr > 15 else worst
        flag = " <<" if max(abs(v) for v in d) > 25 else ""
        print(
            f"  r={rr:2d}  {hexs(rm)} {rm!s:>15}  |  {hexs(sm)} {sm!s:>15}  |  {d[0]:+4d} {d[1]:+4d} {d[2]:+4d}{flag}"
        )
    print(f"worst channel delta outside the disc (r>15): {worst}")

    for name, im, cx, cy, sc in (("ref", ref, rcx, rcy, 1.0), ("shot", shot, scx, scy, args.scale)):
        icx, icy = int(round(cx)), int(round(cy))
        y0 = icy + int(round(15 * sc))
        y1 = min(im.height, icy + int(round(150 * sc)))
        col = line_column(im, icx, y0 + int(20 * sc), y1)
        print(
            f"\n{name} drop line column x={col} (center x={cx:.1f}); runs from y={y0} (state, y, len px, len ref px, peak):"
        )
        for state, y, ln, peak in column_runs(im, col, y0, y1):
            print(
                f"  {state:4s} y={y:4d} len={ln:3d} ({ln / sc:5.1f} ref px)  peak {hexs(peak)} {peak}"
            )
        # stroke width: coverage-weighted width across the line at a dash center
        dashes = [(y, ln) for state, y, ln, _ in column_runs(im, col, y0, y1) if state == "dash"]
        if len(dashes) >= 3:
            y, ln = dashes[2]
            ym = y + ln // 2
            row = [px(im, x, ym) for x in range(col - 5, col + 6)]
            bg = min(p[0] for p in row)
            peak_r = max(p[0] for p in row)
            cov = sum((p[0] - bg) / max(1, peak_r - bg) for p in row)
            print(
                f"  dash stroke ~{cov:.2f}px wide ({cov / sc:.2f} ref px) at y={ym}: "
                + " ".join(hexs(p) for p in row[2:9])
            )

        half = int(round(48 * sc))
        crop = im.crop((icx - half, icy - half, icx + half, icy + 3 * half))
        zoom = max(1, int(round(6 / sc)))
        size = (crop.width * zoom, crop.height * zoom)
        # Pillow's resize signature is partially untyped, hence the two ignores
        crop = crop.resize(  # pyright: ignore[reportUnknownMemberType]
            size, Image.Resampling.NEAREST
        )
        out = f"{args.crop_dir}/{name}_marker_crop.png"
        crop.save(out)
        print(f"  crop -> {out} ({zoom}x)")


if __name__ == "__main__":
    main()
