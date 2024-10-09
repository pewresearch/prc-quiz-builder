/**
 * External Dependencies
 */
import { Button, Modal } from 'semantic-ui-react';

/**
 * Internal Dependencies
 */
import { useQuiz } from './context';

function ReturnToQuizModal({ open }) {
	const { resetUserSubmission, toggleResumeQuizStateModal } = useQuiz();

	const closeModal = () => {
		toggleResumeQuizStateModal(false);
	};

	return (
		<Modal
			open={open}
			onClose={() => {
				closeModal();
			}}
			size="small"
			dimmer="inverted"
		>
			<Modal.Header>Welcome back!</Modal.Header>
			<Modal.Content>
				<p>
					You can continue this quiz from where you left off or start over from the beginning.
				</p>
			</Modal.Content>
			<Modal.Actions>
				<Button
					color="black"
					onClick={() => {
						resetUserSubmission();
						closeModal();
					}}
				>
					Start Over
				</Button>
				<Button onClick={() => closeModal()} positive>
					Continue
				</Button>
			</Modal.Actions>
		</Modal>
	);
}

export default ReturnToQuizModal;
