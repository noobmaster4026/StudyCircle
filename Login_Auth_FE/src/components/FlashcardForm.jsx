import React, { useState } from 'react';

export default function FlashcardForm({ initial, onSave, onCancel }) {
  const [deck, setDeck] = useState(initial?.deck || '');
  const [question, setQuestion] = useState(initial?.question || '');
  const [answer, setAnswer] = useState(initial?.answer || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!deck || !question || !answer) return alert('All fields required');
    onSave({ deck, question, answer });
  };

  return (
    <div className="modal-overlay">
      <form className="card-form" onSubmit={handleSubmit}>
        <h3>{initial ? 'Edit Card' : 'New Flashcard'}</h3>
        <input placeholder="Deck name (e.g. React, Math)" value={deck} onChange={e => setDeck(e.target.value)} />
        <textarea placeholder="Question / Concept" value={question} onChange={e => setQuestion(e.target.value)} rows={3} />
        <textarea placeholder="Answer / Definition" value={answer} onChange={e => setAnswer(e.target.value)} rows={3} />
        <div className="form-actions">
          <button type="submit" className="btn-primary">Save</button>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}