from PIL import Image, ImageDraw, ImageFont
import os

# Output path
out = r"c:\Users\Preema Animesh\Desktop\hackthon\frontend\public\vendex_logo.png"

# Step 1: Load original image and find the actual visible content
src_path = r"c:\Users\Preema Animesh\Downloads\IMG_1313.PNG"
if not os.path.exists(src_path):
    src_path = out

im = Image.open(src_path).convert("RGBA")

# Step 2: Tight-crop to actual content bounding box
data = im.getdata()
width, height = im.size

# Find tight bounding box of non-transparent/non-white pixels
min_x, min_y = width, height
max_x, max_y = 0, 0

for y in range(height):
    for x in range(width):
        r, g, b, a = data[y * width + x]
        # consider pixel "visible" if it's not fully transparent and not near-white background
        if a > 30 and not (r > 230 and g > 230 and b > 230):
            if x < min_x: min_x = x
            if x > max_x: max_x = x
            if y < min_y: min_y = y
            if y > max_y: max_y = y

print(f"Visible bounds: ({min_x},{min_y}) -> ({max_x},{max_y})")

# Add tiny margin (5% of content size)
content_w = max_x - min_x
content_h = max_y - min_y
margin = int(max(content_w, content_h) * 0.05)

min_x = max(0, min_x - margin)
min_y = max(0, min_y - margin)
max_x = min(width, max_x + margin)
max_y = min(height, max_y + margin)

cropped = im.crop((min_x, min_y, max_x, max_y))

# Step 3: Center on a square canvas
cw, ch = cropped.size
size = max(cw, ch)
square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
ox = (size - cw) // 2
oy = (size - ch) // 2
square.paste(cropped, (ox, oy))

# Step 4: Save at 512x512
final = square.resize((512, 512), Image.LANCZOS)
final.save(out, "PNG")
print("Saved 512x512 tight-cropped favicon:", out)
