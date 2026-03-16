import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FlashcardForm from '../components/FlashcardForm';
import FlashcardViewer from '../components/FlashcardViewer';

const API = 'http://localhost:5000/api/flashcards';

export default function FlashcardsPage() {
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editCard, setEditCard] = useState(null);

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    const res = await axios.get(API);
    setCards(res.data);
    const uniqueDecks = ['All', ...new Set(res.data.map(c => c.deck))];
    setDecks(uniqueDecks);
  };

  const handleSave = async (cardData) => {
    if (editCard) {
      await axios.put(`${API}/${editCard._id}`, cardData);
    } else {
      await axios.post(API, cardData);
    }
    setShowForm(false);
    setEditCard(null);
    fetchCards();
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchCards();
  };

  const filtered = selectedDeck === 'All' ? cards : cards.filter(c => c.deck === selectedDeck);

  return (
    <div className="page">
      <div className="page-header">
        <h2>🃏 Flashcard Creator</h2>
        <button className="btn-primary" onClick={() => { setEditCard(null); setShowForm(true); }}>
          + New Card
        </button>
      </div>

      <div className="deck-filter">
        {decks.map(d => (
          <button
            key={d}
            className={selectedDeck === d ? 'deck-btn active' : 'deck-btn'}
            onClick={() => setSelectedDeck(d)}
          >{d}</button>
        ))}
      </div>

      {showForm && (
        <FlashcardForm
          initial={editCard}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditCard(null); }}
        />
      )}

      {filtered.length > 0 ? (
        <FlashcardViewer
          cards={filtered}
          onEdit={(card) => { setEditCard(card); setShowForm(true); }}
          onDelete={handleDelete}
        />
      ) : (
        <p className="empty-msg">No flashcards yet. Create your first one!</p>
      )}
    </div>
  );
}