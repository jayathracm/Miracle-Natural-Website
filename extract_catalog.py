import os, json
import fitz

pdf_path = r"c:\Users\Jayathra\Downloads\Dinisha\Leora_Wellness_Miracle_Natural_Catalog_Canva_Editable.pdf.pdf"
out_dir = r"e:\Miracle Natural Website\website\catalog_extract"
img_dir = os.path.join(out_dir, "images")
os.makedirs(img_dir, exist_ok=True)

doc = fitz.open(pdf_path)
all_text = []
image_manifest = []

for i, page in enumerate(doc, start=1):
    text = page.get_text("text")
    all_text.append({"page": i, "text": text})

    images = page.get_images(full=True)
    for idx, img in enumerate(images, start=1):
        xref = img[0]
        base = doc.extract_image(xref)
        ext = base.get("ext", "png")
        data = base["image"]
        name = f"page_{i:02d}_img_{idx:02d}.{ext}"
        path = os.path.join(img_dir, name)
        with open(path, "wb") as f:
            f.write(data)
        image_manifest.append({"page": i, "file": name, "ext": ext, "bytes": len(data)})

with open(os.path.join(out_dir, "catalog_text.json"), "w", encoding="utf-8") as f:
    json.dump(all_text, f, ensure_ascii=False, indent=2)

with open(os.path.join(out_dir, "catalog_text.txt"), "w", encoding="utf-8") as f:
    for page in all_text:
        f.write(f"\n\n=== PAGE {page['page']} ===\n")
        f.write(page["text"] or "")

with open(os.path.join(out_dir, "image_manifest.json"), "w", encoding="utf-8") as f:
    json.dump(image_manifest, f, ensure_ascii=False, indent=2)

print(f"Pages: {len(doc)}")
print(f"Images extracted: {len(image_manifest)}")
print(f"Output dir: {out_dir}")
