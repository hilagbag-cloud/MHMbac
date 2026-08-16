from pathlib import Path
from PIL import Image

root = Path('/tmp/bacpilot-stable')
source_path = root / 'public' / 'branding' / 'bacpilot-mark-512.png'
branding = root / 'public' / 'branding'

source = Image.open(source_path).convert('RGBA')

# Favicon source preserved with transparency; each icon remains square and recognizable.
for size in (48, 96, 144, 180, 192, 512):
    image = source.resize((size, size), Image.Resampling.LANCZOS)
    image.save(branding / f'bacpilot-mark-{size}.png', format='PNG', optimize=True)

# Multi-size ICO for Google/browser fallback.
source.save(root / 'public' / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

# Apple touch icon keeps a clean opaque light surface for predictable home-screen rendering.
apple = Image.new('RGBA', (180, 180), (255, 255, 255, 255))
mark = source.resize((156, 156), Image.Resampling.LANCZOS)
apple.alpha_composite(mark, ((180 - 156) // 2, (180 - 156) // 2))
apple.convert('RGB').save(root / 'public' / 'apple-touch-icon.png', format='PNG', optimize=True)

# Social preview uses the existing symbol without adding invented wording or altering the mark.
preview = Image.new('RGBA', (1200, 630), (15, 23, 42, 255))
mark = source.resize((360, 360), Image.Resampling.LANCZOS)
preview.alpha_composite(mark, ((1200 - 360) // 2, (630 - 360) // 2))
preview.convert('RGB').save(branding / 'bacpilot-social-preview-1200x630.png', format='PNG', optimize=True)
print('Brand assets generated')
