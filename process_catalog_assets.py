import os
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
import rembg

SOURCE_DIR = r"C:\Users\Joseph Nzvere\Documents\KK furnitures\website_ready_products"
TRANSPARENT_DIR = r"C:\Users\Joseph Nzvere\Documents\KK furnitures\pictures without background"
PUBLIC_PRODUCTS_DIR = r"C:\Users\Joseph Nzvere\Documents\KK furnitures\zimFurnitureHub\public\images\products"

os.makedirs(TRANSPARENT_DIR, exist_ok=True)
os.makedirs(PUBLIC_PRODUCTS_DIR, exist_ok=True)

print("Initializing rembg models...")
s_u2net = rembg.new_session('u2net')
s_u2netp = rembg.new_session('u2netp')

U2NETP_PREFERRED = {
    'kombera-2pc-4-door-mirrored-wardrobe-white-320.jpg',
    'kombera-executive-6-door-wardrobe-amber-glass-aluminium-650.jpg',
    'kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200.jpg',
    'kombera-mocha-brown-leather-corner-sectional-suite-armchair-350.jpg',
    'kombera-rolex-diamond-tufted-leather-armchair-mahogany-trim-500.jpg'
}

def create_studio_background(width=1024, height=1024):
    bg = np.zeros((height, width, 3), dtype=np.float32)
    horizon_y = int(height * 0.73)
    
    wall_top = np.array([170, 166, 160], dtype=np.float32)
    wall_mid = np.array([218, 215, 210], dtype=np.float32)
    wall_bot = np.array([200, 196, 190], dtype=np.float32)
    
    floor_top = np.array([195, 192, 187], dtype=np.float32)
    floor_bot = np.array([225, 222, 217], dtype=np.float32)
    
    for y in range(horizon_y):
        t = y / horizon_y
        if t < 0.5:
            col = wall_top * (1 - t * 2) + wall_mid * (t * 2)
        else:
            col = wall_mid * (1 - (t - 0.5) * 2) + wall_bot * ((t - 0.5) * 2)
        bg[y, :] = col
        
    for y in range(horizon_y, height):
        t = (y - horizon_y) / (height - horizon_y)
        col = floor_top * (1 - t) + floor_bot * t
        bg[y, :] = col
        
    y_coords, x_coords = np.ogrid[:height, :width]
    center_x, center_y = width * 0.5, height * 0.44
    dist_sq = ((x_coords - center_x) / (width * 0.6))**2 + ((y_coords - center_y) / (height * 0.6))**2
    vignette = np.clip(1.0 - dist_sq * 0.28, 0.72, 1.08)[:, :, np.newaxis]
    bg = np.clip(bg * vignette, 0, 255).astype(np.uint8)
    
    bg_img = Image.fromarray(bg, mode='RGB')
    draw = ImageDraw.Draw(bg_img, 'RGBA')
    draw.line([(0, horizon_y), (width, horizon_y)], fill=(175, 172, 167, 60), width=2)
    bg_img = bg_img.filter(ImageFilter.GaussianBlur(radius=1.5))
    return bg_img

def composite_product_on_studio(prod_rgba, studio_bg, canvas_size=(1024, 1024)):
    target_w, target_h = canvas_size
    max_w, max_h = int(target_w * 0.84), int(target_h * 0.80)
    
    orig_w, orig_h = prod_rgba.size
    ratio = min(max_w / orig_w, max_h / orig_h)
    new_w = int(orig_w * ratio)
    new_h = int(orig_h * ratio)
    prod_scaled = prod_rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    x_pos = (target_w - new_w) // 2
    y_pos = target_h - new_h - int(target_h * 0.11)
    if y_pos < 55:
        y_pos = 55
        
    alpha = prod_scaled.split()[-1]
    
    shadow_h = max(18, int(new_h * 0.11))
    footprint = alpha.resize((new_w, shadow_h), Image.Resampling.LANCZOS)
    bf_arr = np.zeros((shadow_h, new_w, 4), dtype=np.uint8)
    bf_arr[:, :, 0] = 35
    bf_arr[:, :, 1] = 33
    bf_arr[:, :, 2] = 30
    bf_arr[:, :, 3] = (np.array(footprint) * 0.65).astype(np.uint8)
    shadow_footprint_img = Image.fromarray(bf_arr, mode='RGBA')
    
    contact_layer = Image.new('RGBA', canvas_size, (0, 0, 0, 0))
    shadow_y = y_pos + new_h - int(shadow_h * 0.65)
    contact_layer.paste(shadow_footprint_img, (x_pos, shadow_y), shadow_footprint_img)
    contact_shadow = contact_layer.filter(ImageFilter.GaussianBlur(radius=5))
    
    diffuse_h = max(32, int(new_h * 0.22))
    diffuse_w = int(new_w * 1.06)
    diffuse_footprint = alpha.resize((diffuse_w, diffuse_h), Image.Resampling.LANCZOS)
    df_arr = np.zeros((diffuse_h, diffuse_w, 4), dtype=np.uint8)
    df_arr[:, :, 0] = 45
    df_arr[:, :, 1] = 42
    df_arr[:, :, 2] = 38
    df_arr[:, :, 3] = (np.array(diffuse_footprint) * 0.35).astype(np.uint8)
    diffuse_img = Image.fromarray(df_arr, mode='RGBA')
    
    diffuse_layer = Image.new('RGBA', canvas_size, (0, 0, 0, 0))
    diff_x = x_pos - (diffuse_w - new_w) // 2
    diff_y = y_pos + new_h - int(diffuse_h * 0.55)
    diffuse_layer.paste(diffuse_img, (diff_x, diff_y), diffuse_img)
    diffuse_shadow = diffuse_layer.filter(ImageFilter.GaussianBlur(radius=16))
    
    composite = studio_bg.convert('RGBA')
    composite = Image.alpha_composite(composite, diffuse_shadow)
    composite = Image.alpha_composite(composite, contact_shadow)
    
    composite.paste(prod_scaled, (x_pos, y_pos), prod_scaled)
    return composite.convert('RGB')

def process_all():
    studio_bg = create_studio_background()
    files = sorted([f for f in os.listdir(SOURCE_DIR) if f.endswith('.jpg')])
    print(f"Found {len(files)} products to process.")
    
    for idx, fname in enumerate(files, 1):
        print(f"[{idx}/{len(files)}] Processing {fname}...")
        in_path = os.path.join(SOURCE_DIR, fname)
        img = Image.open(in_path).convert('RGB')
        
        # Select optimal session
        session = s_u2netp if fname in U2NETP_PREFERRED else s_u2net
        
        # Remove background
        transparent_prod = rembg.remove(img, session=session, post_process_mask=True)
        
        # Save transparent PNG
        png_name = os.path.splitext(fname)[0] + ".png"
        png_path = os.path.join(TRANSPARENT_DIR, png_name)
        transparent_prod.save(png_path, "PNG")
        
        # Generate studio composite
        studio_composite = composite_product_on_studio(transparent_prod, studio_bg)
        
        # Save to website public products directory (JPG format matching catalog URLs)
        jpg_path = os.path.join(PUBLIC_PRODUCTS_DIR, fname)
        studio_composite.save(jpg_path, "JPEG", quality=95)
        
        print(f"  -> Saved PNG: {png_name}")
        print(f"  -> Saved Studio Composite: {fname}")

if __name__ == '__main__':
    process_all()
    print("ALL 27 PRODUCTS PROCESSED SUCCESSFULLY!")
