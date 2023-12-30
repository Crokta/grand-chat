import React, { useState, useEffect, useReducer } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import {
    Centrifuge, PublicationContext, SubscriptionStateContext,
    SubscribedContext, SubscriptionState
} from 'centrifuge';
import {LOCAL_STORAGE_AUTH_KEY, WS_BASE_URL} from "./config";
import {getConnectionToken, getCSRFToken, getSubscriptionToken, logout} from "./services/auth.service.ts";
import {addMessage, getMessages} from "./services/chat.service.ts";
import {getRoom, getRooms} from "./services/rooms.service.ts";
import CsrfContext from './contexts/csrf.context.ts';
import AuthContext from './contexts/auth.context.ts';
import ChatContext from './contexts/chat.context.ts';
import ChatLayout from "./components/ChatLayout.tsx";
import ChatRoomList from "./pages/ChatRoomList.tsx";
import ChatSearch from "./pages/ChatSearch.tsx";
import ChatRoomDetail from "./pages/ChatRoomDetail.tsx";
import Login from "./pages/Login.tsx";
import {chatReducer, initialChatState} from "./reducers/chat.reducers.ts";



const App: React.FC = () => {
    let localAuth: any = {};
    if (localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)) {
        localAuth = JSON.parse(localStorage.getItem(LOCAL_STORAGE_AUTH_KEY)!)
    }
    const [authenticated, setAuthenticated] = useState<boolean>(localAuth.id !== undefined)
    const [userInfo, setUserInfo] = useState<any>(localAuth)
    const [csrf, setCSRF] = useState('')
    const [unrecoverableError, setUnrecoverableError] = useState('')
    const [chatState, dispatch] = useReducer(chatReducer, initialChatState);
    const [realTimeStatus, setRealTimeStatus] = useState('🔴')
    const [messageQueue, setMessageQueue] = useState<any[]>([]);

    useEffect(() => {
        if (messageQueue.length === 0) {
            return; // Return if no messages to process.
        }

        const processUserJoined = async (body: any) => {
            const roomId = body.room.id
            const roomVersion = body.room.version
            let room = chatState.roomsById[roomId]
            if (!room) {
                room = await fetchRoom(roomId)
                if (room === null) {
                    return
                }
                dispatch({
                    type: "ADD_ROOMS", payload: {
                        rooms: [room]
                    }
                })
            } else {
                dispatch({
                    type: "SET_ROOM_MEMBER_COUNT", payload: {
                        roomId: roomId,
                        version: roomVersion,
                        memberCount: body.room.member_count
                    }
                })
            }
        }

        const processUserLeft = async (body: any) => {
            const roomId = body.room.id
            const roomVersion = body.room.version
            const leftUserId = body.user.id
            let room = chatState.roomsById[roomId]
            if (room) {
                if (room.version >= roomVersion) {
                    console.error(`Outdated version for room ID ${roomId}.`);
                    return
                }
                if (userInfo.id == leftUserId) {
                    dispatch({
                        type: "DELETE_ROOM", payload: {
                            roomId: roomId
                        }
                    })
                } else {
                    dispatch({
                        type: "SET_ROOM_MEMBER_COUNT", payload: {
                            roomId: roomId,
                            version: roomVersion,
                            memberCount: body.room.member_count
                        }
                    })
                }
            } else if (userInfo.id != leftUserId) {
                room = await fetchRoom(roomId)
                dispatch({
                    type: "ADD_ROOMS", payload: {
                        rooms: [room]
                    }
                })
            }
        }

        const processMessageAdded = async (body: any) => {
            const roomId = body.room.id
            const newMessage = body

            let room = chatState.roomsById[roomId]
            if (!room) {
                room = await fetchRoom(roomId)
                dispatch({
                    type: "ADD_ROOMS", payload: {
                        rooms: [room]
                    }
                })
            }

            const messages = chatState.messagesByRoomId[roomId]
            if (!messages) {
                const messages = await fetchMessages(roomId)
                dispatch({
                    type: "ADD_MESSAGES", payload: {
                        roomId: roomId,
                        messages: messages
                    }
                })
                return;
            }

            dispatch({
                type: "ADD_MESSAGES", payload: {
                    roomId: roomId,
                    messages: [newMessage]
                }
            })
        }

        const processMessage = async () => {
            const message = messageQueue[0];

            const { type, body } = message
            switch (type) {
                case 'message_added': {
                    await processMessageAdded(body);
                    break
                }
                case 'user_joined': {
                    await processUserJoined(body);
                    break
                }
                case 'user_left': {
                    await processUserLeft(body);
                    break
                }
                default:
                    console.log('unsupported message type', type, body)
            }

            // Remove the processed message from the queue
            setMessageQueue(prevQueue => prevQueue.slice(1));
        };

        processMessage();
    }, [messageQueue, chatState]);

    const onPublication = (publication: any) => {
        console.log(publication)
        setMessageQueue(prevQueue => [...prevQueue, publication]);
    };

    useEffect(() => {
        if (!userInfo.id) {
            return;
        }

        let centrifuge: Centrifuge | null = null;

        const init = async () => {
            const rooms = await fetchRooms();
            dispatch({
                type: 'ADD_ROOMS', payload: {
                    'rooms': rooms
                }
            })

            const personalChannel = 'personal:' + userInfo.id

            const getPersonalChannelSubscriptionToken = async () => {
                return getSubscriptionToken(personalChannel)
            }

            console.log("new Centrifuge")
            centrifuge = new Centrifuge(WS_BASE_URL, {
                getToken: getConnectionToken,
                debug: true
            })

            const sub = centrifuge.newSubscription(personalChannel, {
                getToken: getPersonalChannelSubscriptionToken
            })
            sub.on('publication', (ctx: PublicationContext) => {
                onPublication(ctx.data)
            }).on('subscribed', (ctx: SubscribedContext) => {
                if (ctx.wasRecovering && !ctx.recovered) {
                    setUnrecoverableError('State LOST - please reload the page')
                }
            })

            sub.on('state', (ctx: SubscriptionStateContext) => {
                if (ctx.newState == SubscriptionState.Subscribed) {
                    setRealTimeStatus('🟢')
                } else {
                    setRealTimeStatus('🔴')
                }
            })

            sub.subscribe()
            centrifuge.connect()
        }

        // As soon as we get authenticated user – init our app.
        init()

        return () => {
            if (centrifuge) {
                console.log("disconnect Centrifuge")
                centrifuge.disconnect()
            }
        }
    }, [userInfo])

    useEffect(() => {
        const fetchCSRF = async () => {
            const token = await getCSRFToken()
            setCSRF(token)
        }
        fetchCSRF();
    }, []);

    const publishMessage = async (roomId: string, content: string) => {
        try {
            const message = await addMessage(csrf, roomId, content)
            return message
        } catch (err) {
            if (axios.isAxiosError(err) && err.response && err.response.status == 403) {
                onLoggedOut()
                return {}
            }
            setUnrecoverableError('Unhandled error - please reload a page')
            return {};
        }
    }

    const fetchMessages = async (roomId: string): Promise<any> => {
        try {
            const messages = await getMessages(roomId)
            // Note, need to reverse since we display old on top, newer on the bottom.
            return messages.reverse()
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status == 403) {
                    onLoggedOut()
                    return null;
                } else if (err.response.status == 404) {
                    return null;
                }
            }
            setUnrecoverableError('Unhandled error - please reload a page')
            return null;
        }
    };

    const fetchRoom = async (roomId: string): Promise<any> => {
        try {
            const room = await getRoom(roomId)
            return room
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status == 403) {
                    onLoggedOut()
                    return null;
                } else if (err.response.status == 404) {
                    return null;
                }
            }
            setUnrecoverableError('Unhandled error - please reload a page')
            return null;
        }
    };

    const fetchRooms = async (): Promise<any> => {
        try {
            const rooms = await getRooms()
            return rooms
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status == 403) {
                    onLoggedOut()
                    return null;
                } else if (err.response.status == 404) {
                    return null;
                }
            }
            setUnrecoverableError('Unhandled error - please reload a page')
            return null;
        }
    };

    const onLoginSuccess = async function (userInfo: any) {
        setAuthenticated(true);
        setUserInfo(userInfo);
        localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(userInfo));
        const token = await getCSRFToken()
        setCSRF(token)
    }

    const onLoggedOut = () => {
        setAuthenticated(false)
        setUnrecoverableError('')
        setUserInfo({});
        dispatch({
            type: "CLEAR_CHAT_STATE", payload: {}
        })
        localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
    }

    const onLogout = async function () {
        try {
            await logout(csrf)
            onLoggedOut()
            const token = await getCSRFToken()
            setCSRF(token)
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status == 403) {
                    onLoggedOut()
                    return
                }
            }
            setUnrecoverableError('Unhandled error - please reload a page')
        }
    }

    return (
        <CsrfContext.Provider value={csrf}>
            <AuthContext.Provider value={userInfo}>
                {authenticated ? (
                    <ChatContext.Provider value={{ state: chatState, dispatch }}>
                        <Router>
                            <ChatLayout
                                realTimeStatus={realTimeStatus}
                                unrecoverableError={unrecoverableError}
                                onLogout={onLogout}
                            >
                                <Routes>
                                    <Route path="/" element={<ChatRoomList />} />
                                    <Route path="/search" element={<ChatSearch fetchRoom={fetchRoom} />} />
                                    <Route path="/rooms/:id" element={
                                        <ChatRoomDetail
                                            fetchRoom={fetchRoom}
                                            fetchMessages={fetchMessages}
                                            publishMessage={publishMessage}
                                        />
                                    } />
                                </Routes>
                            </ChatLayout>
                        </Router>
                    </ChatContext.Provider>
                ) : (
                    <Login onSuccess={onLoginSuccess} />
                )}
            </AuthContext.Provider>
        </CsrfContext.Provider>
    );
};

export default App;
