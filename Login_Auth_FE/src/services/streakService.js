import axios from 'axios';

// Base URL for the streak API
const API_URL = 'http://localhost:5001/api/streaks'; // Using port 5001 for this isolated test to avoid conflict with port 5000 from bookmarks

const logActivity = async (userId) => {
    const response = await axios.post(`${API_URL}/log`, { userId });
    return response.data;
};

const getStreakData = async (userId) => {
    const response = await axios.get(`${API_URL}/${userId}`);
    return response.data;
};

const streakService = {
    logActivity,
    getStreakData
};

export default streakService;
