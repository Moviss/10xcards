# i18n step 2 implementation (feature flag + safe mode)

Source plan: `.ai/translations-step2-detailed-plan.md`.

## Scope delivered

1. Central i18n feature flag contract and parser:
   - `FEATURE_I18N_MVP` -> `feature.i18n_mvp`
   - fail-closed parsing (`1|true|on` => `true`, all other values => `false`)
2. Unified SSR/client flag access:
   - `src/lib/i18n/feature-flags.ts`
3. Layout snapshot injection:
   - SSR snapshot serialized to `window.__10XCARDS_FEATURE_FLAGS__`
   - `<html data-feature-i18n-mvp="off|on">`
4. Global runtime bootstrap guarded by the flag:
   - `src/components/GlobalI18nBootstrap.tsx`
   - runtime marker: `<html data-i18n-runtime="on">`
   - start event: `10xcards:i18n-runtime-start`
5. Navigation control points for future switcher:
   - desktop/mobile slot placeholders behind `feature.i18n_mvp`
6. OFF/ON validation in tests and CI:
   - unit/component tests for helpers and bootstrap
   - E2E OFF regression + ON smoke in workflow

## OFF vs ON behavior

| Area | OFF | ON |
|---|---|---|
| `window.__10XCARDS_FEATURE_FLAGS__` | `{ "feature.i18n_mvp": false }` | `{ "feature.i18n_mvp": true }` |
| `html[data-feature-i18n-mvp]` | `off` | `on` |
| Runtime bootstrap side-effects | no-op | sets runtime marker + dispatches start event |
| Navigation switcher slots | hidden | rendered (`desktop` and `mobile`) |

## Rollout checklist

1. Deploy code with `FEATURE_I18N_MVP=0` in every environment.
2. Run OFF regression checks:
   - `npm run lint`
   - `npx vitest src/lib/i18n/contracts.test.ts src/lib/i18n/feature-flags.test.ts src/components/GlobalI18nBootstrap.test.tsx src/components/navigation/Navigation.feature-flag.test.tsx`
   - `FEATURE_I18N_MVP=0 npx playwright test e2e/happy-path.spec.ts`
3. Enable `FEATURE_I18N_MVP=1` on dev and run ON smoke:
   - `FEATURE_I18N_MVP=1 npx playwright test e2e/i18n-feature-flag.spec.ts`
4. Repeat ON smoke on test/staging.
5. Enable production progressively and monitor client runtime errors/hydration warnings.

## Rollback runbook

1. Set `FEATURE_I18N_MVP=0` in target environment.
2. Trigger standard rolling deploy (no DB migration required).
3. Verify markers on `/login`:
   - `html[data-feature-i18n-mvp="off"]`
   - no `data-i18n-runtime` marker
4. Re-run OFF smoke:
   - `FEATURE_I18N_MVP=0 npx playwright test e2e/i18n-feature-flag.spec.ts`
5. If incident persists, roll back to previous application release tag (still no data migration impact).
