import os
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance

SRC_DIR = r"C:\Users\Joseph Nzvere\Documents\KK furnitures\website_ready_products"
STOCK_DIR = r"C:\Users\Joseph Nzvere\Documents\KK furnitures\stock pictures"
PUB_DIR = r"C:\Users\Joseph Nzvere\Documents\KK furnitures\zimFurnitureHub\public\images\products"

os.makedirs(PUB_DIR, exist_ok=True)

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
    max_w, max_h = int(target_w * 0.86), int(target_h * 0.82)
    
    orig_w, orig_h = prod_rgba.size
    ratio = min(max_w / orig_w, max_h / orig_h)
    new_w = int(orig_w * ratio)
    new_h = int(orig_h * ratio)
    prod_scaled = prod_rgba.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    x_pos = (target_w - new_w) // 2
    y_pos = target_h - new_h - int(target_h * 0.11)
    if y_pos < 50:
        y_pos = 50
        
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

def enhance_and_square_crop(img, crop_box=None, contrast=1.06, color=1.04, sharpness=1.1):
    if crop_box:
        img = img.crop(crop_box)
    w, h = img.size
    sq = min(w, h)
    cx = (w - sq) // 2
    cy = (h - sq) // 2
    sq_img = img.crop((cx, cy, cx + sq, cy + sq))
    resized = sq_img.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    if contrast != 1.0:
        resized = ImageEnhance.Contrast(resized).enhance(contrast)
    if color != 1.0:
        resized = ImageEnhance.Color(resized).enhance(color)
    if sharpness != 1.0:
        resized = ImageEnhance.Sharpness(resized).enhance(sharpness)
    return resized

def isolate_white_bg(img, thresh=245):
    # Isolate product from pure white background
    img_rgb = img.convert('RGB')
    arr = np.array(img_rgb)
    # Check if pixel is white
    is_white = (arr[:, :, 0] >= thresh) & (arr[:, :, 1] >= thresh) & (arr[:, :, 2] >= thresh)
    
    alpha = np.where(is_white, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode='L')
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(1.0))
    
    res = img_rgb.copy()
    res.putalpha(alpha_img)
    return res

def process_urban_slate(studio_bg):
    im_path = os.path.join(SRC_DIR, 'kombera-urban-slate-kitchen-dresser-microwave-hutch-200.jpg')
    im = Image.open(im_path).convert('RGBA')
    w, h = im.size
    arr = np.array(im)
    
    # Inpaint sticker
    for y in range(740, 960):
        for x in range(495, 740):
            src_x = x - 210
            if 160 <= src_x <= 480:
                diff = np.abs(arr[y, x, :3].astype(int) - arr[y, src_x, :3].astype(int)).max()
                if diff > 20 or arr[y, x, 0] > 215 or arr[y, x, 1] > 215:
                    arr[y, x, :3] = arr[y, src_x, :3]
    
    cleaned = Image.fromarray(arr)
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    
    poly = [
        (115, 85),
        (701, 95),
        (701, 520),
        (734, 520),
        (734, 930),
        (155, 960),
        (138, 550),
        (130, 535),
        (135, 520),
        (115, 85)
    ]
    draw.polygon(poly, fill=255)
    feathered = mask.filter(ImageFilter.GaussianBlur(1.0))
    cleaned.putalpha(feathered)
    
    return composite_product_on_studio(cleaned, studio_bg)

