import {createContext} from "react";

const defaultUser = {
    username: 'Guest',
    id: 0
}

const AuthContext = createContext({...defaultUser});

export default AuthContext;
