# Ink Audit Archive

This folder keeps persistent local tuning snapshots so ink iteration does not cycle.

Each snapshot folder should include:

- multi-ink and per-ink screenshots from `debug-audit-timesteps.html`
- exact copies of the active tuning files
- the current working diff
- a short note in `iteration-log.md` describing what changed and what improved or regressed

Use `scripts/capture-ink-audit.sh <label>` to create a new snapshot.
