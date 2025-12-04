import React, { useState, useEffect, useRef } from 'react';
import { User, AuthState, Message } from './types';
import { generateVerificationText, personalizeMessage } from './services/geminiService';
import VoiceRecorder from './components/VoiceRecorder';
import { MicIcon, SendIcon, WandIcon, PhoneIcon, VideoIcon, MoreVerticalIcon } from './components/Icons';

// --- MOCK DATA FOR "BACKEND" ---
const MOCK_CONTACTS = [
  { id: '1', name: 'Gautham', status: 'Online', avatar: 'https://picsum.photos/id/1012/200/200', lastMsg: 'Protect the senator at all costs.', time: '5:00 PM' },
  { id: '2', name: 'Aachira', status: 'Last seen 10m ago', avatar: 'https://picsum.photos/id/1011/200/200', lastMsg: 'Voice call at 13:42', time: '1:42 PM' },
  { id: '3', name: 'Kuldeep', status: 'Typing...', avatar: 'https://picsum.photos/id/1005/200/200', lastMsg: 'Can we meet?', time: '3:12 PM' },
  { id: '4', name: 'Sebastian', status: 'Online', avatar: 'https://picsum.photos/id/1027/200/200', lastMsg: 'Where is the nearest place?', time: '3:10 PM' },
  { id: '5', name: 'Karuna', status: 'Busy', avatar: 'https://picsum.photos/id/338/200/200', lastMsg: 'Yes! I Agree 👍', time: '2:09 PM' },
];

const MOCK_MESSAGES: Message[] = [
  { id: 'm1', senderId: '1', text: 'Did you ever Hang pictures on your wall?', timestamp: Date.now() - 1000000 },
  { id: 'm2', senderId: 'me', text: 'For image backgrounds and having news on it... client wanted a full length pics.', timestamp: Date.now() - 500000 },
  { id: 'm3', senderId: '1', audioUrl: 'mock_audio', timestamp: Date.now() - 200000 },
];

// --- MAIN APP COMPONENT ---

