# PRC Quiz Builder - Block Relationships & Architecture

## Block Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Quiz Architecture                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ EMBEDDABLE OPTION                                                   │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ prc-quiz/embeddable                                             │ │
│ │ • References quiz post by ID                                    │ │
│ │ • Provides: prc-quiz/isEmbedded                                 │ │
│ │ • Enables quiz reusability across site                         │ │
│ └─────────────────────────┬───────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│ MAIN QUIZ STRUCTURE                                                 │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ prc-quiz/controller (ROOT ORCHESTRATOR)                        │ │
│ │ • Manages quiz state & user interactions                       │ │
│ │ • Handles API communication & submission                       │ │
│ │ • Provides: type, display-type, threshold, groupsEnabled       │ │
│ │ • Uses: prc-quiz/isEmbedded                                     │ │
│ │ • Watch Directives: storeSelectedAnswers, updateUserSubmission │ │
│ └─────────────────────┬───────────────────────┬───────────────────┘ │
└───────────────────────┼───────────────────────┼─────────────────────┘
                        │                       │
                        ▼                       ▼
            ┌───────────────────────┐   ┌─────────────────────┐
            │ QUIZ CONTENT          │   │ RESULTS DISPLAY     │
            │ prc-quiz/pages        │   │ prc-quiz/results    │
            │ • Container for pages │   │ • Container for     │
            │ • Page navigation     │   │   result blocks     │
            │ • State management    │   │ • Score & analysis  │
            └───────────┬───────────┘   │ • Provides: score,  │
                        │               │   submissionData    │
                        ▼               └─────────┬───────────┘
            ┌───────────────────────┐             │
            │ prc-quiz/page         │             ▼
            │ • Individual quiz page│   ┌─────────────────────┐
            │ • Content + questions │   │ RESULT BLOCKS       │
            │ • Provides: page/uuid │   │ ┌─────────────────┐ │
            │   page/title          │   │ │result-score     │ │
            └───────────┬───────────┘   │ │• Shows score    │ │
                        │               │ └─────────────────┘ │
                        ▼               │ ┌─────────────────┐ │
            ┌───────────────────────┐   │ │result-table     │ │
            │ prc-quiz/question     │   │ │• Answer breakdown│ │
            │ • Question text       │   │ └─────────────────┘ │
            │ • Types: single,      │   │ ┌─────────────────┐ │
            │   multiple,           │   │ │result-histogram │ │
            │   thermometer         │   │ │• Score chart    │ │
            │ • Provides: question/ │   │ └─────────────────┘ │
            │   type, uuid, text    │   │ ┌─────────────────┐ │
            └───────────┬───────────┘   │ │result-follow-us │ │
                        │               │ │• Social media   │ │
                        ▼               │ └─────────────────┘ │
            ┌───────────────────────┐   └─────────────────────┘
            │ prc-quiz/answer       │
            │ • Answer choices      │
            │ • Selection handling  │
            │ • Points & correctness│
            │ • Provides: answer/   │
            │   uuid, text, points  │
            └───────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW                                │
└─────────────────────────────────────────────────────────────────────┘

USER INTERACTION:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User clicks │───▶│ Answer      │───▶│ Question    │───▶│ Controller  │
│ answer      │    │ onAnswerClick│    │ updates     │    │ updates     │
│             │    │             │    │ selections  │    │ global state│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘

STATE MANAGEMENT:
┌─────────────────────────────────────────────────────────────────────┐
│ selectedAnswers: { questionUuid: [answerUuid, ...] }               │
│                                                                     │
│ Watch Directive: updateUserSubmission                              │
│                                                                     │
│ userSubmission: { answers: [answerUuid1, answerUuid2, ...] }       │
└─────────────────────────────────────────────────────────────────────┘

API SUBMISSION:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Submit Quiz │───▶│ Format Data │───▶│ API Call    │───▶│ Results     │
│ (threshold  │    │ { answers:  │    │ POST /quiz/ │    │ Display     │
│  met)       │    │   [...] }   │    │ submit      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Context Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CONTEXT FLOW                             │
└─────────────────────────────────────────────────────────────────────┘

prc-quiz/embeddable
└── isEmbedded ────────────────────────────────────────┐
                                                       │
prc-quiz/controller                                    ▼
├── type ──────────────────────────────────────────────┼─────────┐
├── display-type ──────────────────────────────────────┼─────────┤
├── demo-break-labels ─────────────────────────────────┼─────────┤
├── threshold ─────────────────────────────────────────┼─────────┤
├── groupsEnabled ─────────────────────────────────────┼─────────┤
│                                                      ▼         ▼
prc-quiz/pages                                    prc-quiz/results
│                                                 └── score
prc-quiz/page                                     └── submissionData
├── page/uuid ───────────────────────────────────────────────────┐
├── page/title ──────────────────────────────────────────────────┤
└── page/introductionNote ───────────────────────────────────────┤
                                                                 ▼
