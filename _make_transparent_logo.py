from pathlib import Path
from PIL import Image
import numpy as np

files = [
    Path(r"src/assets/branding-from-pdf/miracle-natural-logo-main.png"),
    Path(r"src/assets/branding-from-pdf/miracle-natural-logo-icon.png"),
]

for src in files:
    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    bg = arr[5, 5, :3].astype(int)
    diff = np.max(np.abs(arr[:, :, :3].astype(int) - bg), axis=2)
    alpha = np.where(diff <= 14, 0, 255).astype(np.uint8)
    arr[:, :, 3] = alpha
    out = src.with_name(src.stem + "-transparent.png")
    Image.fromarray(arr, mode="RGBA").save(out)
    print(out.as_posix())
