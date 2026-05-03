import axios from 'axios';

// Base URL for the bookmark API (update this when integrating with main project)
const API_URL = 'http://localhost:5000/api/bookmarks'; 

const createBookmark = async (bookmarkData) => {
    const response = await axios.post(`${API_URL}/create`, bookmarkData);
    return response.data;
};

const getBookmarks = async (filters = {}) => {
    // Construct query string based on filters
    const queryParams = new URLSearchParams();
    if (filters.subject) queryParams.append('subject', filters.subject);
    if (filters.topic) queryParams.append('topic', filters.topic);
    if (filters.resourceType) queryParams.append('resourceType', filters.resourceType);
    if (filters.uploadedBy) queryParams.append('uploadedBy', filters.uploadedBy);

    const queryString = queryParams.toString();
    const url = queryString ? `${API_URL}?${queryString}` : API_URL;

    const response = await axios.get(url);
    return response.data;
};

const updateBookmark = async (id, bookmarkData) => {
    const response = await axios.put(`${API_URL}/${id}`, bookmarkData);
    return response.data;
};

const deleteBookmark = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

const bookmarkService = {
    createBookmark,
    getBookmarks,
    updateBookmark,
    deleteBookmark
};

export default bookmarkService;
