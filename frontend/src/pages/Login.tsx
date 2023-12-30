import React, {useContext} from "react";
import CsrfContext from "../contexts/csrf.context.ts";
import {login} from "../services/auth.service.ts";
import logo from '../assets/centrifugo.svg';

interface LoginProps {
    onSuccess: (userInfo) => void
}

const Login: React.FC<LoginProps> = ({onSuccess}) => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const csrf = useContext(CsrfContext);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const res = await login(csrf, username, password);
            onSuccess(res.user);
        }
        catch (e) {
            console.log('Login Failed', e);
            // TODO: Handle Login Error
        }
        setLoading(false);
    }
    return (
        <form id='chat-login' onSubmit={async ( e) => {
            e.preventDefault();
            await handleLogin();
        }}>
            <div id='chat-login-logo-container'>
                <img
                    src={logo}
                    alt='GrandChat Logo'
                    width='100px'
                    height='100px'/>
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username" />
            </div>
            <div className="input-container">
                <input
                    type="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" autoComplete='curentPassword' />
            </div>
            <div className='login-button-container'>
                <button disabled={loading} className={`${(loading) ? 'loading' : ''}`}>Login</button>
            </div>
        </form>
    )
}

export default Login;
