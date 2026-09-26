# Putting the scroll tour on Squarespace

The tour is plain HTML, CSS and JavaScript. Squarespace only needs a short snippet: the frames, logo and code are served free from this public GitHub repo through the jsDelivr CDN, so you don't upload anything to Squarespace.

**Plan requirement:** Squarespace only runs JavaScript in Code Blocks on the Core plan and above (or the older Business and Commerce plans).

## 1. Add the snippet

1. In Squarespace, open the page you want. For the homepage, use **Pages → Home**, or create a blank page and set it as the homepage.
2. Click **Add Section → Blank section**. Put it at the **top** of the page.
3. Inside that section, click **Add Block → Code**.
4. Delete the sample code, then paste the whole contents of [`snippet.html`](snippet.html).
5. Turn **off** "Display Source", then click **Save**.

Squarespace does not run scripts while you're editing. Click **Exit** or open the live URL to see the tour.

What the snippet does on the page:
- It hides the normal Squarespace header on this page only. The logo and the button island replace it.
- It takes over the section it sits in, so keep that Code Block alone in its own section.
- Other sections you add below it, and the site footer, show after the tour as usual.

## 2. Set your links

Edit the `IMM_CONFIG` block in the snippet:

```js
window.IMM_CONFIG = {
  links: {
    tickets: "https://ecom.roller.app/imagineminds/checkout/en-us/home",
    membership: "https://www.imagine-minds.com/membership",
    party: "https://www.imagine-minds.com/birthday-parties"
  },
  mapsUrl: "https://maps.app.goo.gl/…"   // Google Maps → your place → Share → Copy link
};
```

## Optional settings

Add any of these to `IMM_CONFIG`:

| Option | Default | What it does |
|---|---|---|
| `scrollLength` | `7` | Height of the tour in screens. Higher values play the video more slowly. |
| `captions` | 6 scenes | The text over each scene. `from`/`to` are 0–1 positions through the video. |
| `outro` | `{ title, text }` | The "Ready to play?" block after the tour. |
| `hideSquarespaceHeader` | `true` | Set to `false` to keep the Squarespace header. |
| `homeUrl` | `"/"` | The page the logo links to. |
| `frameCount` | `309` | Number of frames. Change it only after re-extracting frames from a new video. |

Example: change the caption text.

```js
captions: [
  { from: 0.02, to: 0.11, kicker: "Climb",     title: "Climb into the rainbow",  text: "…" },
  { from: 0.15, to: 0.29, kicker: "Explore",   title: "Curiosity everywhere",    text: "…" },
  { from: 0.35, to: 0.49, kicker: "Celebrate", title: "Birthday parties, sorted", text: "…" },
  { from: 0.53, to: 0.64, kicker: "Discover",  title: "A gallery of play",       text: "…" },
  { from: 0.69, to: 0.85, kicker: "Glow",      title: "Light up the room",       text: "…" },
  { from: 0.89, to: 0.985, kicker: "Create",   title: "Draw & clean",            text: "…" }
]
```

## Updating the site later

The snippet points at one exact commit (`@c719c3f…`), so it never changes by surprise. After changing anything in `site/`, push it, then swap the commit hash in both jsDelivr URLs in the snippet for the new one.

To use a different video, run `scripts/extract-frames.sh your-video.mp4` (it needs ffmpeg), then set `frameCount` to the number it prints.

## Previewing locally

```bash
npx serve site     # then open the printed URL
```
