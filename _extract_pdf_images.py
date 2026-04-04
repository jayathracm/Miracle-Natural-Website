from pathlib import Path
from pypdf import PdfReader

pdf_path = Path(r"src/assets/Miracle Natural - Brand Logo.pdf")
out_dir = Path(r"src/assets/branding-from-pdf")
out_dir.mkdir(parents=True, exist_ok=True)

reader = PdfReader(str(pdf_path))
count = 0
for p_idx, page in enumerate(reader.pages, start=1):
    images = getattr(page, "images", [])
    for i_idx, image_file_object in enumerate(images, start=1):
        name = image_file_object.name or f"page{p_idx}_img{i_idx}.bin"
        safe_name = name.replace("/", "_").replace("\\", "_")
        out_path = out_dir / f"p{p_idx}_{i_idx}_{safe_name}"
        out_path.write_bytes(image_file_object.data)
        print(out_path.as_posix())
        count += 1

print(f"EXTRACTED={count}")
