"use client"

import {useEffect, useState} from "react";
import {clearCurrentClient, listCaches} from "@/utils/momento-web";
import ChatRoom from "@/app/pages/chat-room";


export default function Home() {
    const [topic, setTopic] = useState("");
    const [cacheName, setCacheName] = useState("");
    const [username, setUsername] = useState("");
    const [caches, setCaches] = useState<string[]>([]);
    const [chatRoomSelected, setChatRoomSelected] = useState(false);
    const [usernameSelected, setUsernameSelected] = useState(false);

    useEffect(() =>{
        listCaches().then((c) => setCaches(c))
    }, [])

    const leaveChatRoom = () => {
        clearCurrentClient();
        setChatRoomSelected(false);
        setUsernameSelected(false);
        setCacheName("");
        setTopic("");
        setUsername("");
    }

    if (!chatRoomSelected || !cacheName) {
        return (
            <div className={'flex h-full justify-center items-center flex-col bg-slate-300'}>
                <div className={'w-48'}>
                    <label htmlFor={'caches-list'} className={'block mb-2 text-sm font-medium text-gray-900'}>Select a cache
                        to use</label>
                    <select
                        className="py-3 px-4 pr-9 block w-full border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500"
                        value={cacheName}
                        onChange={(e) => setCacheName(e.target.value)}
                        id={'caches-list'}
                    >
                        <option key={'none'} />
                        {caches.map(cache => {
                            return (
                                <option key={cache}>{cache}</option>
                            )
                        })}
                    </select>
                </div>
                <div className={'h-8'}/>
                <div className={'w-48'}>
                    <input className={'rounded-2xl w-full p-2'} placeholder={"chat room"} value={topic} onChange={(e) => setTopic(e.target.value)}/>
                </div>
                <div className={'h-8'}/>
                <div className={'w-48'}>
                    <button onClick={() => setChatRoomSelected(true)} disabled={!topic || !cacheName} className={'disabled:bg-slate-50 disabled:brightness-75 disabled:cursor-default rounded-2xl hover:cursor-pointer w-full bg-emerald-400 p-2 hover:brightness-75'}>Enter</button>
                </div>

            </div>
        )
    }

    if (!usernameSelected) {
        return (
            <div className={'flex h-full justify-center items-center flex-col bg-slate-300'}>
                <div className={'w-72 text-center'}>
                    <div>Welcome to the <span className={'italic'}>{topic}</span> chat room!</div>
                </div>
                <div className={'h-4'}/>
                <div className={'flex w-72 justify-center'}>
                    <input className={'rounded-2xl p-2 w-60 items-center'} value={username} onChange={(e) => setUsername(e.target.value)} placeholder={'username'}/>
                </div>
                <div className={'h-4'}/>
                <div className={'w-72 flex justify-center'}>
                    <button onClick={() => setUsernameSelected(true)} disabled={!username} className={'disabled:bg-slate-50 disabled:brightness-75 disabled:cursor-default rounded-2xl hover:cursor-pointer w-24 bg-emerald-400 p-2 hover:brightness-75'}>Enter</button>
                </div>
            </div>
        )
    }


  return (
      <ChatRoom topicName={topic} cacheName={cacheName} username={username} onLeave={leaveChatRoom} />
  )

}
