# PRC Quiz Builder

An interactive, block-based quiz system for the PRC platform.

## Overview

Quiz Builder provides a custom `quiz` post type and a suite of Gutenberg blocks backed by the WordPress Interactivity API. Authors compose quizzes in the block editor using a Controller → Pages → Page → Question → Answer hierarchy; the Controller block injects all runtime state into the Interactivity API context and coordinates submission, scoring, and results display on the frontend. The plugin supports three quiz modes (scored quiz, typology/clustering, freeform), paged and scrollable display, community group results, and iframe-embeddable views.

Firebase Realtime Database is the persistence layer for archetype (result) records and community groups. WordPress post meta tracks submission analytics.

### Dependencies

- **Upstream**: `prc-platform-core` (provides `\PRC\Platform\Firebase` and the `prc_api_endpoints`, `prc_platform_rewrite_rules`, `prc_platform_rewrite_query_vars`, `prc_platform_on_post_init`, and `prc_iframe_content` hooks), `prc-research-teams` (optional — registers team-prefixed quiz URLs via `prc_research_teams_rewrite_config`), WP Consent API (`wp_add_cookie_info`)
- **Downstream**: Internal analytics tooling queries the `_submissions` REST field on the `quiz` post type; any page embedding a quiz via `/embed/` or `/iframe/` URLs

## Architecture

The plugin bootstraps through `includes/class-plugin.php`, which loads all dependencies, registers the `quiz` CPT, sets up rewrite rules, and instantiates each block class. Blocks are loaded from `build/` (production) or `src/` (local/dev), controlled by `wp_get_environment_type()`.

Archetype lookups are cached in the WordPress object cache (`prc_quiz_builder_archetypes` group, 1-day TTL) and backed by Firebase. Community groups have two layers: a legacy MySQL custom table (`Community_Groups_Table`) and Firebase — `get_group()` lazily migrates records from MySQL to Firebase on first access and keeps both fields for backward compatibility.

The Controller block's `render_callback` is the key server/client bridge: it writes all runtime context (`quizId`, `nonce`, `quizType`, `displayType`, `groupId`, `archetype`, etc.) into `data-wp-context` and wires up all Interactivity API directives. Core/buttons blocks that carry specific CSS classes (`prc-quiz-next-page-button`, `prc-quiz-submit-button`, etc.) have `data-wp-on--click` attributes injected server-side via `WP_HTML_Tag_Processor`.

### Key Files

| Path | Purpose |
|------|---------|
| `prc-quiz-builder.php` | Plugin entry point; defines `PRC_QUIZ_FILE`, `PRC_QUIZ_DIR`, `PRC_QUIZ_VERSION` constants |
| `includes/class-plugin.php` | Core orchestrator — loads deps, registers CPT, rewrite rules, query vars, cookies, and all blocks |
| `includes/class-archetypes.php` | Firebase CRUD for archetype (result hash) records; object-cache layer |
| `includes/class-groups.php` | Firebase CRUD for community groups; lazy migration from legacy MySQL table |
| `includes/class-rest-api.php` | REST endpoint registration and handlers; contains the `$rest_disabled` kill switch |
| `includes/class-analytics.php` | `_report` post meta schema and submission counter; exposes `_submissions` REST field |
| `includes/class-loader.php` | Hook registration queue |
| `includes/inspector-sidebar-panel/` | Block editor plugin that renders a quiz analytics sidebar panel; only enqueued on the `quiz` CPT screen |
| `includes/legacy-groups/index.php` | MySQL custom table definition (`Community_Groups_Table`, `Community_Groups_Query`) |
| `src/controller/class-controller.php` | Controller block — server render, Interactivity API context injection, button directive patching |
| `src/results/class-results.php` | Results block server render |
| `src/group-results/` | Group results block (view script + create-group action) |
| `src/embeddable/` | Embeddable block for cross-site reuse |
| `build/` | Compiled JS/CSS/asset manifests for all blocks |

## Blocks

