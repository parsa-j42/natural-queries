# Deployment runbook

The app is two deployable pieces:

- **Frontend** (static site) on GitHub Pages, built by `.github/workflows/deploy.yml`.
- **Backend** (FastAPI) on Render, defined by `render.yaml`.

The well data (Parquet) is served as static assets but kept out of git, so it is
published via a GitHub Release and pulled into the Pages build.

Everything below is a one-time setup. After it, pushes to `main` redeploy
automatically.

## 1. Publish the Parquet data

The Parquet files in `natural-queries-frontend/public/data/` are gitignored. Upload
them once as a release named `data-v1`; the deploy workflow downloads them into the
site build.

```bash
# from the repo root, with the built Parquet present in public/data/
gh release create data-v1 natural-queries-frontend/public/data/*.parquet \
  --title "Parquet data v1" \
  --notes "DuckDB-WASM data assets served by the frontend"
```

To refresh the data later (after re-running the ETL):

```bash
gh release upload data-v1 natural-queries-frontend/public/data/*.parquet --clobber
```

## 2. Deploy the backend on Render

1. Push the repo to GitHub.
2. On Render: **New -> Blueprint**, connect this repo. Render reads `render.yaml`
   and creates the `natural-queries-api` web service from the backend Dockerfile.
3. In the service's **Environment**, set the secret keys (marked `sync: false` in
   the blueprint, so they are not in git):
   - `GROQ_API_KEY`
   - `GOOGLE_API_KEY`
   - (`ANTHROPIC_API_KEY` is normally left unset: Claude is bring-your-own-key.)
4. Wait for the first deploy, then confirm `https://<service>.onrender.com/health`
   returns `{"status":"ok","environment":"production"}`.

Note: the Render free plan spins the service down when idle, so the first request
after a quiet period takes ~30-60s. Fine for a demo.

## 3. Point the frontend at the backend

1. Copy the Render service URL (for example `https://natural-queries-api.onrender.com`).
2. In the GitHub repo: **Settings -> Secrets and variables -> Actions -> Variables**,
   add a repository **variable** `VITE_API_URL` set to that URL. (A variable, not a
   secret: the URL is public and is baked into the static build.)
3. If the backend is on a different origin than expected, update `CORS_ORIGINS` in
   `render.yaml` (or the Render dashboard) to include the site origin.
4. Trigger the **Deploy** workflow (push a frontend change to `main`, or re-run it
   from the Actions tab). The build embeds `VITE_API_URL` and pulls the data release.

## 4. Verify

Open the site, run a Playground question, and confirm it returns rows: that proves
the frontend reached the Render backend (SQL generation), the data release loaded,
and DuckDB-WASM executed the SQL in the browser.

## Alternative: object storage for the data

If the data outgrows a release or you want a CDN, host the Parquet on Cloudflare R2
or S3 (set permissive CORS) and change `dataUrl()` in
`natural-queries-frontend/src/db/duckdb.ts` to point at that bucket. R2 has no
egress fees, which suits range-fetched Parquet well.
