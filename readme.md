# PRC Quiz Builder

An interactive, block-based quiz system for the PRC platform.

## Overview

Quiz Builder provides a custom `quiz` post type and a suite of Gutenberg blocks backed by the WordPress Interactivity API. Authors compose quizzes in the block editor using a Controller → Pages → Page → Question → Answer hierarchy; the Controller block injects all runtime state into the Interactivity API context and coordinates submission, scoring, and results display on the frontend. The plugin supports three quiz modes (scored quiz, typology/clustering, freeform), three display types (paged, scrollable, and fluid), community group results, and iframe-embeddable views.

Firebase Realtime Database is the persistence layer for archetype (result) records and community groups. WordPress post meta tracks submission analytics.

### Dependencies

- **Upstream**: `prc-platform-core` (provides `\PRC\Platform\Firebase` and the `prc_api_endpoints`, `prc_platform_on_post_init`, and `prc_iframe_content` hooks), `prc-research-teams` (optional — registers team-prefixed quiz URLs via `prc_research_teams_rewrite_config`), WP Consent API (`wp_add_cookie_info`)
- **Downstream**: Internal analytics tooling queries the `_submissions` REST field on the `quiz` post type; any page embedding a quiz via `/embed/` or `/iframe/` URLs

## Architecture

The plugin bootstraps through `includes/class-plugin.php`, which loads all dependencies, registers the `quiz` CPT, sets up rewrite rules, and instantiates each block class. Blocks are loaded from `build/` (production) or `src/` (local/dev), controlled by `wp_get_environment_type()`.

Archetype lookups are cached in the WordPress object cache (`prc_quiz_builder_archetypes` group, 1-day TTL) and backed by Firebase. Community groups are stored only in Firebase; `Groups::get_group()` reads from Firebase.

The Controller block's `render_callback` is the key server/client bridge: it writes all runtime context (`quizId`, `quizType`, `displayType`, `configuredDisplayType`, `allowSubmissions`, `groupId`, `archetype`, etc.) into `data-wp-context` and wires up all Interactivity API directives. `configuredDisplayType` is an immutable copy of the author's `displayType` setting; `displayType` may be rewritten at runtime (e.g. fluid → scrollable on narrow viewports). Core/buttons blocks that carry specific CSS classes (`prc-quiz-start-button`, `prc-quiz-next-page-button`, `prc-quiz-submit-button`, etc.) have `data-wp-on--click` attributes injected server-side via `WP_HTML_Tag_Processor`.

### Key Files

| Path                                    | Purpose                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `prc-quiz-builder.php`                  | Plugin entry point; defines `PRC_QUIZ_FILE`, `PRC_QUIZ_DIR`, `PRC_QUIZ_VERSION` constants                |
| `includes/class-plugin.php`             | Core orchestrator — loads deps, registers CPT, rewrite rules, query vars, cookies, and all blocks        |
| `includes/class-archetypes.php`         | Firebase CRUD for archetype (result hash) records; object-cache layer                                    |
| `includes/class-groups.php`             | Firebase CRUD for community groups                                                                       |
| `includes/class-rest-api.php`           | REST endpoint registration and handlers; contains the `$rest_disabled` kill switch                       |
| `includes/class-analytics.php`          | `_report` post meta schema and submission counter; exposes `_submissions` REST field                     |
| `includes/class-ability.php`            | WP Abilities API `prc-quiz-builder/get-analytics` tool (submissions + groups; MCP + REST)                |
| `includes/class-cli-report.php`         | WP-CLI `wp prc quiz report` — ad hoc read/update of `_report` meta                                       |
| `includes/class-cli-build-audience.php` | WP-CLI `wp prc quiz build-group-owners-audience` — newsletter audience from group owners                 |
| `includes/class-loader.php`             | Hook registration queue                                                                                  |
| `includes/class-block-supports.php`     | CPT-scoped inserter filtering (`allowed_block_types_all`), Quiz Builder category, editor-support enqueue |
| `includes/editor-support/`              | Unregisters quiz core block variations outside the `quiz` CPT editor                                     |
| `includes/inspector-sidebar-panel/`     | Block editor plugin that renders a quiz analytics sidebar panel; only enqueued on the `quiz` CPT screen  |
| `src/controller/class-controller.php`   | Controller block — server render, Interactivity API context injection, button directive patching         |
| `src/controller/view.js`                | Controller Interactivity API store — display-type resolution, submission, page visibility, navigation    |
| `src/results/class-results.php`         | Results block server render                                                                              |
| `src/group-results/`                    | Group results block (view script + create-group action)                                                  |
| `src/embeddable/`                       | Embeddable block for cross-site reuse                                                                    |
| `build/`                                | Compiled JS/CSS/asset manifests for all blocks                                                           |

