function calculateScore(questions, submissions) {
    if (!Array.isArray(questions) || !Array.isArray(submissions)) {
        throw new Error('Invalid input data for score calculation');
    }

    if (questions.length !== submissions.length) {
        throw new Error('Mismatch between number of questions and submissions');
    }
    let score = 0;

    questions.forEach((question, index) => {
        // Ensure the index is within bounds
        if (index < submissions.length) {
            const userAnswer = submissions[index];
            const correctAnswer = question.correctAnswer;

            if (userAnswer === correctAnswer) {
                score++;
            }
        }
    });

    return score;
}

export default calculateScore;