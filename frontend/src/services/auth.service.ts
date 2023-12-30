import axios, {AxiosHeaders} from "axios";
import {API_BASE_URL} from "../config";

export const getCSRFToken = async (): Promise<string> => {
    const res = await axios.get(`${API_BASE_URL}/api/csrf`, {});
    const  headers = res.headers;
    if (headers instanceof AxiosHeaders && headers.has('X-CSRFToken')) {
        return headers.get('X-CSRFToken') as string;
    }
    throw new Error('no X-CSRFToken in header');
}

export const login = async (csrfToken: string, username: string, password: string): Promise<any> => {
    const res = await axios.post(`${API_BASE_URL}/api/login/`,
        { username, password },
        { headers: { 'X-CSRFToken': csrfToken} });
    return res.data;
}

export const logout = async (csrfToken: string) => {
     await axios.post(`${API_BASE_URL}/api/logout/`,
        {},
        { headers: { 'X-CSRFToken': csrfToken} });
}


export const getConnectionToken = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/token/connection/`, {})
    return response.data.token;
}

export const getSubscriptionToken = async (channel: string) => {
    const response = await axios.get(`${API_BASE_URL}/api/token/subscription/`, {
        params: { channel: channel }
    });
    return response.data.token;
}
