from PIL import Image

def trim_transparent(image_path):
    try:
        im = Image.open(image_path).convert("RGBA")
        bbox = im.getbbox()
        if bbox:
            im_cropped = im.crop(bbox)
            im_cropped.save(image_path)
            print("Cropped successfully to:", bbox)
        else:
            print("No bounding box found (image might be empty or fully transparent).")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    trim_transparent(r"c:\Users\Preema Animesh\Desktop\hackthon\frontend\public\vendex_logo.png")
