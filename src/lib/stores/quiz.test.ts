import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { quizSession, currentQuizQuestion, quizProgress, quizResults } from './quiz';
import type { QuizQuestion } from '$lib/types';

function makeQuestion(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
	return {
		highlightId: 'hl-1',
		type: 'multiple_choice',
		question: 'What is X?',
		correctAnswer: 'Option A',
		explanation: 'Because...',
		options: ['Option A', 'Option B', 'Option C', 'Option D'],
		confidence: 0.9,
		...overrides
	};
}

describe('quiz store', () => {
	beforeEach(() => {
		quizSession.clearSession();
	});

	describe('startSession', () => {
		it('should initialize with questions, currentIndex=0, empty answers, isComplete=false', () => {
			const questions = [makeQuestion(), makeQuestion({ highlightId: 'hl-2' })];

			quizSession.startSession(questions, 'col-1', 'Test Collection');
			const session = get(quizSession);

			expect(session).not.toBeNull();
			expect(session!.questions).toHaveLength(2);
			expect(session!.currentIndex).toBe(0);
			expect(session!.answers).toEqual([]);
			expect(session!.isComplete).toBe(false);
			expect(session!.collectionId).toBe('col-1');
			expect(session!.collectionTitle).toBe('Test Collection');
		});

		it('should mark complete immediately if empty questions', () => {
			quizSession.startSession([], 'col-1', 'Empty Quiz');
			const session = get(quizSession);

			expect(session).not.toBeNull();
			expect(session!.isComplete).toBe(true);
			expect(session!.questions).toHaveLength(0);
		});
	});

	describe('answerQuestion', () => {
		it('should advance to next question and record answer with isCorrect and timing', () => {
			const questions = [makeQuestion(), makeQuestion({ highlightId: 'hl-2' })];
			quizSession.startSession(questions, 'col-1', 'Test');

			const answer = quizSession.answerQuestion('Option A', true);

			expect(answer).not.toBeNull();
			expect(answer!.questionIndex).toBe(0);
			expect(answer!.userAnswer).toBe('Option A');
			expect(answer!.isCorrect).toBe(true);
			expect(answer!.timeMs).toBeGreaterThanOrEqual(0);

			const session = get(quizSession);
			expect(session!.currentIndex).toBe(1);
			expect(session!.answers).toHaveLength(1);
			expect(session!.isComplete).toBe(false);
		});

		it('should mark complete after last question', () => {
			quizSession.startSession([makeQuestion()], 'col-1', 'Test');

			quizSession.answerQuestion('Option A', true);

			const session = get(quizSession);
			expect(session!.isComplete).toBe(true);
			expect(session!.currentIndex).toBe(1);
		});

		it('should return null if session is complete', () => {
			quizSession.startSession([makeQuestion()], 'col-1', 'Test');
			quizSession.answerQuestion('Option A', true);

			const result = quizSession.answerQuestion('Option B', false);

			expect(result).toBeNull();
		});

		it('should return null if no session exists', () => {
			const result = quizSession.answerQuestion('Option A', true);

			expect(result).toBeNull();
		});
	});

	describe('skipQuestion', () => {
		it('should record as incorrect with empty answer', () => {
			quizSession.startSession([makeQuestion(), makeQuestion()], 'col-1', 'Test');

			const answer = quizSession.skipQuestion();

			expect(answer).not.toBeNull();
			expect(answer!.userAnswer).toBe('');
			expect(answer!.isCorrect).toBe(false);
			expect(answer!.questionIndex).toBe(0);

			const session = get(quizSession);
			expect(session!.currentIndex).toBe(1);
		});
	});

	describe('endSession', () => {
		it('should mark isComplete true', () => {
			const questions = [makeQuestion(), makeQuestion()];
			quizSession.startSession(questions, 'col-1', 'Test');

			quizSession.endSession();

			const session = get(quizSession);
			expect(session!.isComplete).toBe(true);
		});
	});

	describe('clearSession', () => {
		it('should set state to null', () => {
			quizSession.startSession([makeQuestion()], 'col-1', 'Test');

			quizSession.clearSession();

			expect(get(quizSession)).toBeNull();
		});
	});

	describe('currentQuizQuestion', () => {
		it('should return the active question', () => {
			const q1 = makeQuestion({ question: 'First question?' });
			const q2 = makeQuestion({ question: 'Second question?' });
			quizSession.startSession([q1, q2], 'col-1', 'Test');

			const current = get(currentQuizQuestion);

			expect(current).not.toBeNull();
			expect(current!.question).toBe('First question?');
		});

		it('should return null when no session', () => {
			expect(get(currentQuizQuestion)).toBeNull();
		});

		it('should return null when session is complete', () => {
			quizSession.startSession([makeQuestion()], 'col-1', 'Test');
			quizSession.answerQuestion('Option A', true);

			expect(get(currentQuizQuestion)).toBeNull();
		});
	});

	describe('quizProgress', () => {
		it('should reflect current position and percent', () => {
			const questions = [makeQuestion(), makeQuestion(), makeQuestion()];
			quizSession.startSession(questions, 'col-1', 'Test');

			let progress = get(quizProgress);
			expect(progress).not.toBeNull();
			expect(progress!.current).toBe(1);
			expect(progress!.total).toBe(3);
			expect(progress!.percent).toBe(0);

			quizSession.answerQuestion('A', true);
			progress = get(quizProgress);
			expect(progress!.current).toBe(2);
			expect(progress!.percent).toBe(33);

			quizSession.answerQuestion('B', false);
			progress = get(quizProgress);
			expect(progress!.current).toBe(3);
			expect(progress!.percent).toBe(67);
		});

		it('should return null when no session', () => {
			expect(get(quizProgress)).toBeNull();
		});
	});

	describe('quizResults', () => {
		it('should compute score correctly after completion', () => {
			const questions = [
				makeQuestion({ question: 'Q1' }),
				makeQuestion({ question: 'Q2' }),
				makeQuestion({ question: 'Q3' })
			];
			quizSession.startSession(questions, 'col-1', 'Test');

			quizSession.answerQuestion('Option A', true);
			quizSession.answerQuestion('Wrong', false);
			quizSession.answerQuestion('Option A', true);

			const results = get(quizResults);

			expect(results).not.toBeNull();
			expect(results!.totalQuestions).toBe(3);
			expect(results!.correctCount).toBe(2);
			expect(results!.scorePercent).toBe(67);
			expect(results!.totalTimeMs).toBeGreaterThanOrEqual(0);
			expect(results!.answers).toHaveLength(3);
		});

		it('should return null when session is not complete', () => {
			quizSession.startSession([makeQuestion(), makeQuestion()], 'col-1', 'Test');
			quizSession.answerQuestion('A', true);

			expect(get(quizResults)).toBeNull();
		});

		it('should return null when no session exists', () => {
			expect(get(quizResults)).toBeNull();
		});

		it('should handle all-correct quiz', () => {
			quizSession.startSession([makeQuestion(), makeQuestion()], 'col-1', 'Test');
			quizSession.answerQuestion('A', true);
			quizSession.answerQuestion('A', true);

			const results = get(quizResults);

			expect(results!.scorePercent).toBe(100);
			expect(results!.correctCount).toBe(2);
		});

		it('should handle empty quiz (0 questions)', () => {
			quizSession.startSession([], 'col-1', 'Test');

			const results = get(quizResults);

			expect(results).not.toBeNull();
			expect(results!.totalQuestions).toBe(0);
			expect(results!.scorePercent).toBe(0);
			expect(results!.answers).toEqual([]);
		});
	});
});
