import pathlib

from PIL import Image

ref = pathlib.Path("/Users/agent/dev/tmp/03-dark-smooth-neon.png")
shot = pathlib.Path("/tmp/ts1-clean.png")


def sample(path: pathlib.Path) -> None:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    print(f"{path} {w}x{h}")
    # sample points: for shot, chart is top 25% of tall screenshot
    points = (
        {
            "bg": (0.05, 0.05),
            "line": (0.5, 0.12),
            "grad_mid": (0.5, 0.18),
            "grad_bottom": (0.5, 0.205),
        }
        if "ts1" in str(path)
        else {
            "bg": (0.05, 0.05),
            "line": (0.5, 0.48),
            "grad_mid": (0.5, 0.65),
            "grad_bottom": (0.5, 0.78),
        }
    )
    for name, (xf, yf) in points.items():
        x = int(xf * w)
        y = int(yf * h)
        p = im.getpixel((x, y))
        assert isinstance(p, tuple)
        r, g, b = p[0], p[1], p[2]
        print(f"  {name:12s} @ {xf:.2f},{yf:.2f} -> #{r:02X}{g:02X}{b:02X} {r:3d},{g:3d},{b:3d}")


for p in [ref, shot]:
    sample(p)
