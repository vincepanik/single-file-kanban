# Single File Kanban

A personal kanban board that lives in **one 378 KB HTML file**. No account, no server, no build step, no network requests. Download it, double click it, use it.

**[Try the live demo](https://vincepanik.github.io/single-file-kanban/)** or **[download the file](https://github.com/vincepanik/single-file-kanban/raw/main/index.html)** and run it from your own machine.

<!--
  Add a screenshot here once the repo is live:
  1. Open index.html, arrange a few cards, take a screenshot.
  2. Save it as screenshot.png at the root of this repo.
  3. Uncomment the line below.

  ![Screenshot](screenshot.png)
-->

## Why

Most task boards want an account, a subscription, and a copy of your data on someone else's computer. This one wants none of that. It is a single file you own, that keeps working offline, forever, with no company behind it that can shut down or change its pricing.

## What it does

- Columns you can rename, recolor, reorder and add to
- Cards with a tag, a color, a priority and free form notes
- Drag and drop between columns and within a column
- Deadlines with a colored badge (red when overdue, orange when due within 7 days)
- Tag filtering and search
- Export and import as JSON, so your data is portable
- A weekly automatic JSON backup offered as a download
- English and French interface, following your browser, switchable from the header

## Privacy, in concrete terms

This file makes **zero network requests**. Not one. No `fetch`, no `XMLHttpRequest`, no WebSocket, no beacon, no analytics, no remote font. React and the Inter typeface are bundled inside the file, which is why it is 378 KB and why it works on a plane.

Your cards live in your browser's `localStorage`, on your machine only. Nothing is sent anywhere, to anyone, including me. You do not have to take my word for it: open your browser's network tab and watch nothing happen.

## Where your data lives, and how to not lose it

Your cards are tied to the browser **and** to where the file is. Move the file, switch browsers, or clear your site data, and the board will look empty.

So: use the **Export** button now and then, and **Import** the JSON when you move. That file is your data, in a plain readable format, yours to keep.

If you use the hosted demo above, your data is tied to that domain instead, which in practice persists more reliably than a local `file://` page. Either way, export from time to time.

## Running it locally

Download `index.html` and double click it. That is the whole procedure. There is no install, no `npm`, no server.

## Building from source

Only needed if you want to change the app. `index.html` is generated from `src/`.

```bash
npm install
npm run build
```

Then inline the resulting `bundle.js` into the `<script>` tag of `index.html`. The `--jsx=automatic` flag in the build script is required, without it the bundle throws "React is not defined" at runtime.

## License

MIT, see [LICENSE](LICENSE). Use it, change it, sell it, no attribution required and no warranty given.

Bundled components: React and React DOM (MIT, Copyright Meta Platforms, Inc.) and the Inter typeface (SIL Open Font License 1.1, Copyright 2016 The Inter Project Authors).

## Languages

The interface ships in English and French. It follows your browser's language on first visit, and the FR/EN button in the header switches it at any time. Your own content is never touched by a language switch: cards, renamed columns, tags and notes are yours and stay exactly as you wrote them.

Adding a language means adding one entry to the `STR` dictionary at the top of `src/app.jsx`. Pull requests welcome.
