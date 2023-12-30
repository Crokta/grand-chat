import {API_BASE_URL} from "../config";
import axios from "axios";

export const getRooms = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/rooms/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data.results
};

export const searchRooms = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/search/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data.results
};

export const getRoom = async (roomId: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data
};

export const joinRoom = async (csrfToken: string, roomId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/rooms/${roomId}/join/`, {}, {
        headers: {
            'X-CSRFToken': csrfToken
        }
    });
    return response.data
}

export const leaveRoom = async (csrfToken: string, roomId: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/rooms/${roomId}/leave/`, {}, {
        headers: {
            'X-CSRFToken': csrfToken
        }
    });
    return response.data
}