## Blocks

| Block            | Namespace                   | Role                                                                   |
| ---------------- | --------------------------- | ---------------------------------------------------------------------- |
| Controller       | `prc-quiz/controller`       | Root block; owns all Interactivity API state and submission flow       |
| Pages            | `prc-quiz/pages`            | Wrapper for a multi-page quiz                                          |
| Page             | `prc-quiz/page`             | A single page; contains questions and arbitrary content                |
| Question         | `prc-quiz/question`         | Single-choice, multiple-choice, or thermometer; supports randomization |
| Answer           | `prc-quiz/answer`           | Answer choice with optional correctness, points, and label             |
| Results          | `prc-quiz/results`          | Container rendered after quiz completion                               |
| Result Score     | `prc-quiz/result-score`     | Displays the participant's score                                       |
| Result Table     | `prc-quiz/result-table`     | Tabular results view; supports demographic breaks                      |
| Result Histogram | `prc-quiz/result-histogram` | Score distribution histogram                                           |
| Group Results    | `prc-quiz/group-results`    | Community group aggregate results; required to enable group creation   |
| Embeddable       | `prc-quiz/embeddable`       | Reuse a quiz across other posts; edits propagate to all embeds         |

Quiz blocks appear in the block inserter only when editing the `quiz` post type, grouped under the **Quiz Builder** category (`prc-quiz` slug). The **Quiz** embeddable block (`prc-quiz/embeddable`) remains available on other post types for synced cross-post reuse.

## Display Types and Frontend Behavior

The Controller block's `displayType` attribute accepts `paged`, `scrollable`, or `fluid`. Runtime behavior is implemented in `src/controller/view.js` and `src/page/view.js`.

### Fluid resolution

