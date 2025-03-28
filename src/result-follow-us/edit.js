/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { Fragment } from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import { Icon } from '@prc/icons';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param            props.context
 * @param            props.clientId
 * @param            props.isSelected
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes,
	setAttributes,
	context,
	clientId,
	isSelected,
}) {
	const blockProps = useBlockProps();

	return (
		<aside {...blockProps}>
			<p>
				For more research and analysis, follow Pew Research Center
				<br />
				on Twitter, Facebook, or sign up for our weekly newsletter:
			</p>
			<div className="ui horizontal list">
				<div className="item">
					<a href="" className="ui basic large button">
						<Icon icon="user-plus" library="light" /> Follow
					</a>
				</div>
				<div className="item">
					<a href="" className="ui basic large button">
						<Icon icon="thumbs-up" library="light" /> Like
					</a>
				</div>
				<div className="item">
					<a href="" className="ui basic large button">
						<Icon icon="envelope-open" library="light" /> Sign Up
					</a>
				</div>
			</div>
		</aside>
	);
}