| Block | Namespace | Role |
|-------|-----------|------|
| Controller | `prc-quiz/controller` | Root block; owns all Interactivity API state, nonce, submission flow |
| Pages | `prc-quiz/pages` | Wrapper for a multi-page quiz |
| Page | `prc-quiz/page` | A single page; contains questions and arbitrary content |
| Question | `prc-quiz/question` | Single-choice, multiple-choice, or thermometer; supports randomization |
| Answer | `prc-quiz/answer` | Answer choice with optional correctness, points, and label |
| Results | `prc-quiz/results` | Container rendered after quiz completion |
| Result Score | `prc-quiz/result-score` | Displays the participant's score |
| Result Table | `prc-quiz/result-table` | Tabular results view; supports demographic breaks |
| Result Histogram | `prc-quiz/result-histogram` | Score distribution histogram |
| Group Results | `prc-quiz/group-results` | Community group aggregate results; required to enable group creation |
| Embeddable | `prc-quiz/embeddable` | Reuse a quiz across other posts; edits propagate to all embeds |

The block editor receives a `Quiz Builder` block category (`prc-quiz` slug) so these blocks are grouped separately from the standard library.

## Hooks & Filters

| Hook | Type | Description |
|------|------|-------------|
| `block_categories_all` | filter | Appends the `prc-quiz` block category |
| `prc_api_endpoints` | filter | Registers `quiz/create-group`, `quiz/get-group`, `quiz/submit`, and `quiz/purge-archetypes` REST routes |
| `prc_platform_rewrite_rules` | filter | Adds all quiz URL patterns (results, group, embed) |
| `prc_platform_rewrite_query_vars` | filter | Registers `quizArchetype`, `quizGroup`, `quizGroupDomain`, `quizShowResults`, `quizShareQuiz`, `quizEmbed` |
| `prc_research_teams_rewrite_config` | filter | Injects quiz URL patterns for research-team-prefixed routes (e.g. `/politics/quiz/...`) |
| `prc_platform_on_post_init` | action | Creates the Firebase quiz entry when a new `quiz` post is initialized |
| `prc_iframe_content` | filter | Wraps quiz content with a PRC-branded header in iframe/embed views |
| `render_block_context` | filter | Injects `prc-quiz/id` into block context for `prc-quiz/controller` on singular quiz pages |
| `render_block_core/buttons` | filter | Patches Interactivity API `data-wp-on--click` onto quiz action buttons by CSS class |
| `prc_quiz_log_submission` | action | Fired on quiz submit; consumed internally by `Analytics` to increment `_report` post meta |
| `enqueue_block_editor_assets` | action | Enqueues the inspector sidebar panel assets (quiz CPT only) |

## REST API

All endpoints are registered through the platform's `prc_api_endpoints` filter. Every public endpoint validates a nonce of the form `prc_quiz_nonce--{id}`.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `POST` | `quiz/submit` | Nonce | Records a submission; creates or increments the archetype in Firebase; updates group if `groupId` is present |
| `POST` | `quiz/create-group` | Nonce | Creates a community group in Firebase; returns `{ group_id, group_url }` |
| `GET` | `quiz/get-group` | Nonce | Returns full group data including typology clusters, answer tallies, and result/group URLs |
| `POST` | `quiz/purge-archetypes` | `manage_options` | Admin-only; wipes all archetypes for a quiz from Firebase |

The `quiz` REST resource also exposes a `_submissions` field containing the `_report` post meta (requires `edit_posts` capability).

## URL Patterns

| Pattern | Query Vars |
|---------|-----------|
| `/quiz/{slug}/` | `quiz={slug}` |
| `/quiz/{slug}/results/{hash}/` | `quiz`, `quizArchetype`, `quizShowResults=true` |
| `/quiz/{slug}/group/{group-id}/` | `quiz`, `quizGroup` |
| `/quiz/{slug}/group/{group-id}/results/` | `quiz`, `quizGroup`, `quizShowResults=true` |
| `/quiz/{slug}/group/{group-id}/results/{hash}/` | `quiz`, `quizGroup`, `quizArchetype`, `quizShowResults=true` |
| `/quiz/{slug}/group/{domain}/{group-id}/results/` | `quiz`, `quizGroup`, `quizGroupDomain`, `quizShowResults=true` |
| `/quiz/{slug}/embed/` or `/quiz/{slug}/iframe/` | `quiz`, `iframe=true` |

