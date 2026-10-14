# Contributing

Thanks for helping develop SafeSurf AI beyond its diploma prototype. Read the [README](README.md), [model notes](docs/MODEL.md), and [roadmap](docs/ROADMAP.md) before proposing a change.

## Report a problem

Use the bug-report issue form and include:

- The component: model/API, browser extension, setup, or documentation.
- What you expected and what happened.
- A reproducible sequence, environment versions, and relevant logs.
- For inference problems, the request and response, with private query values removed.

URL strings can be tested through the local API without visiting the target website. A model label alone should not be used as the ground-truth label of a new dataset example.

## Propose a change

1. Create a branch for one focused change.
2. Follow the local setup instructions in the README.
3. Explain the problem, resulting behavior, and relevant verification in the pull request.
4. Update both README languages when changing public setup instructions or behavior.

There is no automated test suite yet. Verify changes at the level they affect: a model change needs evaluation evidence, an API change needs request/response checks, and extension behavior needs browser verification. Documentation changes need valid links and accurate examples.

## Model changes

Keep feature order and calculation consistent between training and inference. Do not replace a model solely because a few demonstration URLs look better. Record training dependencies, dataset provenance, split strategy, and held-out performance; update `docs/MODEL.md` with the artifact contract.

## Repository contents

Keep virtual environments, local browsing history, private datasets, and generated reports out of Git. The active model bundle is already tracked; changing model storage requires an explicit migration plan.

An open-source license has not yet been selected. Contributor and distribution terms need to be settled before presenting the project as a licensed open-source release.
