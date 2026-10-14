# Roadmap

[← Back to README](../README.md)

This is a proposed sequence for improving the diploma prototype. Unchecked items describe future work, not existing capabilities or release commitments.

## 1. Reproduce and validate the model

- [ ] Recover the training notebook/scripts and document dataset provenance.
- [ ] Use one shared feature extractor for training and inference.
- [ ] Reconcile domain parsing, URL normalization, and constant training columns.
- [ ] Fit text/numeric preprocessing on training data only and inspect possible leakage.
- [ ] Investigate the observed Google and GitHub false positives.
- [ ] Publish a reproducible split, per-model and ensemble metrics, and a confusion matrix.
- [ ] Evaluate score calibration and an appropriate decision threshold.
- [ ] Document a reproducible model export and dependency environment.

## 2. Make browser checks reliable

- [ ] Carry the originating `tabId` and URL through each request and response.
- [ ] Deduplicate overlapping navigation events and discard stale responses.
- [ ] Make content-script initialization safe to run more than once.
- [ ] Show the active URL's current verdict and API connection state in the popup.
- [ ] Handle timeouts, HTTP errors, and pages without supported content scripts.
- [ ] Align inherited domain trust with the popup controls.
- [ ] Verify bundled fonts, notification layout, and Chromium compatibility.

## 3. Improve packaging and the API

- [ ] Validate request JSON and return clear errors for malformed URLs.
- [ ] Add a health endpoint and load the model relative to the application file.
- [ ] Pin dependencies and correct Dockerfile shell quoting.
- [ ] Verify Docker startup and add a small build context with `.dockerignore`.
- [ ] Review local-only binding, CORS, and extension permissions.
- [ ] Add focused checks for feature consistency, API behavior, and tab routing.
- [ ] Choose a distribution strategy for the large model bundle and an open-source license.

## 4. Extend the research

- [ ] Compare URL-only inference with optional WHOIS, certificate, or page-content signals.
- [ ] Define a review process for user-submitted examples and model updates.
- [ ] Evaluate newer data and realistic browsing distributions.
- [ ] Explore model explanations beyond heuristic notification reasons.

## Documentation prepared

- [x] English and Russian README with setup instructions and current behavior.
- [x] Original banner, architecture illustration, and current interface preview.
- [x] Saved-model notes separating artifact evidence from thesis claims.
- [x] Contributor guidance and GitHub issue forms.
