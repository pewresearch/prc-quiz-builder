# PRC Quiz Builder Tests

This directory contains comprehensive Playwright tests for the PRC Quiz Builder plugin, utilizing the WordPress e2e testing framework.

## Test Structure

### Test Files

1. **01-quiz-controller.spec.js** - Tests for the Quiz Controller block
   - Block insertion and configuration
   - Quiz type settings (quiz, typology, freeform)
   - Display type settings (paged, scrollable)
   - Context provision to child blocks
   - Styling and anchor support

2. **02-quiz-page.spec.js** - Tests for the Quiz Page block
   - Page creation and title setting
   - Child block allowance
   - Multiple page handling
   - Copy/paste functionality with UUID generation
   - Layout and styling options

3. **03-quiz-question.spec.js** - Tests for the Quiz Question block
   - Question types (single, multiple, thermometer)
   - Question text and configuration
   - Conditional display logic
   - Answer randomization
   - Thermometer and demo break values

4. **04-quiz-answer.spec.js** - Tests for the Quiz Answer block
   - Answer text and configuration
   - Correct answer marking
   - Points system
   - Results labeling
   - Conditional display
   - Context adaptation to question types

5. **05-interactivity-api.spec.js** - Tests for WordPress Interactivity API integration
   - Frontend interactivity initialization
   - Quiz state management
   - Answer selection (single/multiple choice)
   - Thermometer interactions
   - Navigation controls
   - Data persistence

6. **06-quiz-results.spec.js** - Tests for Quiz Results blocks
   - Results display after completion
   - Score calculation and display
   - Table and histogram results
   - Group results for typology quizzes
   - Demo break handling

### Utility Functions

**utils/quiz-builder-utils.js** - Shared utility functions for test setup:
- `createQuizPost()` - Creates a new post with quiz controller
- `addQuizPage()` - Adds a quiz page to the controller
- `addQuestion()` - Adds a question to a page
- `addAnswer()` - Adds an answer to a question
- `configureQuizSettings()` - Configures quiz controller settings
- `saveAndPreview()` - Saves and previews the quiz
- `interactWithQuiz()` - Interacts with quiz on frontend
- `loginToWordPress()` - Logs into WordPress admin

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the test environment:
   ```bash
   npm run test:env:start
   ```

### Test Commands

- **Run all tests**: `npm test`
- **Run with debug mode**: `npm run test:debug`
- **Run with UI mode**: `npm run test:ui`
- **Run with headed browser**: `npm run test:headed`

### Environment Management

- **Start environment**: `npm run test:env:start`
- **Stop environment**: `npm run test:env:stop`
- **Destroy environment**: `npm run test:env:destroy`
- **Reset environment**: `npm run test:env:reset`

## Test Environment

The tests use the WordPress e2e testing framework with:
- WordPress core with multisite support
- PRC Platform Core plugin
- PRC Block Library plugin
- PRC Quiz Builder plugin (current)
- Query Monitor for debugging
- PRC Design System theme

## Configuration

### .wp-env.json
Configures the WordPress environment for testing with necessary plugins and themes.

### playwright.config.js
Configures Playwright test runner with:
- Test directory: `./tests`
- Base URL: `http://localhost:8888`
- Multiple browsers: Chrome, Firefox, Safari
- Screenshot and video capture on failure
- Trace collection on retry

## Test Coverage

The tests cover:

### Block Editor Functionality
- Block insertion and configuration
- Block settings and controls
- Block relationships and context
- Copy/paste functionality
- Styling and layout options

### Frontend Interactivity
- WordPress Interactivity API integration
- Quiz state management
- Answer selection and validation
- Navigation between pages
- Results calculation and display

### Quiz Features
- Different quiz types (quiz, typology, freeform)
- Display modes (paged, scrollable)
- Question types (single, multiple, thermometer)
- Conditional display logic
- Answer randomization
- Demo break handling
- Group results for typology quizzes

### Data Handling
- UUID generation for blocks
- Results storage and retrieval
- Score calculation
- Answer labeling and categorization

## Best Practices

1. **Test Isolation**: Each test is independent and doesn't rely on state from other tests
2. **Utility Functions**: Common functionality is extracted into utility functions
3. **Error Handling**: Tests include error scenarios and edge cases
4. **Performance**: Tests are optimized for parallel execution
5. **Documentation**: Each test file includes clear descriptions and comments

## Debugging

For debugging tests:
1. Use `npm run test:debug` to run tests with Playwright inspector
2. Use `npm run test:ui` to run tests with Playwright UI mode
3. Use `npm run test:headed` to see browser interactions
4. Check screenshots and videos in `test-results/` directory for failed tests

## Maintenance

- Update test utilities when block APIs change
- Add new test cases for new features
- Update selectors when UI changes
- Review and update test data regularly
- Monitor test performance and optimize as needed