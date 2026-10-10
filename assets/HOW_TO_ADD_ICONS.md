# Add App Icons (1 minute)

Your logo URL is ready. Run these commands from the **CaptionAI** project root:

```bash
# Download logo (1024×1024)
curl -L -o assets/icon.png "https://www.image2url.com/r2/default/images/1791603611851-bebfd3ae-59e4-4f05-b354-7d20159745c1.png"

# Copy for adaptive icon, splash, favicon
cp assets/icon.png assets/adaptive-icon.png
cp assets/icon.png assets/splash.png
cp assets/icon.png assets/favicon.png

# Push to GitHub
git add assets/*.png
git commit -m "Add app logo icons"
git push
```

Done. Now build APK:

```bash
eas build -p android --profile preview
```

`app.json` already points to these files.
