# How to add App Icons (from AppIcons.zip)

You already have the `AppIcons.zip`. Do this once on your machine:

```bash
# 1. Unzip the pack (if not already)
unzip AppIcons.zip -d AppIcons

# 2. From the project root (CaptionAI/)
cp AppIcons/appstore.png              assets/icon.png
cp AppIcons/android/adaptive-foreground.png  assets/adaptive-icon.png

# 3. Optional but recommended — splash + favicon
# (or run the decode script if you use the .b64 files)
```

Then create a simple splash (or use any image editor):

```bash
# Quick splash with ImageMagick (if installed):
convert assets/icon.png -resize 480x480 -gravity center -background '#0B0B10' -extent 1284x2778 assets/splash.png

# favicon
convert assets/icon.png -resize 48x48 assets/favicon.png
```

Or just copy `icon.png` also as splash for now:

```bash
cp assets/icon.png assets/splash.png
cp assets/icon.png assets/favicon.png
```

Finally:

```bash
git add assets/*.png
git commit -m "Add app icons from AppIcons pack"
git push
```

After this, `eas build -p android --profile preview` will include your logo on the APK.
