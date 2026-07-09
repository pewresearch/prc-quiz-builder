<?php
/**
 * Title: (Quiz) Share Quiz Button
 * Slug: prc-quiz-builder/share-quiz-button
 * Categories: prc-quiz-builder
 * Description: Share quiz button with bound URL.
 * Block Types: prc-quiz/controller
 *
 * @package PRC\Platform\Quiz
 */

?>
<!-- wp:button {"backgroundColor":"ui-white","textColor":"ui-black","hasIcon":true,"iconLibrary":"sharp-solid","iconName":"share-nodes","metadata":{"bindings":{"url":{"source":"prc-quiz/builder","args":{"field":"share-quiz-url"}}},"categories":["prc-quiz-builder"],"patternName":"prc-quiz-builder/share-quiz-button","name":"(Quiz) Share Quiz Button"},"style":{"border":{"radius":{"topLeft":"25px","topRight":"25px","bottomLeft":"25px","bottomRight":"25px"},"width":"1px"},"spacing":{"padding":{"left":"var:preset|spacing|40","right":"var:preset|spacing|40","top":"var:preset|spacing|20","bottom":"var:preset|spacing|20"}}},"fontFamily":"sans-serif","borderColor":"ui-gray-light","className":"prc-quiz-share-quiz-button"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-ui-black-color has-ui-white-background-color has-text-color has-background has-border-color has-ui-gray-light-border-color has-sans-serif-font-family wp-element-button" style="border-width:1px;border-top-left-radius:25px;border-top-right-radius:25px;border-bottom-left-radius:25px;border-bottom-right-radius:25px;padding-top:var(--wp--preset--spacing--20);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--20);padding-left:var(--wp--preset--spacing--40)">Share Quiz</a></div>
<!-- /wp:button -->