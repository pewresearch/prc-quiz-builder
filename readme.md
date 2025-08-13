# PRC Quiz Builder

A block-first, interactive quiz system for the PRC platform. Authors compose quizzes using Gutenberg blocks powered by the WordPress Interactivity API. Supports classic quizzes, typology clustering, embeddable usage, and community group results.

## Requirements
- WordPress ≥ 6.7
- PHP ≥ 8.1
- PRC Platform (monorepo) with standard PRC plugins/themes enabled

## Features
- Custom post type `quiz` with pretty permalinks and embeddable views
- Block library for end-to-end quiz authoring
- Paged or scrollable display modes
- Quiz types: scored quiz, typology, freeform
- Group creation and group results for typology quizzes
- Results components: score, table, histogram, group results
- WordPress Interactivity API for frontend state and persistence
- REST API endpoints for submission and group operations
- Cookies registered with WP Consent API for transparency

## Included Blocks
- Controller — `prc-quiz/controller`
  - Controls quiz type, display mode, and global behaviors; provides context to child blocks
- Pages — `prc-quiz/pages`
  - Wrapper for a multi-page quiz
- Page — `prc-quiz/page`
  - A single page that can contain one or more questions and other content
- Question — `prc-quiz/question`
  - Single-choice, multiple-choice, or thermometer; supports randomization and conditional display
- Answer — `prc-quiz/answer`
  - Answer choice with optional correctness, points, and labeling
- Results — `prc-quiz/results`
  - Container for results display once a quiz is completed
- Result Score — `prc-quiz/result-score`
  - Displays the participant’s score
- Result Table — `prc-quiz/result-table`
  - Tabular results view; supports demo breaks
- Result Histogram — `prc-quiz/result-histogram`
  - Histogram of score distribution
- Group Results — `prc-quiz/group-results`
  - Community group results. Required for enabling group creation and group-specific results views.
- Embeddable — `prc-quiz/embeddable`
  - Save and reuse quizzes across the site; updates propagate to all embeds

## Authoring Workflow (Editor)
1. Insert a Quiz post (`quiz` post type)
2. Add the Quiz Controller (`prc-quiz/controller`)
3. Add Pages → Page → Question → Answer blocks following this tree:
   - Controller → Pages → Page → Question → Answer(s)
4. Configure Controller settings (quiz type: quiz/typology/freeform; display: paged/scrollable)
5. Optionally add Results blocks (score, table, histogram) and Group Results for typology group experiences
6. Publish. Use standard PRC patterns for start/next/submit buttons (see Patterns below)

## Patterns
The plugin registers a `Quiz Builder` block pattern category and provides button/dialog patterns (start, next, submit, create group). Depending on platform configuration, patterns may be loaded as synced patterns.

## Routes and Query Vars
The plugin registers rewrite rules for human-friendly quiz and results URLs.
- Quiz: `/quiz/{quiz-slug}/`
- Results: `/quiz/{quiz-slug}/results/{archetype-hash}/`
- Grouped quiz: `/quiz/{quiz-slug}/group/{group-id}/`
- Group results: `/quiz/{quiz-slug}/group/{group-id}/results/`
- Group results (with domain): `/quiz/{quiz-slug}/group/{group-domain}/{group-id}/results/`
- Embed views: `/quiz/{quiz-slug}/embed/` and `/quiz/{quiz-slug}/iframe/`

Registered query vars include: `quizArchetype`, `quizGroup`, `quizGroupDomain`, `quizShowResults`, `quizShareQuiz`, `quizEmbed`.

## REST API
Endpoints are registered through the PRC Platform API aggregator.

- POST `quiz/create-group`
  - Body JSON: `{ groupName, ownerId, answers, clusters }`
  - Params: `quizId` (string), `nonce` (string)
  - Response: `{ group_id, group_url }` or `WP_Error`

- GET `quiz/get-group`
  - Params: `groupId` (string), `nonce` (string)
  - Response: `{ group_id, name, quiz_id, created, owner, typology_groups, answers, total, results_url, group_url, quiz_name }` or `WP_Error`

- POST `quiz/submit`
  - Body JSON: `{ hash, userSubmission, score }`
  - Params: `quizId` (string), `nonce` (string), optional `groupId` (string)
  - Response: `{ hash, time }` or `WP_Error`

Security: All endpoints validate a nonce of the form `prc_quiz_nonce--{id}`.

## Cookies (WP Consent API)
- `prc-quiz-builder` — 30 days — Stores quiz JSON (answers, scores, hash, completion timestamp)
- `prc-quiz-builder__typology` — 30 days — Stores typology answers and group for personalization

## Custom Post Type
- Type: `quiz`
- Public, queryable, REST-enabled; archive on `/quiz/`
- Taxonomies: `category`, `research-teams`, `bylines`, `datasets`, `collections`
- Menu icon: `dashicons-forms`

## Development
Inside `plugins/prc-quiz-builder/`:

- Build blocks:
  ```bash
  npm run build           # production build
  npm run start           # watch mode for development
  npm run build:all       # legacy + ESM + blocks manifest
  ```

- Tests (Playwright):
  ```bash
  npm install
  npm run test:env:start
  npm test
  # debugging
  npm run test:debug
  npm run test:ui
  npm run test:headed
  ```
  See `plugins/prc-quiz-builder/tests/README.md` for details.

## Embedding
- Use the `Embeddable` block to reuse a quiz across pages.
- Iframe-friendly views are available at `/quiz/{slug}/embed/` and `/quiz/{slug}/iframe/`.

## License
GPL-2.0+ — see header in `prc-quiz-builder.php`.

## Credits
Author: Seth Rubenstein. Part of the PRC Platform monorepo.
