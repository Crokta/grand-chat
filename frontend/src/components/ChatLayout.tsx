import React, {useContext} from "react";
import AuthContext from "../contexts/auth.context.ts";
import {NavLink} from "react-router-dom";

interface ChatLayoutProps {
    children: React.ReactNode
    realTimeStatus: string
    unrecoverableError: string
    onLogout: () => void
}

const ChatLayout: React.FC<ChatLayoutProps> = ({children, realTimeStatus, unrecoverableError, onLogout}) => {
    const userInfo = useContext(AuthContext);

    return (
        <div id='chat-layout'>
            <div id='chat-navbar'>
                <NavLink to={'/'} className={({isActive}) => isActive ? 'navbar-active-link' : ''}>My Rooms</NavLink>
                <NavLink to={'/search'} className={({isActive}) => isActive ? 'navbar-active-link' : ''}>Discover</NavLink>
                <span id='status' className={'status-' + realTimeStatus}>{realTimeStatus}</span>
                &nbsp;
                &nbsp;
                <span id='user'>{userInfo?.username}</span>
                &nbsp;
                <a href='#' id='logout-button' onClick={(e) => {e.preventDefault(); onLogout();}}>
                    Logout
                </a>
            </div>
            {
                unrecoverableError != '' ? (<div id='chat-state-lost'>{unrecoverableError}</div>) : (
                    <div id='chat-content'>{children}</div>
                )
            }
        </div>
    )
}


export default ChatLayout;
