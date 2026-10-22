# PACE Futures Lab — complete source export

Exported October 22, 2026 from source commit `83545b804e995e281ea07ac920c504a9eaeb8366`.
Current Site: https://pace-futures-lab.trueyak64.chatgpt.site

## Included
All tracked project files: original HTML/CSS/JavaScript, site-reference image, vendored Three.js and BVH dependencies/addons, geometry tests, package manifests, project notes, reference screenshots and original Sites hosting manifest. Application files under `dist/` are unchanged. Added this guide and dependency license copies. No Git history, credentials, node_modules, or browser project records are included.

## Run independently
This is a buildless static app. Serve the **dist** directory using an HTTP server; do not double-click index.html with a file:// URL (ES modules and fetch need HTTP).

With Python installed, from the extracted project directory:

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. On Windows, `py` may be used instead of `python`.
No npm install or build step is needed to run the browser app. Its runtime libraries are included locally. Use a current browser supporting ES modules/import maps; WebGL is preferred, with a vector preview fallback.

To run geometry tests with Node.js and npm installed:

```sh
npm ci
node verify-engine.mjs
node verify-ground-cut.mjs
node verify-nearby.mjs
node verify-organizations.mjs
```

## Upload to GitHub
1. Extract the ZIP. Create an empty GitHub repository (private if desired).
2. Commit the contents of the `PACE-Futures-Lab` folder as the repository root. GitHub Desktop is convenient for this many files. Include dotfiles; do not upload just the ZIP if you want GitHub to display/run the source.
3. Publish/push the repository. The export creates no automatic sync with ChatGPT Sites. Future changes must be copied or committed to your chosen repository.

If using Git CLI with an empty GitHub repository:

```sh
git init
git add .
git commit -m "Import PACE Futures Lab"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Hosting on GitHub Pages or another static host
Deploy the **contents of dist/** as the web root. No server backend, API keys, environment variables or build command are required. Keep the folder structure intact, including vendor and assets. Paths are relative, so repository subpaths are supported.

For GitHub Pages, use Settings → Pages → GitHub Actions, select a static HTML workflow, and set its upload-pages-artifact path to `./dist`. The built-in Pages branch option supports root or docs rather than dist; do not point Pages at this repository root because index.html lives in dist.

Official instructions:
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

Other hosts: set the publish directory to `dist` and use no build command. Serve JavaScript with a JavaScript MIME type. A restrictive content-security policy must permit the inline import map, local scripts, and data/blob image and download operations used by the app.

## Hosting and storage dependencies
| Feature | Current implementation | Independent hosting |
| --- | --- | --- |
| Site delivery and private audience | ChatGPT Sites serves static files and controls viewer access | Replace with a static host. ChatGPT access restrictions do not travel with the code. Configure host authentication if privacy is required; a private repository does not itself guarantee a private published website. |
| `.openai/hosting.json` | Original Sites project identity and static directory configuration | Retained for provenance. Other hosts do not need it; do not reuse its project ID to create a different Site. |
| Saved projects / favorites / imported geometry | IndexedDB database `pace-saved-projects`, object store `projects` | Works independently in the browser; no database migration or backend required. Records are local to that browser and origin. |
| Working-session autosave | localStorage key `pace-futures-session`; limited to JSON under about 3.5 MB | Same behavior independently. Large work should be saved explicitly or downloaded as a backup. |
| Massing generation, collision, ground cuts, geometry import/export | Client-side JavaScript with vendored libraries | No ChatGPT model/API or server dependency. Same implementation included. |
| Site photograph | `dist/assets/site-reference.png`; user replacements can be embedded in project JSON | Included; no external image service needed. |
| Help links | External NASA reference links | Optional informational links, not runtime dependencies. |

### Move your actual designs
The source export is not a backup of your private browser database. On the original website, open Projects and download a backup for each saved project you want to retain. For unsaved work use Export → Project backup · JSON. On the new site, use Open to import each JSON file, then Save project to add it to the new browser's Projects tab. These backups contain the design, source meshes, alternatives, favorites, settings and embedded site image.

Changing domain, protocol, browser profile or localhost port creates a different storage origin. Projects do not automatically follow. Do not clear the original browser data before checking your backups. For cross-device synchronization or shared accounts, add a server database/storage service plus authentication; those features are not present in this static export.

## Licenses and assets
Third-party license copies are in `licenses/`; preserve upstream notices in vendor files. The project is a conceptual NASA-inspired architectural study, not an official NASA product. No additional license for your custom code is assumed; choose one if you want public redistribution. Confirm rights to supplied site photographs and imported models before public redistribution.

## Validation
Source archive matches the selected commit byte-for-byte for every tracked file; additions are documentation and license copies only. ZIP integrity and file checksums verified. Geometry test suites passed on this source during implementation. No GitHub repository was created or connected by this export, and independent hosting has not been deployed.
