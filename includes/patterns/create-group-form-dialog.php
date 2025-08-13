<!-- wp:prc-block/dialog {"dialogId":"38bba098-9158-4fa4-9547-c09f9a19efe5","className":"is-style-standard"} -->
<!-- wp:prc-block/dialog-trigger -->
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Create Group</a></div>
<!-- /wp:button -->
<!-- /wp:prc-block/dialog-trigger -->

<!-- wp:prc-block/dialog-element {"backdropColor":"ui-gray-dark","borderColor":"ui-gray-very-dark","backgroundColor":"white","fontFamily":"sans-serif","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}},"shadow":"var:preset|shadow|deep","border":{"radius":"5px","width":"1px"}}} -->
<!-- wp:group {"style":{"spacing":{"blockGap":"var:preset|spacing|30","padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|30"},"margin":{"bottom":"var:preset|spacing|50"}}},"layout":{"type":"flex","orientation":"vertical"}} -->
<div class="wp-block-group" style="margin-bottom:var(--wp--preset--spacing--50);padding-top:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30)"><!-- wp:paragraph {"style":{"typography":{"lineHeight":"1"}}} -->
<p style="line-height:1"><strong>Create a community group for:</strong></p>
<!-- /wp:paragraph -->

<!-- wp:post-title {"style":{"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"},"margin":{"top":"0","bottom":"0"}},"typography":{"lineHeight":"1"}},"fontSize":"medium","fontFamily":"sans-serif"} /--></div>
<!-- /wp:group -->

<!-- wp:prc-user-accounts/content-gate -->
<!-- wp:group {"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:prc-block/form {"namespace":"prc-quiz/controller","action":"createGroup","layout":{"type":"constrained","orientation":"vertical","verticalAlignment":"center","allowOrientation":true,"contentSize":"420px","justifyContent":"left"},"interactiveNamespace":"prc-quiz/controller"} -->
<form class="wp-block-prc-block-form"><!-- wp:prc-block/form-input-text {"required":true,"layout":{"type":"flex","orientation":"horizontal","verticalAlignment":"center","allowOrientation":true},"metadata":{"name":"groupName"}} -->
<div class="wp-block-prc-block-form-input-text"><label>Group Name</label><input placeholder="Enter your desired group name" name="groupName" type="text" required class=""/></div>
<!-- /wp:prc-block/form-input-text -->

<!-- wp:prc-block/form-submit -->
<!-- wp:button {"tagName":"button","type":"submit"} -->
<div class="wp-block-button"><button type="submit" class="wp-block-button__link wp-element-button">Create</button></div>
<!-- /wp:button -->

<!-- wp:prc-block/form-captcha /-->
<!-- /wp:prc-block/form-submit -->

<!-- wp:prc-block/form-message -->
<div><!-- wp:paragraph -->
<p>{{message}}</p>
<!-- /wp:paragraph --></div>
<!-- /wp:prc-block/form-message --></form>
<!-- /wp:prc-block/form --></div>
<!-- /wp:group -->
<!-- /wp:prc-user-accounts/content-gate -->
<!-- /wp:prc-block/dialog-element -->
<!-- /wp:prc-block/dialog -->
