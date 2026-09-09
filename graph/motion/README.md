# Authored motion runtime

`executeMotionScene(input, dependencies?)` runs a per-scene LangGraph with actual IDE model calls: director → code analyst → designer → TSX author → strict build/preview → technical reviewer → visual reviewer → final render → final visual reviewer. The code analyst receives source contents and hashes inline. The author returns source files as schema-validated JSON; a deterministic writer creates a private scene entrypoint. No motion template catalog is imported.

The production caller must provide approved literal narration and **real** alignment tied to locked audio. Cue frames are local to the scene, with confidence at least 0.8. The runtime checks audio/alignment file hashes before and after generation; it does not synthesize or estimate alignment. The caller remains responsible for deriving the supplied cues from the verified alignment file. The initial scene limit is 120 seconds, integer FPS, and opaque dimensions divisible by four (half-resolution preview).

## Runtime boundary

Generated code is never run as a host Node module. Static TypeScript AST validation rejects imports outside the package/allowlist, dynamic imports, computed property access, Node APIs, external media/loaders, clocks, evaluation, and network APIs. This policy is deliberately conservative and is defense in depth, **not a proof of sandboxing**.

Rendering additionally requires a locally provisioned **Linux Docker** image selected by immutable image ID or repository digest. The container runs without network, credentials, Docker socket, host repository, or host home mounts; as UID 1000; with read-only root, dropped capabilities, no-new-privileges, 4 GB memory, 2 CPUs, 256 PIDs, bounded tmpfs and a 15-minute action timeout. Only scene source (read-only), trusted worker code (read-only), and the scene output directory are mounted. A timeout removes the container. No host-render fallback exists.

Provisioning example from the repository root, after dependency installation:

```powershell
docker build -f graph/motion/runtime/Dockerfile -t hsl-motion-worker .
$env:HSL_MOTION_WORKER_IMAGE = docker image inspect --format '{{.Id}}' hsl-motion-worker
```

Image build needs package downloads and installs Chromium/FFmpeg. Runtime uses `--pull=never --network=none`. Docker must already be installed and configured for Linux containers. The output mount must be writable by UID 1000. Docker deployment, an actual 3D render, and adversarial runtime testing remain necessary before production adoption; static tests do not establish those properties on a host where Docker is absent.

## Artifacts and recovery

Inputs, runtime files, dependency lockfile and worker identity determine a scene hash. Source, design, model outputs, preview and final video are archived under the caller's output directory, scene hash, and revision. Render receipts check file hashes before reuse. An approved scene returns immediately on replay only if all recorded source, media and review files still match. A changed audio or source invalidates that identity.

Model calls independently cache validated outputs by prompt/context/image hashes. Reviews receive ordered frames extracted from the **encoded preview and final videos**, including causal cues and before/after samples. This is sampled visual/temporal review; the IDE transport does not submit video or narration audio. It is not a claim to have listened to the scene. Actual model name remains `null` because the existing IDE driver does not report the resolved model; provider and transport receipt are recorded without inventing a model name.

One initial authoring attempt plus at most three corrections are allowed; at most one correction may revisit the concept. No failure is replaced by a template or photography fallback. Results distinguish `approved`, `review_required`, `provider_unavailable` and `runtime_unavailable`. A process-level lock prevents overlapping writes to the same scene; a stale lock requires verifying the old worker has stopped before removal. Per-node LangGraph checkpoints are not independently persisted; replay uses durable action receipts.

## Verification

```powershell
npx ts-node graph/motion/tests/motion.test.ts
```

These tests use explicit model and renderer doubles. They cover AST restrictions, all model roles, compilation feedback, visual rejection, bounded retry, independent final review, hash-based replay, tampering and locked-audio rejection. They do **not** claim a real model-authored or Docker-rendered pilot. A Docker worker build, real three-dimensional scenes, editorial evaluation, full-episode continuity review and measured production performance are still acceptance work.

## Production graph integration

The main TypeScript LangGraph exposes two explicit modes. `legacy` preserves the previous graph. `authored` adds `motion_plan`, `narration_lock`, the resumable `motion_dispatch` loop, `motion_join`, and `archive_motion` between narration and sound design. The director selects a bounded set of script beats; those beats receive the `remotion-authored` provider and bypass photographic frame and Kling generation. The main Remotion composition plays their verified video without the legacy Ken Burns transform or HUD overlays.

Authored mode requires a real word-level aligner. Configure a local executable that accepts one JSON request on stdin and returns `{provider, model, words:[{text,startMs,endMs,confidence}]}` on stdout:

```powershell
$env:HSL_MOTION_ALIGNER_COMMAND = 'C:\path\to\forced-aligner.exe'
$env:HSL_MOTION_ALIGNER_ARGS_JSON = '["--json-stdio"]'
```

The graph freezes narration to the exact timeline before alignment, requires cue confidence of at least `0.8`, and invalidates cached motion when the script, audio, alignment, runtime, dependency lock, or worker image changes. It does not derive timestamps from word counts.

After configuring the aligner and the pinned Docker image, start an authored run through Matrix (`npm run hsl:matrix`, then answer `s` to the motion squad question) or directly:

```powershell
npx ts-node -T graph/production/cli.ts run --episode HSL_EPISODE_012 --media-mode real --motion-mode authored --motion-scenes 3 --motion-require-3d
```

If the renderer, provider, alignment, or review blocks a scene, the graph persists the diagnostic and enters `AUTHORED_MOTION_REVIEW`. Resume with `retry` after correcting the cause, or `abort` to terminate the run. Approved source packages, previews, final videos, reviews, hashes, and receipts are included in the storage archive.
