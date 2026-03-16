import React, { useState } from 'react';

export default function FlashcardViewer({ cards, onEdit, onDelete }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  const next = () => { setFlipped(false); setTimeout(() => setIndex((i) => (i + 1) % cards.length), 150); };
  const prev = () => { setFlipped(false); setTimeout(() => setIndex((i) => (i - 1 + cards.length) % cards.length), 150); };

  return (
    <div className="viewer">
      <p className="card-count">{index + 1} / {cards.length} — <span className="deck-tag">{card.deck}</span></p>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <p className="card-label">Question</p>
            <p>{card.question}</p>
          </div>
          <div className="flashcard-back">
            <p className="card-label">Answer</p>
            <p>{card.answer}</p>
          </div>
        </div>
      </div>
      <p className="flip-hint">Click card to flip</p>

      <div className="viewer-controls">
        <button className="btn-secondary" onClick={prev}>← Prev</button>
        <button className="btn-icon" onClick={() => onEdit(card)}>✏️</button>
        <button className="btn-icon danger" onClick={() => { if(window.confirm('Delete this card?')) onDelete(card._id); }}>🗑️</button>
        <button className="btn-secondary" onClick={next}>Next →</button>
      </div>
    </div>
  );
}