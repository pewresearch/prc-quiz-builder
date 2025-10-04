/**
 * External Dependencies
 */
import { processToolRequest, RequestModal } from '@prc/nexus';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Generate a knowledge quiz from a request.
 *
 * @param {string} promptForQuiz          - The prompt for the quiz to generate.
 * @param {string} additionalInstructions - Additional instructions for the AI.
 * @return {Promise<string|null>} The quiz block markup for direct insertion.
 */
export async function aiGenerateKnowledgeQuiz(
	promptForQuiz = '',
	additionalInstructions = ''
) {
	try {
		const prompt = `${promptForQuiz}${
			additionalInstructions
				? `\n\nAdditional instructions: ${additionalInstructions}`
				: ''
		}`;

		const response = await processToolRequest(
			prompt,
			'generate-knowledge-quiz'
		);

		if (
			!response ||
			!response.candidates ||
			response.candidates.length === 0
		) {
			throw new Error('No quiz content generated', response);
		}

		// Return the first candidate directly (following table pattern)
		return response.candidates[0];
	} catch (error) {
		console.error('Error generating quiz:', error);
		throw error;
	}
}

/**
 * Generate Quiz Button component for quiz builder toolbar.
 *
 * @param {Object} props Component props.
 * @param {Function} props.setAttributes Function to set block attributes.
 * @param {string} props.clientId The block client ID.
 * @return {JSX.Element} The generate quiz button component.
 */
export function GenerateQuizButton({ setAttributes, clientId }) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	const { createSuccessNotice, createErrorNotice } =
		useDispatch(noticesStore);

	const handleRequest = async (
		request,
		instructions,
		tool,
		blockClientId,
		notices
	) => {
		setIsGenerating(true);

		try {
			const generatedMarkup = await aiGenerateKnowledgeQuiz(
				request,
				instructions
			);

			if (!generatedMarkup) {
				throw new Error('No quiz content was generated');
			}

			// Parse the generated markup and extract quiz content
			// This would need to be implemented based on how the quiz block
			// expects to receive its data structure
			const quizContent = parseQuizMarkup(generatedMarkup);

			// Set the generated content directly into the block
			setAttributes(quizContent);

			notices?.createSuccessNotice({
				message: __('Quiz generated successfully!', 'prc-quiz-builder'),
				type: 'snackbar',
			});

			setIsModalOpen(false);
		} catch (error) {
			console.error('Quiz generation error:', error);
			notices?.createErrorNotice({
				message:
					error.message ||
					__('Failed to generate quiz', 'prc-quiz-builder'),
				type: 'snackbar',
			});
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			<Button
				variant="secondary"
				onClick={() => setIsModalOpen(true)}
				disabled={isGenerating}
				isBusy={isGenerating}
			>
				{isGenerating
					? __('Generating...', 'prc-quiz-builder')
					: __('Generate Quiz with ✨ AI', 'prc-quiz-builder')}
			</Button>

			<RequestModal
				title={__('Generate Knowledge Quiz', 'prc-quiz-builder')}
				description={__(
					'Describe the quiz you want to create. For example: "Create a 5-question quiz about climate change" or "Generate a quiz about U.S. history with 8 questions".',
					'prc-quiz-builder'
				)}
				tool="generate-knowledge-quiz"
				isOpen={isModalOpen}
				allowAdditionalInstructions={true}
				onClose={() => setIsModalOpen(false)}
				clientId={clientId}
				onRequest={handleRequest}
			/>
		</>
	);
}

/**
 * Parse the generated quiz markup and convert it to quiz block attributes.
 *
 * @param {string} markup The generated HTML markup from the AI.
 * @return {Object} The quiz block attributes.
 */
function parseQuizMarkup(markup) {
	// TODO: This function needs to be implemented based on how the quiz builder
	// block expects to receive its attributes. This would involve:
	// 1. Parsing the HTML markup
	// 2. Extracting quiz pages, questions, and answers
	// 3. Converting to the expected block attributes structure
	// 4. Handling UUIDs and other metadata

	console.log('Generated markup:', markup);

	// For now, return a basic structure - this needs to be implemented
	// based on the actual quiz block attribute structure
	return {
		// This should match the quiz block's expected attribute structure
		// Based on the examples, it likely includes pages, questions, etc.
	};
}