A `fluid` quiz resolves to a concrete display mode by viewport width (782px breakpoint, matching the block editor's mobile preview). Resolution runs on init and re-runs on window resize via `actions.applyDisplayType` (`data-wp-on-async-window--resize` on the Controller when `displayType` is `fluid`):

| Viewport   | Resolved `displayType` | Notes                                                      |
| ---------- | ---------------------- | ---------------------------------------------------------- |
| `< 782px`  | `scrollable`           | Next-page button wrappers hidden within the quiz container |
| `>= 782px` | `paged`                | Next-page button wrappers shown; one page at a time        |

`configuredDisplayType` retains the original `fluid` value so client logic can distinguish a fluid quiz that resolved to scrollable from a natively scrollable quiz, and so resize handlers can re-resolve without losing the fluid configuration.

### Page visibility (`displayPages`)

The Pages block binds `hidden` to `!state.displayPages` (`src/pages/class-pages.php`). Visibility rules:

| Configuration                   | During quiz          | Results or group-results URL |
| ------------------------------- | -------------------- | ---------------------------- |
| `paged`                         | Pages visible        | Pages hidden                 |
| `fluid` → `paged` (desktop)     | Pages visible        | Pages hidden                 |
| `scrollable` (native)           | Pages always visible | Pages always visible         |
| `fluid` → `scrollable` (mobile) | Pages visible        | Pages hidden (matches paged) |

Native scrollable quizzes keep pages visible on results URLs so inline, submit-as-you-go results can render below the questions. Fluid quizzes on mobile hide pages when landing on a results URL so users are not dropped at the top of the question stack.

### Navigation buttons

Quiz action buttons are `core/buttons` block variations patched with Interactivity API click handlers:

| CSS class                       | Action                | Behavior                                                                                                                                  |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `prc-quiz-start-button`         | `onStartQuizClick`    | Sets `currentPageUuid` to the first question page (`pages[1]`). In non-paged modes, scrolls smoothly to that page via `[data-page-uuid]`. |
| `prc-quiz-next-page-button`     | `onNextPageClick`     | Advances to the next page; scrolls the quiz container into view (paged only).                                                             |
| `prc-quiz-previous-page-button` | `onPreviousPageClick` | Returns to the previous page.                                                                                                             |
| `prc-quiz-submit-button`        | `onSubmitQuizClick`   | Submits the quiz (triggers Mailchimp form when present).                                                                                  |
| `prc-quiz-reset-button`         | `onResetQuizClick`    | Resets quiz state or navigates back to the quiz URL from results.                                                                         |

### Submission behavior

Submission is controlled by the `allowSubmissions` Controller attribute and the active display type:

| `allowSubmissions` | Display type                          | Submit trigger                                                               |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| `true`             | `paged` / `fluid` → `paged`           | Explicit Submit button on the last page                                      |
| `true`             | `scrollable` / `fluid` → `scrollable` | Explicit Submit button on the last page (no auto-submit on answer threshold) |
| `false`            | `scrollable` / `fluid` → `scrollable` | Auto-submits via `onScrollableSubmit` when the user meets `threshold`        |
| `false`            | `paged`                               | Submit button still required                                                 |

When submissions are enabled, scrollable and fluid-on-mobile quizzes require a `prc-quiz-submit-button` on the last page. Quizzes with submissions disabled and a native scrollable display type advance to results automatically once the answer threshold is met.

### Results display scroll

When results become visible, `onResultsDisplay` in `src/results/view.js` scrolls the results block into view (`scrollIntoView` with `block: 'start'`). This applies to all display types, including fluid quizzes on mobile: after submit, question pages hide and the viewport moves to the top of the results block so users are not left scrolled to the middle of the page.

## Hooks & Filters

| Hook                                | Type   | Description                                                                                                |
| ----------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `allowed_block_types_all`           | filter | Hides `prc-quiz/*` blocks outside the `quiz` CPT editor (except `prc-quiz/embeddable`)                     |
| `block_categories_all`              | filter | Appends the `prc-quiz` block category on the `quiz` CPT editor only                                        |
| `prc_api_endpoints`                 | filter | Registers `quiz/create-group`, `quiz/get-group`, `quiz/submit`, and `quiz/purge-archetypes` REST routes    |
| `init`                              | action | Registers all quiz URL patterns (results, group, embed) via `add_rewrite_rule`                             |
| `query_vars`                        | filter | Registers `quizArchetype`, `quizGroup`, `quizGroupDomain`, `quizShowResults`, `quizShareQuiz`, `quizEmbed` |
| `prc_research_teams_rewrite_config` | filter | Injects quiz URL patterns for research-team-prefixed routes (e.g. `/politics/quiz/...`)                    |
| `prc_platform_on_post_init`         | action | Creates the Firebase quiz entry when a new `quiz` post is initialized                                      |
| `prc_iframe_content`                | filter | Wraps quiz content with a PRC-branded header in iframe/embed views                                         |
| `render_block_context`              | filter | Injects `prc-quiz/id` into block context for `prc-quiz/controller` on singular quiz pages                  |
| `render_block_core/buttons`         | filter | Patches Interactivity API `data-wp-on--click` onto quiz action buttons by CSS class                        |
| `prc_quiz_log_submission`           | action | Fired on quiz submit; consumed internally by `Analytics` to increment `_report` post meta                  |
| `enqueue_block_editor_assets`       | action | Enqueues editor-support outside the quiz CPT and the inspector sidebar panel on quiz CPT only              |

## REST API

All endpoints are registered through the platform's `prc_api_endpoints` filter. Public write endpoints validate the quiz post (exists, `quiz` post type, published) and apply per-IP rate limiting on submit.

| Method | Route                   | Auth                         | Description                                                                                                  |
| ------ | ----------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `POST` | `quiz/submit`           | Rate limit + quiz validation | Records a submission; creates or increments the archetype in Firebase; updates group if `groupId` is present |
| `POST` | `quiz/create-group`     | Firebase ID token (`X-PRC-User-Token`) | Creates a community group in Firebase; **owner is always the verified token's `sub` claim** — any `ownerId` in the request body is ignored; returns `{ group_id, group_url }` |
| `GET`  | `quiz/get-group`        | Public                       | Returns full group data including typology clusters, answer tallies, and result/group URLs                   |
| `POST` | `quiz/purge-archetypes` | `manage_options`             | Admin-only; wipes all archetypes for a quiz from Firebase                                                    |

The `quiz` REST resource also exposes a `_submissions` field containing the `_report` post meta (requires `edit_posts` capability).

## WP Abilities API

| Ability ID | Input | Description |
| --- | --- | --- |
| `prc-quiz-builder/get-analytics` | `post_id` (integer, required) | Returns `{ post_id, title, submissions, groups }` — submission report from `_report` meta plus community group analytics. Requires `edit_post` on that quiz. If Firebase is unavailable, `groups` includes an `error` field while `submissions` still returns. Exposed via REST and MCP. |

## WP-CLI

Requires `manage_options`. All mutation subcommands support `--dry-run`.

| Subcommand                         | Description                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `wp prc quiz report get`           | Print current `_report` for a quiz (`--format=table\|json`)                                       |
| `wp prc quiz report set`           | Set absolute month and/or `total` counts                                                          |
| `wp prc quiz report add`           | Add a delta to month and/or `total` counts                                                        |
| `wp prc quiz report sync-firebase` | Sum Firebase archetype `hits` and apply to month + `total` (`--mode=delta\|set`, default `delta`) |

```bash
# Inspect report
wp prc quiz report get --quiz-id=313764

# Backfill from Firebase (delta mode adds firebase_hits - current_total)
wp prc quiz report sync-firebase --quiz-id=313764 --year=2026 --month=06 --dry-run
wp prc quiz report sync-firebase --quiz-id=313764 --year=2026 --month=06

# Manual correction
wp prc quiz report add --quiz-id=313764 --year=2026 --month=06 --month-count=500 --total=500
wp prc quiz report set --quiz-id=313764 --year=2026 --month=06 --month-count=125653 --total=125653
```

`sync-firebase` loads the full `quiz/{id}/archetypes` node; large quizzes may be slow. `first_24_hours` and `first_week` are not modified by these commands.

## URL Patterns

| Pattern                                           | Query Vars                                                     |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `/quiz/{slug}/`                                   | `quiz={slug}`                                                  |
| `/quiz/{slug}/results/{hash}/`                    | `quiz`, `quizArchetype`, `quizShowResults=true`                |
| `/quiz/{slug}/group/{group-id}/`                  | `quiz`, `quizGroup`                                            |
| `/quiz/{slug}/group/{group-id}/results/`          | `quiz`, `quizGroup`, `quizShowResults=true`                    |
| `/quiz/{slug}/group/{group-id}/results/{hash}/`   | `quiz`, `quizGroup`, `quizArchetype`, `quizShowResults=true`   |
| `/quiz/{slug}/group/{domain}/{group-id}/results/` | `quiz`, `quizGroup`, `quizGroupDomain`, `quizShowResults=true` |
| `/quiz/{slug}/embed/` or `/quiz/{slug}/iframe/`   | `quiz`, `iframe=true`                                          |

Research-team-prefixed variants (e.g. `/politics/quiz/{slug}/...`) follow the same sub-patterns, registered via `prc_research_teams_rewrite_config`.

## Data Storage

| Store           | Key / Path                           | Contents                                                                |
| --------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Firebase        | `quiz/{quiz_id}/archetypes/{hash}`   | `{ score, submission, hits }`                                           |
| Firebase        | `quiz/{quiz_id}/groups/{group_id}`   | Group metadata, cluster tallies, answer tallies, total                  |
| Firebase        | `users/{owner_id}/groups/{group_id}` | Group index per user                                                    |
| WP post meta    | `_report`                            | Submission counts: first 24 hrs, first week, total, by year/month       |
| WP object cache | MD5 of `{quiz_id, hash}`             | Cached archetype lookup; group `prc_quiz_builder_archetypes`; TTL 1 day |

## Cookies

Both cookies are registered with WP Consent API as `functional`, 30-day expiry.

| Cookie                       | Contents                                                                  |
| ---------------------------- | ------------------------------------------------------------------------- |
| `prc-quiz-builder`           | Quiz progress JSON: answers, scores, archetype hash, completion timestamp |
| `prc-quiz-builder__typology` | Typology answers and assigned group for personalization                   |

## Local Development

```bash
# From the monorepo root:
npx turbo build --filter=@prc/quiz-builder
npm run start -w @prc/quiz-builder
```

To run Playwright tests (from the monorepo root — VIP dev-env and Playwright are all centralized at root):

```bash
npm run vip:start
npm test -- tests/prc-quiz-builder/
```

## Firebase availability

Archetype persistence and community groups require Firebase Realtime Database. `Archetypes::is_available()` and `Groups` guard all writes when `prc-firebase` is not configured or the service account is missing.

### Submit behavior when Firebase is down

| Quiz type | `quiz/submit` behavior |
| --- | --- |
| **Normal** (no `groupId`) | Returns `{ hash, time, persisted: false }` with HTTP 200 — in-session results still work; archetype hits are not stored |
| **Group** (`groupId` present) | Returns HTTP 503 — shared group tallies cannot be updated without Firebase |

Group creation (`quiz/create-group`) returns HTTP 503 when Firebase Auth is unavailable.

### Local Firebase setup

Service account generation is documented in [`docs/DEPENDENCY_AUTH.md`](../../docs/DEPENDENCY_AUTH.md) (`npm run gen:firebase-sa`). `prc-firebase` reads `WPCOM_VIP_PRIVATE_DIR/firebase-service-account.json`.

## Troubleshooting

### Blocks not appearing after a build

**Symptom**: `prc-quiz/controller` (or any quiz block) is missing from the editor or throws a "block is invalid" error.  
**Cause**: `load_blocks()` globs `build/*/` for block directories and calls `include_block()` on each. If a compiled PHP file is missing from `build/{block-name}/class-{block-name}.php`, the error is logged but swallowed silently — the block just won't register.  
**Fix**: Run `npx turbo build --filter=@prc/quiz-builder` and confirm PHP files exist under `build/`. Check PHP error logs for `Block missing.` entries.

### Quiz submissions failing silently

**Symptom**: Users complete a quiz but results don't persist; the submit endpoint returns a 403, 404, 429, or generic error.  
**Cause**: `Rest_API::$rest_disabled` may be flipped to `true` (emergency kill switch in `class-rest-api.php`), the quiz post may be unpublished or missing, or the per-IP rate limit (100 submissions per quiz per minute) may be exceeded.  
**Fix**: If the kill switch is active, set `$rest_disabled = false` and redeploy. Confirm the quiz post is published. For 429 responses, wait and retry or investigate abusive traffic.

### Group quizzes fail with 503

**Symptom**: Group submit or create-group returns "results service is temporarily unavailable."  
**Cause**: Firebase Realtime Database or Auth is not configured (`private/firebase-service-account.json` missing locally, or deploy injection skipped).  
**Fix**: Run `npm run gen:firebase-sa` locally; confirm `prc-firebase` loads the service account on the target environment. Normal (non-group) quizzes may still return in-session results with `persisted: false`.

### Inspector sidebar panel not loading

**Symptom**: No quiz analytics panel appears in the block editor sidebar.  
**Cause**: `Inspector_Sidebar_Panel::enqueue_block_plugin_assets()` only enqueues on screens where `$screen->post_type === 'quiz'`. It also checks `is_admin()`. Opening the editor from a non-`quiz` post type silently skips enqueue.  
**Fix**: Confirm you are editing a `quiz` post type, not a page or another CPT that embeds the quiz via `prc-quiz/embeddable`.
