/**
 * External Dependencies
 */
import { Icon } from '@prc/icons';

import styled from '@emotion/styled';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	Placeholder as WPComPlaceholder,
	Spinner,
} from '@wordpress/components';
import { Fragment, useState } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import PlaceholderCreate from './placeholder-create';
import PlaceholderSearch from './placeholder-search';
import { POST_TYPE_LABEL } from './constants';

const LoadingIndicator = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
`;

const ToggleLink = ({ showCreateForm, toggleCreateForm }) => {
	return (
		<Button variant="link" onClick={toggleCreateForm}>
			{showCreateForm
				? __('Cancel')
				: __(`Create New ${POST_TYPE_LABEL}`)}
		</Button>
	);
};

const PlaceholderIcon = () => {
	return <Icon icon="block-question" library="light" />;
};

export default function Placeholder({
	attributes,
	setAttributes,
	disableCreation = false,
	isNew,
	isResolving,
}) {
	const [showCreateForm, setShowCreateForm] = useState(false);
	const toggleCreateForm = () => setShowCreateForm(!showCreateForm);

	return (
		<WPComPlaceholder
			instructions={__(
				`Search for an existing ${POST_TYPE_LABEL.toLowerCase()} or create a new one`
			)}
			label={__(`Synced ${POST_TYPE_LABEL}`)}
			icon={() => <PlaceholderIcon />}
		>
			<div style={{ width: '100%' }}>
				{!isNew && isResolving && (
					<LoadingIndicator>
						<span>Loading {POST_TYPE_LABEL}... </span>
						<Spinner />
					</LoadingIndicator>
				)}
				{isNew && (
					<Fragment>
						{!showCreateForm && (
							<PlaceholderSearch setAttributes={setAttributes} />
						)}
						{showCreateForm && (
							<PlaceholderCreate {...{ setAttributes }} />
						)}
						{false === disableCreation && (
							<ToggleLink
								showCreateForm={showCreateForm}
								toggleCreateForm={toggleCreateForm}
							/>
						)}
					</Fragment>
				)}
			</div>
		</WPComPlaceholder>
	);
}
