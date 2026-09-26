# Imagine Minds: scroll video tour

A full-screen video that plays as the visitor scrolls, plus a floating "island" with the logo and
**Tickets / Membership / Birthday Party / map** buttons. A short intro loader (logo + progress bar, 3 seconds
at most) covers the page while the first frames download. It's built to drop into a Squarespace page.

- `index.html`: standalone preview of the whole thing
- `embed/imagine-scroll.js`, `embed/imagine-scroll.css`: the player and island (the CSS is loaded automatically)
- `frames/desktop`, `frames/mobile`: the video as 247 full-1080p WebP frames (1920×1080 for desktop, a 608×1080 crop for phones)
- `assets/logo.png`: logo cut out of the mockup
- `squarespace/`: ready-to-paste snippets
- `tools/build-frames.sh`: regenerates the frames from a new video

## Put it on Squarespace

Squarespace only runs custom JavaScript on plans above the entry-level Personal/Basic tier.

**Option A: top of a page (recommended)**

1. Open the page in Squarespace → **⚙ Page settings → Advanced → Page Header Code Injection**.
2. Paste everything from [`squarespace/page-header-injection.html`](squarespace/page-header-injection.html).
3. Change the `href` values to your real Tickets / Membership / Birthday Party pages, and set `mapUrl` to your Google Maps link.
4. Save, then open the **live** page (log out or use a private window). Squarespace doesn't run scripts inside the editor.

The video appears at the very top of the page, and any sections on the page appear below it.

**Option B: a Code Block**

Add a section, put a **Code Block** in it (stretched full width), and paste
[`squarespace/code-block.html`](squarespace/code-block.html). The script stretches the video edge to edge
and removes the section's padding.

The frames are served free from GitHub through the jsDelivr CDN. The snippet points to a specific commit,
so later edits to this repo don't change the live site until you update the commit hash in the snippet URL.

## Customising

Everything is set in `window.IMAGINE_SCROLL` inside the snippet:

| Option | What it does |
|---|---|
| `nav` | Island buttons: `label`, `href`, optional `short` label for very small phones, `newTab: true` to open in a new tab |
| `mapUrl` | Where the map pin (and "Get directions") links |
| `captions` | `true` shows text over the video for each room (off by default). If you turn it on, give the first and last timeline segments more scroll (`w`) so the text has time to read |
| `copy` | Caption text for `hero`, `net`, `splash`, `party`, `gallery`, `glow`, `draw`, `visit` (`label`, `title`, `body`, optional `color`) |
| `videoPages` | Paths that show the video, e.g. `["/"]`. By default it shows wherever the script runs, except on the pages the island buttons link to |
| `hideSiteHeader` | `true` hides Squarespace's header on that page so the island is the header |
| `logo` | URL of a sharper logo file (upload it to Squarespace and paste the image URL) |
| `scrollLength` | How much scrolling the whole video takes (default `650`). Bigger = slower |
| `smoothing` | 0–1, how quickly the video catches up with the scrollbar (default `0.14`) |
| `loader` / `loaderSeconds` | The intro loader (on, `3` seconds at most). It ends sooner if every frame has already downloaded |
| `island: false` / `video: false` | Show only the video, or only the island |

## New video?

```sh
pip install imageio-ffmpeg   # or use any ffmpeg with libwebp
tools/build-frames.sh path/to/new-video.mp4
```

If the length changes, update `frames.count` and the `timeline` in `embed/imagine-scroll.js`.
The timeline maps each part of the video (in seconds) to a caption and gives it a share of the scroll.

## Preview locally

```sh
python3 -m http.server
# open http://localhost:8000
```
