# cicd-test-app

Minimal Node.js HTTP server, no dependencies. It exists to give the pipeline something to build, test, ship and visibly change.

The pipeline itself is documented in [`docs/GitHub Actions CI-CD.md`](../docs/GitHub%20Actions%20CI-CD.md); why it is built that way is in [`docs/GitHub Actions Safety Rationale.md`](../docs/GitHub%20Actions%20Safety%20Rationale.md).

## Endpoints

| Path | Returns |
|------|---------|
| `/` | HTML demo page carrying the version, message and accent color |
| `/health` | `{"status":"ok","version":"…"}`, used by the container healthcheck and by both smoke tests, the one in `ci` and the one `verify` runs against the published image |
| anything else | `404` |

Locally: `http://localhost:3000/health`.

## Making a deploy visible

Edit the constants at the top of [`src/index.js`](src/index.js):

```js
const APP_VERSION = "1.0.0";                  // bump this
const APP_MESSAGE = "Hello from cicd-test-app";  // change the headline
const APP_COLOR = "#2563eb";                  // header accent
```

Push to `main`, then reload `/` once the deploy job finishes. `APP_VERSION` is what the verification step in the pipeline doc checks, so bump it rather than only editing the message.

## Run it

```bash
npm ci --ignore-scripts  # what CI installs; needs package-lock.json
npm test                 # node --test, no test framework to install
npm start                # http://localhost:3000
docker compose up --build
```

The port comes from `PORT` and defaults to `3000`. The server binds `0.0.0.0`, so it works behind any reverse proxy or PaaS without configuration.

`package-lock.json` is committed even though the dependency list is empty, because the pipeline installs with `npm ci` and that needs a lockfile to install from. Adding a dependency means running `npm install` and committing the updated lockfile in the same PR; otherwise `npm ci` fails with `EUSAGE` rather than quietly resolving a version nobody reviewed.

## Before the first run

`.github/CODEOWNERS` ships with an `@<owner-username>` placeholder, and GitHub skips any ownership rule whose owner does not resolve to a real account. The `workflow-lint` job fails the build while it is still there, on purpose: a review gate that matches nobody reads as protection in a diff and enforces nothing. Put a real handle in it, then enable `Require review from Code Owners` on the branch rule, per [`docs/Manual Setup Checklist.md`](../docs/Manual%20Setup%20Checklist.md) §IV.

## Why the Dockerfile looks like that

The base image is pinned by digest. `node:20-alpine` is repointed on every patch release, so an unpinned tag means the image CI tested and the image the registry received can be built from different bytes. Dependabot's `docker` ecosystem moves the digest and the comment together.

The install line is `npm ci --omit=dev --ignore-scripts` rather than `npm install`. `npm ci` installs exactly what the lockfile records, and `--ignore-scripts` keeps a dependency's `preinstall`/`postinstall` hooks from executing during the build. Those hooks are arbitrary code running as root in the pipeline, and they are one of the most-used footholds in a supply-chain attack.

There is no `USER` directive, and `/app` is world-readable. Coolify and similar platforms run containers as an arbitrary numeric UID, and a pinned non-root user crash-loops with `EACCES` when that UID cannot read the app tree. Pin a `USER` if your target platform does not need the flexibility.

`curl` is installed because some platforms run their HTTP healthcheck by executing `curl` inside the container rather than probing it from outside. Alpine's busybox `wget` is not enough for those.

The last two are deliberate trades against a tighter image. On a real service, revisit them once you know what the platform actually does.

## Layout

```
cicd-test-app/
├── .github/workflows/cicd.yml
├── .github/dependabot.yml
├── .github/CODEOWNERS
├── .github/zizmor/requirements.txt   # hash-pinned linter
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── src/index.js
└── test/health.test.js
```

