from pathlib import Path
import fitz

pdf_path = Path(r"src/assets/Miracle Natural - Brand Logo.pdf")
out_dir = Path(r"src/assets/branding-from-pdf")
out_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(pdf_path)
for i, page in enumerate(doc, start=1):
    pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False)
    out = out_dir / f"page_{i:02d}.png"
    pix.save(out)
    print(out.as_posix(), page.rect.width, page.rect.height)
