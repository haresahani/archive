# archive-nptel-in

Dynamic certificate verification flow that mirrors the NPTEL experience. Static HTML handles the landing state, while Netlify redirects send certificate lookups to a serverless function backed by MongoDB Atlas and Cloudinary storage URLs.

## Project Structure

```
archive/
├── noc/
│   └── Ecertificate/
│        ├── index.html
│        └── _redirects
├── netlify/
│   └── functions/
│        ├── lib/
│        │    └── mongo.js
│        └── verify.js
├── package.json
├── package-lock.json
└── sample_certificate_document.json
```

## Environment Variables (Netlify)

Configure these under **Site Settings → Build & deploy → Environment**:

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string with credentials and replica info |
| `DB_NAME` | Defaults to `cert_archive`, override if needed |
| `COLLECTION_NAME` | Defaults to `certificates`, override if needed |

All logic relies on `_id` being the full certificate ID string (no `ObjectId` casting).

## MongoDB Atlas Collection

Use database `cert_archive`, collection `certificates`. Each document stores the Cloudinary PDF URL:

```json
{
  "_id": "NPTEL24HS160S105560029104175140",
  "courseCode": "noc25-hs160",
  "semester": "SEM5",
  "storageUrl": "https://res.cloudinary.com/<cloud-name>/raw/upload/v123456789/NPTEL24HS160S105560029104175140.pdf",
  "createdAt": { "$date": "2024-10-01T00:00:00.000Z" }
}
```

Import `sample_certificate_document.json` directly through MongoDB Atlas or `mongorestore` for a quick smoke test.

## Frontend

`noc/Ecertificate/index.html` is a static page that:

- Shows a NPTEL-style “Course Certificate” CTA.
- When `?q=<CERTIFICATE_ID>` is missing, displays **Certificate ID required**.
- When a certificate ID exists, the CTA points at the Netlify Function (`/.netlify/functions/verify?id=...`). Netlify’s redirect rule automatically proxies `/noc/Ecertificate/?q=<CERTIFICATE_ID>` to the same function, so real users are served by the backend immediately.

## Netlify Function

- Name: `verify`
- Path: `/netlify/functions/verify.js`
- Validates the `id` query param (`A-Za-z0-9_-` only).
- Looks up `{ _id: <CERTIFICATE_ID> }` in MongoDB.
- If found, issues `302` redirect to Cloudinary PDF (`storageUrl`).
- Returns `404 { "status": "not_found" }` if the certificate is missing, `400` on invalid input, `500` on unexpected errors.

## Redirect Logic

`noc/Ecertificate/_redirects` contains:

```
/noc/Ecertificate/?q=:id   /.netlify/functions/verify?id=:id   200
```

This ensures every `/noc/Ecertificate/?q=<CERTIFICATE_ID>` request flows through the function.

## Local Development

1. Install deps:
   ```bash
   cd archive
   npm install
   ```
2. Install and log in to the Netlify CLI (`npm install -g netlify-cli`).
3. Run locally:
   ```bash
   netlify dev --dir=.
   ```
   The CLI will emulate redirects + functions so you can visit `http://localhost:8888/noc/Ecertificate/?q=<CERTIFICATE_ID>`.

## Deployment (Netlify)

1. Push this repo to Git.
2. Create a Netlify site and connect the repo.
3. Build command: `npm install` (functions-only project). Publish directory: `archive`.
4. Add the environment variables noted earlier.
5. Deploy. Production links will look like:
   ```
   https://archive-nptel-in.netlify.app/noc/Ecertificate/?q=NPTEL24HS160S105560029104175140
   ```
   The site immediately sends users to the verified Cloudinary document when the ID exists.

