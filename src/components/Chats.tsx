import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Paperclip, CheckCheck, Circle, RefreshCw, Layers } from "lucide-react";
import { ChatThread, UserProfile } from "../types";
import { subscribeChats, subscribeMessages, sendChatMessageToDb } from "../firebaseService";

interface ChatsProps {
  userRef: UserProfile;
}

export default function Chats({ userRef }: ChatsProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeChats(userRef.id, (loadedThreads) => {
      setThreads(loadedThreads);
      setLoading(false);
      // If there's an active thread, make sure it stays updated in reference
      if (activeThread) {
        const u = loadedThreads.find(t => t.id === activeThread.id);
        if (u) setActiveThread(u);
      }
    });
    return () => unsubscribe();
  }, [userRef.id]);

  useEffect(() => {
    if (!activeThread) {
      setActiveMessages([]);
      return;
    }
    const unsubscribe = subscribeMessages(activeThread.id, (loadedMsgs) => {
      setActiveMessages(loadedMsgs);
    });
    return () => unsubscribe();
  }, [activeThread?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const handleSelectThread = (t: ChatThread) => {
    setActiveThread(t);
  };

  const handleSendMessage = async (e: React.FormEvent, customPayload?: { text?: string, fileUrl?: string, fileName?: string }) => {
    if (e) e.preventDefault();
    if (!activeThread) return;
    
    const textToSend = customPayload?.text || inputMessage;
    if (!textToSend && !customPayload?.fileUrl) return;

    setInputMessage("");

    try {
      await sendChatMessageToDb(activeThread.id, userRef, textToSend, customPayload?.fileUrl || "", customPayload?.fileName || "");
    } catch (err) {
      console.error("Message send transaction error", err);
    }
  };

  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      handleSendMessage(null as any, {
        text: `Shared file: ${file.name}`,
        fileUrl: "https://example.com/assets/mock_upload.pdf",
        fileName: file.name
      });
    }, 1200);
  };

  return (
    <div id="chats-root" className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      
      {/* Threads column */}
      <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden max-h-[75vh]">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-sans font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Active Peers
          </h3>
          <button className="p-1 bg-slate-900 text-slate-400 hover:text-white rounded transition">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto divide-y divide-slate-850">
          {threads.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs text-slate-450">No chat sessions currently open.</div>
          ) : (
            threads.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelectThread(t)}
                className={`w-full p-4 flex gap-3 text-left transition ${
                  activeThread?.id === t.id 
                    ? "bg-slate-850 text-white" 
                    : "hover:bg-slate-850 text-slate-350"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img src={t.participantAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-800" alt={t.participantName} />
                  {t.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-indigo-500 border-2 border-slate-900 rounded-full" />
                  )}
                </div>

                <div className="flex-grow space-y-1.5 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-xs text-white truncate max-w-[120px]">{t.participantName}</h4>
                    <span className="text-[9px] text-slate-500">{t.lastMessageAt}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono font-medium">{t.participantRole}</div>
                  <p className="text-[11px] text-slate-400 truncate leading-none">{t.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Messages column */}
      <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden max-h-[75vh]">
        {activeThread ? (
          <>
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <img src={activeThread.participantAvatar} className="w-8 h-8 rounded-full object-cover" alt={activeThread.participantName} />
                <div>
                  <h4 className="font-semibold text-white text-xs">{activeThread.participantName}</h4>
                  <p className="text-[9px] text-slate-400 font-medium tracking-wide">ROLE: {activeThread.participantRole}</p>
                </div>
              </div>

              <span className="text-[9.5px] uppercase font-mono tracking-widest text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 fill-current" />
                Active Peer Lock
              </span>
            </div>

            {/* Messages box */}
            <div className="p-5 overflow-y-auto flex-grow space-y-4 max-h-[50vh]">
              {activeMessages.map((msg, idx) => {
                const isMe = msg.senderId === userRef.id;
                return (
                  <div key={idx} className={`flex gap-2.5 max-w-[75%] ${isMe ? "ml-auto flex-row-reverse text-right" : "mr-auto text-left"}`}>
                    <img src={msg.senderAvatar} className="w-6 h-6 rounded-full object-cover flex-shrink-0" alt={msg.senderName} />
                    
                    <div className="space-y-1">
                      <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe 
                          ? "bg-indigo-600 border border-indigo-500 text-white rounded-tr-none" 
                          : "bg-slate-950 border border-slate-850 text-slate-200 rounded-tl-none"
                      }`}>
                        {msg.text}
                        
                        {msg.fileUrl && (
                          <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] gap-2">
                            <span className="truncate max-w-[150px] text-indigo-400 font-medium">📎 {msg.fileName}</span>
                            <a 
                              href={msg.fileUrl} 
                              onClick={(e) => { e.preventDefault(); alert("Mock download initiated for files inside the secure preview environment."); }}
                              className="text-[9px] text-emerald-400 uppercase font-mono hover:underline"
                            >
                              Download
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 flex items-center gap-1 justify-end">
                        <span>{msg.createdAt}</span>
                        {isMe && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Inputs Form */}
            <div className="p-4 bg-slate-950/70 border-t border-slate-800">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
                <label className="p-3 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-xl flex items-center justify-center cursor-pointer relative">
                  <Paperclip className={`w-4 h-4 ${uploading ? "animate-spin" : ""}`} />
                  <input 
                    type="file" 
                    onChange={handleFileUploadMock}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    disabled={uploading} 
                  />
                </label>

                <input
                  type="text"
                  placeholder={`Send private message to ${activeThread.participantName}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-grow bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition animate-none"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() && !uploading}
                  className={`px-4 py-2.5 rounded-xl flex items-center justify-center transition cursor-pointer ${
                    !inputMessage.trim() 
                      ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <MessageSquare className="w-12 h-12 text-slate-700" />
            <div className="space-y-1">
              <h4 className="font-semibold text-white">Project Discussions Area</h4>
              <p className="text-xs text-slate-500 max-w-sm">No chat thread selected. Double-click an active student peer on the left to review messages and coordinate transaction times.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
