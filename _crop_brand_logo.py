from pathlib import Path
from PIL import Image
import numpy as np

src = Path(r"src/assets/branding-from-pdf/page_01.png")
out_dir = Path(r"src/assets/branding-from-pdf")
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGB")
arr = np.array(img)

bg = arr[220, 220].astype(int)
mask = np.any(np.abs(arr.astype(int) - bg) > 14, axis=2)

margin = 120
mask[:margin, :] = False
mask[-margin:, :] = False
mask[:, :margin] = False
mask[:, -margin:] = False

ys, xs = np.where(mask)
if len(xs) == 0:
    raise RuntimeError("Could not detect logo bounds")

x0, x1 = xs.min(), xs.max()
y0, y1 = ys.min(), ys.max()

pad = 50
x0 = max(0, x0 - pad)
y0 = max(0, y0 - pad)
x1 = min(arr.shape[1] - 1, x1 + pad)
y1 = min(arr.shape[0] - 1, y1 + pad)

main_logo = img.crop((x0, y0, x1 + 1, y1 + 1))
main_logo_path = out_dir / "miracle-natural-logo-main.png"
main_logo.save(main_logo_path)

m_arr = np.array(main_logo)
h, w = m_arr.shape[:2]
upper = m_arr[: int(h * 0.55), :, :]
ubg = upper[30, 30].astype(int)
umask = np.any(np.abs(upper.astype(int) - ubg) > 14, axis=2)
ys2, xs2 = np.where(umask)
if len(xs2) == 0:
    raise RuntimeError("Could not detect icon bounds")

ix0, ix1 = xs2.min(), xs2.max()
iy0, iy1 = ys2.min(), ys2.max()
pad2 = 30
ix0 = max(0, ix0 - pad2)
iy0 = max(0, iy0 - pad2)
ix1 = min(upper.shape[1] - 1, ix1 + pad2)
iy1 = min(upper.shape[0] - 1, iy1 + pad2)

icon = Image.fromarray(upper).crop((ix0, iy0, ix1 + 1, iy1 + 1))
icon_path = out_dir / "miracle-natural-logo-icon.png"
icon.save(icon_path)

print("saved", main_logo_path.as_posix())
print("saved", icon_path.as_posix())
