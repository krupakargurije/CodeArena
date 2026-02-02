import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getGlobalStats = () => {
    return axios.get(`${API_BASE_URL}/api/stats`);
};

export { getGlobalStats };
