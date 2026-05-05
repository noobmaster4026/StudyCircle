const NoteContent = require("../models/NoteContent");

// Takes a user's question, searches the database using MongoDB text search, and returns an "AI" response.
const askQuestion = async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ message: "Please provide a question." });
        }

        // 1. Perform a MongoDB text search to find notes matching the question keywords.
        // We sort by textScore to get the most relevant notes first.
        const relevantNotes = await NoteContent.find(
            { $text: { $search: question } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } }).limit(2); // Top 2 matches to keep the answer concise

        if (relevantNotes.length === 0) {
            return res.status(200).json({ 
                answer: "I'm sorry, but I couldn't find any information about that in your uploaded course materials and notes. Could you try rephrasing your question or uploading more notes?" 
            });
        }

        // 2. Format the response to feel like an AI Chatbot
        // In a "Semi-Mock", we concatenate the matched text and present it conversationally.
        let aiResponse = `Based on your course materials, here is what I found:\n\n`;
        
        relevantNotes.forEach(note => {
            // We can excerpt the first few sentences or the whole content depending on length
            // For this implementation, we'll return a snippet to keep chat bubbles readable.
            let snippet = note.content;
            if (snippet.length > 300) {
                snippet = snippet.substring(0, 300) + "...";
            }
            aiResponse += `**From "${note.title}"**: ${snippet}\n\n`;
        });

        res.status(200).json({ answer: aiResponse.trim() });

    } catch (error) {
        console.log("Error processing question:", error);
        res.status(500).json({ message: "Server error processing your question." });
    }
};

module.exports = {
    askQuestion
};
