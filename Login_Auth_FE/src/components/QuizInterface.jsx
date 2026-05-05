import React, { useState, useEffect } from 'react';

const QuizInterface = ({ quizData }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      handleSubmit();
    }
  }, [timer]);

  const handleAnswerSelection = (answer) => {
    setUserAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];
      newAnswers[currentQuestionIndex] = answer;
      return newAnswers;
    });
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.min(prevIndex + 1, quizData.length - 1));
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    const explanations = [];
    
    quizData.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      } else {
        explanations.push(`Question ${index + 1}: ${question.explanation}`);
      }
    });
    
    return { correctAnswers, total: quizData.length, explanations };
  };

  return (
    <div>
      {showResults ? (
        <ResultsDisplay results={calculateResults()} />
      ) : (
        <> 
          <div>
            <h2>{quizData[currentQuestionIndex].question}</h2>
            {quizData[currentQuestionIndex].options.map((option, index) => (
              <button key={index} onClick={() => handleAnswerSelection(option)}>
                {option}
              </button>
            ))}
          </div>
          <div>
            <button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>Previous</button>
            <button onClick={handleNextQuestion} disabled={currentQuestionIndex === quizData.length - 1}>Next</button>
            <button onClick={handleSubmit}>Submit</button>
          </div>
          <div>
            <progress value={currentQuestionIndex + 1} max={quizData.length} />
            <span>{(currentQuestionIndex + 1)} / {quizData.length}</span>
          </div>
          <div>
            <span>Time Remaining: {Math.floor(timer / 60)}:{timer % 60 < 10 ? `0${timer % 60}` : timer % 60}</span>
          </div>
        </>
      )}
    </div>
  );
};

const ResultsDisplay = ({ results }) => {
  return (
    <div>
      <h2>Your Results</h2>
      <p>Correct Answers: {results.correctAnswers} / {results.total}</p>
      <h3>Explanations for Incorrect Answers:</h3>
      <ul>
        {results.explanations.map((explanation, index) => (
          <li key={index}>{explanation}</li>
        ))}
      </ul>
    </div>
  );
};

export default QuizInterface;