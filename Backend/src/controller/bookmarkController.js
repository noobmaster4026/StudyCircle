const Bookmark = require("../models/Bookmark");

// Create a new bookmark
const createBookmark = async (req, res) => {
    try {
        const { title, url, description, subject, topic, resourceType, uploadedBy } = req.body;

        if (!title || !url || !subject || !uploadedBy) {
            return res.status(400).json({ message: "Title, url, subject, and uploadedBy are required" });
        }

        const newBookmark = new Bookmark({
            title,
            url,
            description,
            subject,
            topic,
            resourceType,
            uploadedBy
        });

        await newBookmark.save();

        res.status(201).json({
            message: "Bookmark created successfully!",
            bookmark: newBookmark
        });
    } catch (error) {
        console.log("Error creating bookmark:", error);
        res.status(500).json({ message: "Server error creating bookmark." });
    }
};

// Get all bookmarks, with optional filtering by subject, topic, or uploadedBy
const getBookmarks = async (req, res) => {
    try {
        const { subject, topic, uploadedBy, resourceType } = req.query;
        
        let filter = {};
        if (subject) filter.subject = subject;
        if (topic) filter.topic = topic;
        if (uploadedBy) filter.uploadedBy = uploadedBy;
        if (resourceType) filter.resourceType = resourceType;

        const bookmarks = await Bookmark.find(filter).sort({ createdAt: -1 });

        res.status(200).json({ bookmarks });
    } catch (error) {
        console.log("Error fetching bookmarks:", error);
        res.status(500).json({ message: "Server error fetching bookmarks." });
    }
};

// Delete a bookmark
const deleteBookmark = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBookmark = await Bookmark.findByIdAndDelete(id);

        if (!deletedBookmark) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        res.status(200).json({ message: "Bookmark deleted successfully" });
    } catch (error) {
        console.log("Error deleting bookmark:", error);
        res.status(500).json({ message: "Server error deleting bookmark." });
    }
};

// Update a bookmark
const updateBookmark = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedBookmark = await Bookmark.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedBookmark) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        res.status(200).json({ 
            message: "Bookmark updated successfully",
            bookmark: updatedBookmark 
        });
    } catch (error) {
        console.log("Error updating bookmark:", error);
        res.status(500).json({ message: "Server error updating bookmark." });
    }
};

module.exports = {
    createBookmark,
    getBookmarks,
    deleteBookmark,
    updateBookmark
};
