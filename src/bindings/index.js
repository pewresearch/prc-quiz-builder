/**
 * Quiz Builder editor bindings and core block variations.
 * Enqueued only on the quiz post type editor via Quiz_Bindings.
 */
import registerQuestionBinding from './question-binding';
import registerAnswerBinding from './answer-binding';
import registerPageTitleBinding from './page-title-binding';
import registerButtonVariations from './button-variations';
import registerAdultsReceivingScoreBinding from './adults-receiving-score-binding';
import registerBlockBits from './block-bits';

registerQuestionBinding();
registerAnswerBinding();
registerPageTitleBinding();
registerButtonVariations();
registerAdultsReceivingScoreBinding();
registerBlockBits();
