import {API_BASE_URL} from "../config";
import axios from "axios";

export const getMessages = async (roomId: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/rooms/${roomId}/messages/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    return response.data.results
}

export const addMessage = async (csrfToken: string, roomId: string, content: string) => {
    const response = await axios.post(`${API_BASE_URL}/api/rooms/${roomId}/messages/`, {
        'content': content
    }, {
        headers: {
            'X-CSRFToken': csrfToken
        }
    });
    return response.data
}
