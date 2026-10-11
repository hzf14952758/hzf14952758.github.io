# hzf14952758.github.io

Personal webpage, built by hand and served by GitHub Pages.

This repository is the deployment target for **Question 2** of the CSI205TC
*Networking and Distributed Computing* coursework. The page itself is the
subject of the network analysis in that report: its DNS resolution, the latency
to its host, the route taken to reach it and the packets exchanged while loading
it are all captured and discussed there.

## Contents

| Path | Purpose |
| --- | --- |
| `index.html` | the whole page - one document, no templating |
| `assets/style.css` | styling, including the light/dark theme variables |
| `assets/script.js` | theme switching, mobile menu, scroll reveal |

## Design notes

* No framework, no build step, no package manager. Three files are the entire
  site, which keeps what the browser has to fetch small and makes the network
  analysis of a page load easy to reason about.
* The only external dependencies are the fonts already present on the visitor's
  machine, so loading the page triggers no third-party requests.
* The theme is stored in `localStorage` and falls back to the system preference.

## Deployment

Published from the `main` branch at the repository root, which is what GitHub
Pages uses for a user site of the form `<username>.github.io`.

Live at <https://hzf14952758.github.io/>
