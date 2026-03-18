# Ink Audit Iteration Log

## How To Use

1. Capture a named snapshot before changing the inks.
2. Tune one or more inks.
3. Capture another named snapshot.
4. Add a short note here with:
   - what changed
   - what improved
   - what regressed
   - what to protect in the next pass

## 2025-03-17 local-current

- Baseline for the current local-only retune pass.
- Working themes:
  - `Rainbow Chrome` is protected as the hero.
  - `Silver` still risks reading graphite instead of mirror-steel.
  - `Pearl` is much more distinct from `Opal`, but should stay nacreous rather than flat white.
  - `Opal` is richer and more fire-tipped than before and should stay clearly more precious than `Pearl`.
- Before the next tuning pass, capture a frozen snapshot with `scripts/capture-ink-audit.sh`.

## 20250317-iter01-baseline

- Snapshot folder: `site/audit-captures/20250317-iter01-baseline`
- First frozen reference for the current local-only family pass.
- Visual read:
  - `Rainbow Chrome` hero is healthy and should remain protected.
  - `Metallic Gold` works, but the default studio variant still leans greener than its name promise.
  - `Metallic Silver` still reads too graphite / blue-grey in the default and bright variants; `OG Mirror` is the clearest silver.
  - `Pearl Mist` is distinct from `Opal`, but the default still risks reading a little faint.
  - `Opal Veil` already reads more precious than `Pearl`.
  - `Rose Foil`, `Galaxy Dust`, and `Ember Glitter` are usable, but the default sparkle personalities can still be pushed.
- Protection notes:
  - Do not flatten `Pearl` back into `Opal`.
  - Do not regress the rainbow hero.

## 20250317-iter02-retune

- Snapshot folder: `site/audit-captures/20250317-iter02-retune`
- Retune goals:
  - brighten `Silver`
  - add nacre pop to `Pearl`
  - make `Opal` more fire-tipped
  - return a few white-hot flashes to the metallics
- What improved:
  - `Pearl Mist` regained shell-white nacre and stayed distinct from `Opal`.
  - `Opal Veil` became more precious and more obviously peach-citron fired.
  - `Rose Foil` and `Ember Glitter` picked up more visible sparkle personality.
  - `Galaxy Dust` got slightly clearer mint-candy stars.
- What still lagged:
  - `Metallic Silver` was still too close to graphite steel in the default.
  - `Metallic Gold` default still carried more citron than ideal.

## 20250317-iter03-silver-gold

- Snapshot folder: `site/audit-captures/20250317-iter03-silver-gold`
- Narrow follow-up focused on `Silver` and `Gold`.
- What improved:
  - `Metallic Silver` default moved closer to mirror-steel and the `Bright Steel` variant now clearly reads brighter than `Studio Steel`.
  - `Metallic Silver` recovered some white-hot mirror cuts without losing all of the blue-lilac sparkle identity.
  - `Metallic Gold` default is a little less aggressively green, while `Citrus Cutie` keeps the playful chartreuse lane.
- Remaining caveats:
  - `Metallic Gold` studio default still has a citron bias, but it now reads within the gold family rather than drifting toward chartreuse confetti.
  - If `Silver` needs another pass, the next move should be body reflectance and highlight shape, not more arbitrary saturation.
