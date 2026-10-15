"""Scan screencast frames for single-frame flashes: a frame that differs sharply from both neighbours
while those neighbours match each other (A-B-A). Exit 1 if any are found."""
import glob
import sys
from PIL import Image, ImageChops, ImageStat

SCALE = (360, 225)
MIN_CHANGE = 3.0      # mean luminance difference (0-255) that counts as a visible change
NEIGHBOUR_RATIO = 0.5  # the neighbours must be at least this much closer to each other

frames = sorted(glob.glob(sys.argv[1] if len(sys.argv) > 1 else 'test-results/*screencast*/frames/*.png'))
if not frames:
    sys.exit('No screencast frames found; run: npx playwright test tests/visual/screencast.spec.mjs')
images = [Image.open(path).convert('L').resize(SCALE) for path in frames]
diff = lambda a, b: ImageStat.Stat(ImageChops.difference(a, b)).mean[0]
flashes = []
for i in range(1, len(images) - 1):
    before, after, across = diff(images[i - 1], images[i]), diff(images[i], images[i + 1]), diff(images[i - 1], images[i + 1])
    if before > MIN_CHANGE and after > MIN_CHANGE and across < NEIGHBOUR_RATIO * min(before, after):
        flashes.append((frames[i].split('/')[-1], round(before, 1)))
print(f'{len(frames)} frames scanned; single-frame flashes: {flashes or "none"}')
sys.exit(1 if flashes else 0)