Research-team-prefixed variants (e.g. `/politics/quiz/{slug}/...`) follow the same sub-patterns, registered via `prc_research_teams_rewrite_config`.

## Data Storage

| Store | Key / Path | Contents |
|-------|-----------|----------|
| Firebase | `quiz/{quiz_id}/archetypes/{hash}` | `{ score, submission, hits }` |
| Firebase | `quiz/{quiz_id}/groups/{group_id}` | Group metadata, cluster tallies, answer tallies, total |
| Firebase | `users/{owner_id}/groups/{group_id}` | Group index per user |
| WP post meta | `_report` | Submission counts: first 24 hrs, first week, total, by year/month |
| WP object cache | MD5 of `{quiz_id, hash}` | Cached archetype lookup; group `prc_quiz_builder_archetypes`; TTL 1 day |
| MySQL (legacy) | `community_groups` custom table | Legacy group data — migrated lazily to Firebase on first `get_group()` call |

## Cookies

Both cookies are registered with WP Consent API as `functional`, 30-day expiry.

| Cookie | Contents |
|--------|---------|
| `prc-quiz-builder` | Quiz progress JSON: answers, scores, archetype hash, completion timestamp |
| `prc-quiz-builder__typology` | Typology answers and assigned group for personalization |

## Local Development

```bash
# From the monorepo root:
npm run build -w @prc/quiz-builder
npm run start -w @prc/quiz-builder
```

To run Playwright tests:

```bash
cd plugins/prc-quiz-builder
npm run test:env:start
npm test
```

## Troubleshooting

### Blocks not appearing after a build

**Symptom**: `prc-quiz/controller` (or any quiz block) is missing from the editor or throws a "block is invalid" error.  
**Cause**: `load_blocks()` globs `build/*/` for block directories and calls `include_block()` on each. If a compiled PHP file is missing from `build/{block-name}/class-{block-name}.php`, the error is logged but swallowed silently — the block just won't register.  
**Fix**: Run `npm run build -w @prc/quiz-builder` and confirm PHP files exist under `build/`. Check PHP error logs for `Block missing.` entries.

### Quiz submissions failing silently

**Symptom**: Users complete a quiz but results don't persist; the submit endpoint returns a 403 or generic error.  
**Cause**: Either the nonce is stale (format `prc_quiz_nonce--{quiz_id}`) or `Rest_API::$rest_disabled` has been flipped to `true` (emergency kill switch in `class-rest-api.php`).  
**Fix**: Verify the nonce is generated fresh on each page load in the Controller's `render_block_callback`. If the kill switch is active, set `$rest_disabled = false` and redeploy.

### Legacy group URLs returning 404

**Symptom**: A group URL created before the Firebase migration returns "Group not found".  
**Cause**: `Groups::get_group()` first queries Firebase; if empty, it attempts `upgrade_legacy_group_if_exists()` which queries the legacy MySQL table. If the MySQL record was already deleted or the table was dropped, migration fails silently.  
**Fix**: Confirm `Community_Groups_Table::exists()` returns true. If the table was removed, the group cannot be recovered from legacy storage.

### Inspector sidebar panel not loading

**Symptom**: No quiz analytics panel appears in the block editor sidebar.  
**Cause**: `Inspector_Sidebar_Panel::enqueue_block_plugin_assets()` only enqueues on screens where `$screen->post_type === 'quiz'`. It also checks `is_admin()`. Opening the editor from a non-`quiz` post type silently skips enqueue.  
**Fix**: Confirm you are editing a `quiz` post type, not a page or another CPT that embeds the quiz via `prc-quiz/embeddable`.