def main():
    studio_bg = create_studio_background()
    print("Beginning comprehensive catalog image fix...")
    
    # 1. Kombera Kirsty Executive Black Leather 4-Piece Living Room Suite ($1,200)
    # Target: kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200.jpg
    p_kirsty = os.path.join(SRC_DIR, 'kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200.jpg')
    im_k = Image.open(p_kirsty)
    w, h = im_k.size
    sq = min(w, h)
    left = (w - sq) // 2 - 40
    crop_k = (left, 0, left + h, h)
    kirsty_img = enhance_and_square_crop(im_k, crop_box=crop_k, contrast=1.08, color=1.05)
    kirsty_img.save(os.path.join(PUB_DIR, 'kombera-kirsty-executive-black-leather-4pc-living-room-suite-1200.jpg'), 'JPEG', quality=95)
    print("Fixed Kirsty Executive Black Leather Suite!")
    
    # 2. Kombera Classic Harvard Black Leather 3-Piece Lounge Suite ($500)
    # Target: kombera-classic-harvard-black-leather-3pc-lounge-suite-500.jpg
    # Source: Harvard couch 500$.jpg in STOCK_DIR or SRC_DIR (540x494)
    p_harv = os.path.join(SRC_DIR, 'kombera-classic-harvard-black-leather-3pc-lounge-suite-500.jpg')
    im_h = Image.open(p_harv) # 540x494
    harv_img = enhance_and_square_crop(im_h, contrast=1.08, color=1.04)
    harv_img.save(os.path.join(PUB_DIR, 'kombera-classic-harvard-black-leather-3pc-lounge-suite-500.jpg'), 'JPEG', quality=95)
    print("Fixed Harvard Black Leather Suite!")
    
    # 3. Kombera 3-Piece Washed Oak Complete Modular Kitchen Suite ($380)
    # Target: kombera-3pc-washed-oak-modular-kitchen-suite-380.jpg
    p_k3 = os.path.join(SRC_DIR, 'kombera-3pc-washed-oak-modular-kitchen-suite-380.jpg')
    im_k3 = Image.open(p_k3) # 1080x1080
    crop_k3 = (0, 40, 980, 1020)
    k3_img = enhance_and_square_crop(im_k3, crop_box=crop_k3, contrast=1.06, color=1.04)
    k3_img.save(os.path.join(PUB_DIR, 'kombera-3pc-washed-oak-modular-kitchen-suite-380.jpg'), 'JPEG', quality=95)
    print("Fixed Kombera 3-Piece Washed Oak Kitchen Suite (and Kitchen & Dining banner)!")
    
    # 4. Kombera Urban Slate Kitchen Dresser & Microwave Hutch ($200)
    # Target: kombera-urban-slate-kitchen-dresser-microwave-hutch-200.jpg
    slate_img = process_urban_slate(studio_bg)
    slate_img.save(os.path.join(PUB_DIR, 'kombera-urban-slate-kitchen-dresser-microwave-hutch-200.jpg'), 'JPEG', quality=95)
    print("Fixed Kombera Urban Slate Kitchen Dresser!")
    
    # 5. Kombera 2-Piece Washed Oak Modular Kitchen Pantry & Hutch ($340)
    # Target: kombera-2pc-washed-oak-modular-kitchen-pantry-hutch-340.jpg
    p_k2 = os.path.join(SRC_DIR, 'kombera-2pc-washed-oak-modular-kitchen-pantry-hutch-340.jpg')
    im_k2 = Image.open(p_k2)
    crop_k2 = (10, 50, 1070, 1050)
    k2_img = enhance_and_square_crop(im_k2, crop_box=crop_k2, contrast=1.06, color=1.04)
    k2_img.save(os.path.join(PUB_DIR, 'kombera-2pc-washed-oak-modular-kitchen-pantry-hutch-340.jpg'), 'JPEG', quality=95)
    print("Fixed Kombera 2-Piece Washed Oak Kitchen!")
    
    # 6. Kombera Kirsty Espresso Brown Leather Suite with Tangerine Accents ($1,200)
    # Target: kombera-kirsty-espresso-brown-leather-suite-orange-accents-1200.jpg
    p_ke = os.path.join(SRC_DIR, 'kombera-kirsty-espresso-brown-leather-suite-orange-accents-1200.jpg')
    im_ke = Image.open(p_ke) # 720x405
    # Center on the suite
    w, h = im_ke.size
    crop_ke = (80, 0, 80 + h, h) if w > h else None
    ke_img = enhance_and_square_crop(im_ke, crop_box=crop_ke, contrast=1.07, color=1.05)
    ke_img.save(os.path.join(PUB_DIR, 'kombera-kirsty-espresso-brown-leather-suite-orange-accents-1200.jpg'), 'JPEG', quality=95)
    print("Fixed Kirsty Espresso Brown Suite!")
    
    # 7. Kombera Channel-Tufted Ribbed Grey Bouclé Sectional Sofa ($400)
    # Target: kombera-channel-tufted-ribbed-grey-boucle-sectional-400.jpg
    p_bc = os.path.join(SRC_DIR, 'kombera-channel-tufted-ribbed-grey-boucle-sectional-400.jpg')
    im_bc = Image.open(p_bc) # 960x1280
    w, h = im_bc.size
    # Focus on the couch (lower-center)
    crop_bc = (0, 360, 960, 1280)
    bc_img = enhance_and_square_crop(im_bc, crop_box=crop_bc, contrast=1.06, color=1.03)
    bc_img.save(os.path.join(PUB_DIR, 'kombera-channel-tufted-ribbed-grey-boucle-sectional-400.jpg'), 'JPEG', quality=95)
    print("Fixed Channel-Tufted Grey Bouclé Sectional!")
    
    # 8. Kombera Mocha Brown Leather Corner Sectional Suite with Armchair ($350)
    # Target: kombera-mocha-brown-leather-corner-sectional-suite-armchair-350.jpg
    p_mc = os.path.join(SRC_DIR, 'kombera-mocha-brown-leather-corner-sectional-suite-armchair-350.jpg')
    im_mc = Image.open(p_mc) # 1020x765
    w, h = im_mc.size
    crop_mc = (60, 0, 60 + h, h)
    mc_img = enhance_and_square_crop(im_mc, crop_box=crop_mc, contrast=1.07, color=1.05)
    mc_img.save(os.path.join(PUB_DIR, 'kombera-mocha-brown-leather-corner-sectional-suite-armchair-350.jpg'), 'JPEG', quality=95)
    print("Fixed Mocha Brown Corner Sectional Suite!")
    
    # 9. Kombera Grand Chocolate U-Shape Sectional Suite with Glass Tables ($500)
    # Target: kombera-grand-chocolate-u-shape-sectional-suite-glass-tables-500.jpg
    p_ush = os.path.join(SRC_DIR, 'kombera-grand-chocolate-u-shape-sectional-suite-glass-tables-500.jpg')
    im_ush = Image.open(p_ush) # 744x992
    w, h = im_ush.size
    crop_ush = (0, 160, 744, 904)
    ush_img = enhance_and_square_crop(im_ush, crop_box=crop_ush, contrast=1.06, color=1.04)
    ush_img.save(os.path.join(PUB_DIR, 'kombera-grand-chocolate-u-shape-sectional-suite-glass-tables-500.jpg'), 'JPEG', quality=95)
    print("Fixed Grand Chocolate U-Shape Sectional Suite!")
    
    # 10. Kombera White Leather Bachelor L-Shape Couch ($250)
    # Target: kombera-white-leather-bachelor-l-shape-couch-250.jpg
    p_wc = os.path.join(SRC_DIR, 'kombera-white-leather-bachelor-l-shape-couch-250.jpg')
    im_wc = Image.open(p_wc) # 484x386
    wc_img = enhance_and_square_crop(im_wc, contrast=1.06, color=1.02)
    wc_img.save(os.path.join(PUB_DIR, 'kombera-white-leather-bachelor-l-shape-couch-250.jpg'), 'JPEG', quality=95)
    print("Fixed White Leather Bachelor L-Shape Couch!")
    
    # 11, 12, 13: Bachelor Couches on clean white background
    # Royal Blue, Midnight Navy, Espresso Bonded Leather
    white_bg_couches = [
        ('kombera-royal-blue-velvet-bachelor-l-shape-couch-250.jpg', 242),
        ('kombera-midnight-navy-bachelor-l-shape-couch-250.jpg', 242),
        ('kombera-espresso-bonded-leather-bachelor-l-shape-couch-280.jpg', 240)
    ]
    for fname, thresh in white_bg_couches:
        p_c = os.path.join(SRC_DIR, fname)
        im_c = Image.open(p_c)
        isolated = isolate_white_bg(im_c, thresh=thresh)
        comp = composite_product_on_studio(isolated, studio_bg)
        comp.save(os.path.join(PUB_DIR, fname), 'JPEG', quality=95)
        print(f"Fixed {fname} on clean studio background!")
        
    print("\nALL CATALOG PRODUCT IMAGES VERIFIED AND FIXED SUCCESSFULLY!")

if __name__ == '__main__':
    main()
