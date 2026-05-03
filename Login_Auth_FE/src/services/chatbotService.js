import axios from 'axios';

const API_URL = 'http://localhost:5002/api/chatbot'; // Using port 5002 for isolated testing

const askQuestion = async (question) => {
    const response = await axios.post(`${API_URL}/ask`, { question });
    return response.data;
};

const chatbotService = {
    askQuestion
};

export default chatbotService;
