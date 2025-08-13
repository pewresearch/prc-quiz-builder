# Changelog

## [1.4.0] - 2025-01-28

### Added
- Comprehensive README documentation for all quiz blocks
- Block relationship diagram showing architecture and data flow
- Individual README files for each block type:
  - `controller/README.md`: Main quiz orchestrator documentation
  - `pages/README.md`: Page container documentation
  - `page/README.md`: Individual page documentation
  - `question/README.md`: Question block documentation
  - `answer/README.md`: Answer choice documentation
  - `results/README.md`: Results container documentation
  - `embeddable/README.md`: Quiz embedding documentation
  - Result block documentation for score, table, histogram, and follow-us blocks
- `BLOCK-RELATIONSHIPS.md`: Comprehensive architecture diagram and documentation

### Documented
- Complete block hierarchy and parent-child relationships
- Context flow between blocks and data sharing
- Interactivity API integration and state management
- API endpoints and data formats
- Watch directives and callback functionality
- Usage patterns and best practices for each block

## [1.3.1] - 2025-01-28

### Added
- Watch directives to controller block for automatic user submission tracking
- `storeSelectedAnswers` callback to sync selections to context for other blocks
- `updateUserSubmission` callback to format selections for quiz API submission
- User submission model that matches quiz API format: `{ answers: ['uuid1', 'uuid2', ...] }`

### Changed
- Enhanced controller block with automatic data flow from user selections to API-ready format
- Improved integration between answer blocks and submission handling

## [1.3.0] - 2025-01-28

### Added
- Enhanced controller block with user submission tracking
- Watch directives for automatic data synchronization
- Context-based data sharing between blocks

### Changed
- Improved answer selection handling and state management
- Enhanced API integration for quiz submission

## [1.2.0] - 2025-01-27

### Added
- Quiz controller block with interactivity features
- Answer selection and validation
- API integration for quiz submission
- Local storage for state persistence

### Changed
- Improved quiz navigation and user experience
- Enhanced error handling and validation

## [1.1.0] - 2025-01-26

### Added
- Basic quiz structure with pages and questions
- Answer blocks with selection functionality
- Results display blocks
- Embeddable quiz functionality

### Changed
- Improved block editor experience
- Enhanced styling and responsive design

## [1.0.0] - 2025-01-25

### Added
- Initial quiz builder plugin structure
- Core quiz blocks (controller, pages, questions, answers)
- Basic API integration
- Results display functionality