prc-quiz/question
├── question/type ─────────────────────────────────────────────┐
├── question/uuid ─────────────────────────────────────────────┤
└── question/text ─────────────────────────────────────────────┤
                                                               ▼
prc-quiz/answer
├── answer/text
├── answer/uuid
├── answer/correct
└── answer/points
```

## Interactivity API Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTERACTIVITY FEATURES                          │
└─────────────────────────────────────────────────────────────────────┘

CONTROLLER STORE: 'prc-quiz/controller'
┌─────────────────────────────────────────────────────────────────────┐
│ STATE:                                                              │
│ • selectedAnswers: { questionUuid: [answerUuid, ...] }             │
│ • userSubmission: { answers: [...] }                               │
│ • loaded, processing, currentPage                                  │
│                                                                     │
│ ACTIONS:                                                            │
│ • onAnswerClick, onNextPage, onPreviousPage                        │
│ • submitQuiz, resetSubmission                                      │
│                                                                     │
│ CALLBACKS:                                                          │
│ • onInit: Load quiz data from API                                  │
│ • storeSelectedAnswers: Sync selections to context                 │
│ • updateUserSubmission: Format for API submission                  │
│                                                                     │
│ WATCH DIRECTIVES:                                                   │
│ • data-wp-watch--store-selected-answers                            │
│ • data-wp-watch--update-user-submission                            │
└─────────────────────────────────────────────────────────────────────┘

ANSWER INTERACTION:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. User clicks answer                                               │
│ 2. onAnswerClick triggered with answer UUID                        │
│ 3. Question updates _selectedAnswers array                         │
│ 4. Question callback updates global selectedAnswers                │
│ 5. Controller watch directive triggers updateUserSubmission        │
│ 6. userSubmission formatted for API: { answers: [...] }            │
└─────────────────────────────────────────────────────────────────────┘
```

## Block Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCIES                               │
└─────────────────────────────────────────────────────────────────────┘

CORE DEPENDENCIES:
• WordPress Interactivity API
• wp.url (URL manipulation)
• wp.apiFetch (API communication)
• Local Storage (state persistence)

BLOCK INTERDEPENDENCIES:
• Controller ←→ API (quiz data, submission)
• Controller ←→ Pages (navigation state)
• Pages ←→ Page (visibility control)
• Page ←→ Question (content organization)
• Question ←→ Answer (selection management)
• Controller ←→ Results (result display)
• Results ←→ Result Blocks (data provision)

OPTIONAL DEPENDENCIES:
• Embeddable ←→ Controller (embedded context)
• Group functionality (collaborative quizzes)
• Analytics integration (tracking)
• Mailchimp integration (newsletter signup)
```

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API INTEGRATION                             │
└─────────────────────────────────────────────────────────────────────┘

GET /prc-api/v3/quiz/get/
├── Purpose: Load quiz structure and metadata
├── Parameters: quizId, nonce, groupId (optional)
└── Response: Complete quiz data model

POST /prc-api/v3/quiz/submit/
├── Purpose: Submit completed quiz for scoring
├── Parameters: quizId, nonce, groupId (optional)
├── Body: { answers: ['uuid1', 'uuid2', ...] }
└── Response: { hash: 'result-hash', time: execution-time }

POST /prc-api/v3/quiz/create-group/
├── Purpose: Create group quiz for collaboration
├── Parameters: quizId, nonce
└── Body: { name: 'group-name', owner: { id: user-id } }

GET /prc-api/v3/quiz/get-group/
├── Purpose: Retrieve group quiz data
├── Parameters: groupId
└── Response: Group data with aggregated results
```

## File Structure

```
plugins/prc-quiz-builder/
├── src/
│   ├── controller/          # Main quiz orchestrator
│   ├── pages/              # Page container
│   ├── page/               # Individual page
│   ├── question/           # Question block
│   ├── answer/             # Answer choice
│   ├── results/            # Results container
│   ├── result-score/       # Score display
│   ├── result-table/       # Answer breakdown
│   ├── result-histogram/   # Score chart
│   ├── result-follow-us/   # Social engagement
│   └── embeddable/         # Quiz embedding
├── includes/
│   ├── class-api.php       # Quiz data processing
│   ├── class-rest-api.php  # API endpoints
│   ├── class-archetypes.php # Result storage
│   └── API.md             # API documentation
└── build/                  # Compiled assets
```

This architecture provides a flexible, scalable quiz system with clear separation of concerns, robust state management, and comprehensive API integration.