const App = () => {
  // State for Navigation & Auth
  const [view, setView] = useState<'login' | 'signup' | 'verification' | 'dashboard'>('login');
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, currentUser: null });
  
  // State for Signup Flow
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [verificationText, setVerificationText] = useState<string>('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [recordedVoiceBlob, setRecordedVoiceBlob] = useState<Blob | null>(null);

  // State for Dashboard/Chat
  const [activeContactId, setActiveContactId] = useState<string>('1');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [personaliseMode, setPersonaliseMode] = useState(false);
  const [isPersonalizing, setIsPersonalizing] = useState(false);

  // --- HANDLERS ---

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate backend login
    setAuth({
      isAuthenticated: true,
      currentUser: { id: 'me', name: 'Demo User', email: 'demo@vocalix.com', avatarUrl: 'https://picsum.photos/id/64/200/200' }
    });
    setView('dashboard');
  };

  const handleSignupDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingText(true);
    setView('verification');
    
    // Call Gemini to get text
    const text = await generateVerificationText(signupData.name);
    setVerificationText(text);
    setIsGeneratingText(false);
  };

  const handleVerificationComplete = (blob: Blob) => {
    setRecordedVoiceBlob(blob);
  };

  const finishSignup = () => {
    if (!recordedVoiceBlob) {
      alert("Please record your voice verification first.");
      return;
    }
    
    // Create new user (Simulated Backend)
    const newUser: User = {
      id: 'me',
      name: signupData.name,
      email: signupData.email,
      avatarUrl: 'https://picsum.photos/id/64/200/200',
      voiceVerificationUrl: URL.createObjectURL(recordedVoiceBlob) // ephemeral URL for demo
    };
    
    setAuth({ isAuthenticated: true, currentUser: newUser });
    setView('dashboard');
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    let finalText = inputText;

    if (personaliseMode) {
      setIsPersonalizing(true);
      finalText = await personalizeMessage(inputText);
      setIsPersonalizing(false);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: finalText,
      timestamp: Date.now(),
      isPersonalized: personaliseMode
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleVoiceMessage = (blob: Blob) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      audioUrl: URL.createObjectURL(blob), // ephemeral URL for demo
      timestamp: Date.now()
    };
    setMessages([...messages, newMessage]);
  };

  const activeContact = MOCK_CONTACTS.find(c => c.id === activeContactId);

  // --- VIEWS ---

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <h1 className="text-3xl font-bold text-indigo-600 tracking-tight">Vocalix</h1>
          </div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">Welcome Back</h2>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              Sign In
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New to Vocalix?{' '}
              <button onClick={() => setView('signup')} className="font-medium text-indigo-600 hover:text-indigo-500">
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-indigo-600 mb-2">Vocalix</h1>
          <h2 className="text-xl font-semibold mb-6 text-gray-800 text-center">Create Account</h2>
          <form onSubmit={handleSignupDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                required 
                value={signupData.name}
                onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                required 
                value={signupData.email}
                onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input 
                type="password" 
                required 
                value={signupData.password}
                onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
              />
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              Next: Voice Verification
            </button>
          </form>
          <div className="mt-4 text-center">
             <button onClick={() => setView('login')} className="text-sm text-indigo-600 hover:text-indigo-500">
                Back to Login
              </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Identity Setup</h2>
          <p className="text-gray-500 mb-6">Read the text below to secure your account.</p>
          
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8 min-h-[120px] flex items-center justify-center">
            {isGeneratingText ? (
              <span className="text-indigo-400 animate-pulse">Generating your unique phrase...</span>
            ) : (
              <p className="text-lg text-indigo-900 font-serif italic leading-relaxed">
                "{verificationText}"
              </p>
            )}
          </div>

          <div className="flex justify-center mb-8">
            <VoiceRecorder onRecordingComplete={handleVerificationComplete} />
          </div>

          <button 
            onClick={finishSignup} 
            disabled={!recordedVoiceBlob}
            className={`w-full py-3 px-4 rounded-lg shadow-sm text-lg font-medium text-white transition-colors ${
              recordedVoiceBlob ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {recordedVoiceBlob ? 'Complete Signup' : 'Record to Continue'}
          </button>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  
  return (
    <div className="h-screen w-screen flex bg-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 flex items-center gap-2 border-b border-gray-100">
           <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
             V
           </div>
           <span className="font-bold text-xl text-gray-800 tracking-tight">Vocalix</span>
        </div>

        <div className="p-4">
          <input 
            type="text" 
            placeholder="Search (Ctrl + K)" 
            className="w-full bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {MOCK_CONTACTS.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveContactId(contact.id)}
              className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                activeContactId === contact.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                {contact.status === 'Online' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{contact.name}</h3>
                  <span className="text-xs text-gray-400">{contact.time}</span>
                </div>
                <p className={`text-xs truncate ${activeContactId === contact.id ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>
                  {contact.lastMsg}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
           <img src={auth.currentUser?.avatarUrl} alt="Me" className="w-9 h-9 rounded-full" />
           <div className="flex-1">
             <p className="text-sm font-semibold text-gray-800">{auth.currentUser?.name}</p>
             <p className="text-xs text-green-600 flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
             </p>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        {/* Chat Header */}
        {activeContact && (
          <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center gap-3">
               <img src={activeContact.avatar} alt="Current" className="w-10 h-10 rounded-full" />
               <div>
                 <h2 className="font-bold text-gray-800">{activeContact.name}</h2>
                 <p className="text-xs text-gray-500">{activeContact.status}</p>
               </div>
            </div>
            <div className="flex items-center gap-4 text-gray-400">
               <button className="hover:text-indigo-600 transition-colors"><PhoneIcon className="w-5 h-5" /></button>
               <button className="hover:text-indigo-600 transition-colors"><VideoIcon className="w-5 h-5" /></button>
               <div className="w-px h-6 bg-gray-200"></div>
               <button className="hover:text-gray-600"><MoreVerticalIcon className="w-5 h-5" /></button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {messages.map((msg) => {
             const isMe = msg.senderId === 'me';
             return (
               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
                   isMe 
                    ? 'bg-white border border-gray-100 text-gray-800 rounded-tr-none' 
                    : 'bg-indigo-600 text-white rounded-tl-none'
                 }`}>
                   {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                   {msg.audioUrl && (
                     <div className="flex items-center gap-2">
                        <button className={`p-2 rounded-full ${isMe ? 'bg-indigo-50 text-indigo-600' : 'bg-white/20 text-white'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                        <div className="h-1 bg-current opacity-20 w-32 rounded-full"></div>
                        <span className="text-xs opacity-70">0:05</span>
                     </div>
                   )}
                   <div className={`flex justify-end items-center gap-1 mt-1 ${isMe ? 'text-gray-400' : 'text-indigo-200'} text-[10px]`}>
                      {msg.isPersonalized && <WandIcon className="w-3 h-3" />}
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                 </div>
               </div>
             );
           })}
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 m-4 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-end gap-3">
             <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="w-full bg-transparent px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none max-h-32 scrollbar-hide"
                  rows={1}
                />
             </div>
             
             {/* Controls */}
             <div className="flex items-center gap-2 pb-1">
                {/* Personalize Toggle */}
                <div className="flex flex-col items-center group relative">
                  <button 
                    onClick={() => setPersonaliseMode(!personaliseMode)}
                    className={`p-2 rounded-full transition-all ${
                      personaliseMode 
                        ? 'bg-purple-100 text-purple-600 shadow-inner' 
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                  >
                    <WandIcon className="w-5 h-5" />
                  </button>
                  <span className="absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Personalise Mode {personaliseMode ? 'On' : 'Off'}
                  </span>
                </div>

                {/* Voice Record */}
                <VoiceRecorder onRecordingComplete={handleVoiceMessage} mode="small" />

                {/* Send Button */}
                <button 
                  onClick={handleSendMessage}
                  disabled={isPersonalizing || (!inputText && !personaliseMode)}
                  className={`p-3 rounded-full shadow-md transition-all ${
                     isPersonalizing 
                     ? 'bg-purple-500 cursor-wait'
                     : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                  } text-white`}
                >
                  {isPersonalizing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <SendIcon className="w-5 h-5" />
                  )}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
