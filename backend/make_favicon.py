from PIL import Image

src = r"c:\Users\Preema Animesh\Desktop\hackthon\frontend\public\vendex_logo.png"
out = r"c:\Users\Preema Animesh\Desktop\hackthon\frontend\public\vendex_logo.png"

im = Image.open(src).convert("RGBA")

# Auto-crop transparent edges first
bbox = im.getbbox()
if bbox:
    im = im.crop(bbox)

# Make it square (pad to largest dimension with transparent bg)
w, h = im.size
size = max(w, h)
square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
offset = ((size - w) // 2, (size - h) // 2)
square.paste(im, offset)

# Save at 512x512 for best browser rendering
final = square.resize((512, 512), Image.LANCZOS)
final.save(out, "PNG")
print(f"Saved square 512x512 favicon to {out}")
