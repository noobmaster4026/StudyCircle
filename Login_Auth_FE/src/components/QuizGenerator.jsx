import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuizGenerator = () => {
    const [tab, setTab] = useState('fromNote'); // or 'fromText'
    const [questionCount, setQuestionCount] = useState(10);
    const [difficulty, setDifficulty] = useState('easy');
    const [loading, setLoading] = useState(false);
    const [quizzes, setQuizzes] = useState([]);

    const handleTabChange = (newTab) => {
        setTab(newTab);
    };

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://opentdb.com/api.php?amount=${questionCount}&difficulty=${difficulty}&type=multiple`);
            setQuizzes(response.data.results);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (loading) return;
        fetchQuizzes();
    }, [questionCount, difficulty]);

    return (
        <div>
            <h1>Quiz Generator</h1>
            <div className="tab">
                <button disabled={tab === 'fromNote'} onClick={() => handleTabChange('fromNote')}>From Note</button>
                <button disabled={tab === 'fromText'} onClick={() => handleTabChange('fromText')}>From Text</button>
            </div>
            <div>
                <label>
                    Question Count:
                    <input type="number" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} />
                </label>
                <label>
                    Difficulty:
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </label>
                <button onClick={fetchQuizzes}>Generate Quizzes</button>
            </div>
            {loading ? <p>Loading...</p> : <div>{quizzes.map((quiz, index) => <div key={index}>{quiz.question}</div>)}</div>}
        </div>
    );
};

export default QuizGenerator;
