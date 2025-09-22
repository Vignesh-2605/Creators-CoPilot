import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Mic, Sparkles, ArrowUp, Upload } from 'lucide-react';

// --- Custom Hook and Component for the Bubbling Cursor Effect ---
const BubblingCursor = () => {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const newBubble = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 20 + 10,
      };

      setBubbles((prevBubbles) => [...prevBubbles, newBubble]);

      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
      }, 1000); // Corresponds to animation duration
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
          }}
        />
      ))}
    </>
  );
};


// --- Main App Component ---
export default function App() {
  const [userInput, setUserInput] = useState('');
  const [scriptData, setScriptData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const handleGenerateScript = async (sourceType, content) => {
    setError(null);
    setScriptData(null);
    setAudioUrl(null);
    setIsLoadingScript(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/generate-script`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_type: sourceType, content }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Failed to generate script.');
        }
        const data = await response.json();
        setScriptData(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoadingScript(false);
    }
  };
  
  const handleSubmitFromText = () => {
    if (!userInput) {
        setError('Please provide input in the text area.');
        return;
    }
    let sourceType = 'topic';
    if (userInput.includes('github.com/')) {
        sourceType = 'github';
    } else if (userInput.split(/\s+/).length > 50) {
        sourceType = 'script';
    }
    handleGenerateScript(sourceType, userInput);
  };
  
  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
        setError('Please upload at least one file.');
        return;
    }
    const fileContentPromises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(`--- CONTENT FROM ${file.name} ---\n${e.target.result}`);
            reader.onerror = (err) => reject(err);
            reader.readAsText(file);
        });
    });
    const content = (await Promise.all(fileContentPromises)).join('\n\n');
    handleGenerateScript('file', content);
  };


  const handleGenerateAudio = async () => {
      if (!scriptData || !scriptData.script) {
          setError('No script available to generate audio from.');
          return;
      }
      setError(null);
      setAudioUrl(null);
      setIsLoadingAudio(true);

      try {
        const response = await fetch(`${API_BASE_URL}/generate-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script: scriptData.script }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Failed to generate audio.');
        }
        const data = await response.json();
        setAudioUrl(`${API_BASE_URL}${data.audio_url}`);
    } catch (err) {
        setError(err.message);
    } finally {
        setIsLoadingAudio(false);
    }
  };

  const examples = [
    "Pomodoro Timer App Explained",
    "How to build a SaaS landing page",
    "Practical applications of LangGraph",
    "https://github.com/google/generative-ai-docs"
  ];

  return (
    <>
    <style>{`
        @keyframes bubble {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .bubble {
          position: fixed;
          background: radial-gradient(circle, rgba(128, 90, 213, 0.5) 0%, rgba(128, 90, 213, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: bubble 1s ease-out forwards;
          transform-origin: center;
          z-index: 9999;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
    `}</style>
    <BubblingCursor />
    <div className="bg-[#F7F8FC] min-h-screen text-[#3D3D3D] font-sans p-4 sm:p-6 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-200/50 rounded-full filter blur-3xl opacity-50 animate-pulse-slow"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-200/50 rounded-full filter blur-3xl opacity-40 animate-pulse-slow animation-delay-2000"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <Navbar />
        <header className="text-center my-16 sm:my-24">
          <h1 className="text-4xl sm:text-6xl font-bold text-[#1a1a1a] tracking-tight">
            Build great content with <span className="text-blue-600">AI</span>.
          </h1>
          <p className="text-gray-500 mt-6 text-lg max-w-2xl mx-auto">
            Select a source, say what you want, and let AI do the magic. Generate scripts, metadata, and even voiceovers in seconds.
          </p>
        </header>

        <main>
            <div className="relative bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200/80">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full h-32 p-4 bg-transparent rounded-lg focus:outline-none resize-none text-lg placeholder-gray-400"
                    placeholder="Describe your app, topic, or paste a GitHub URL..."
                />
                <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                            <Upload size={20} />
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden"/>
                        </button>
                        <button className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                           <Sparkles size={20} />
                        </button>
                    </div>
                    <button 
                        onClick={handleSubmitFromText} 
                        disabled={isLoadingScript}
                        className="bg-gray-800 text-white rounded-full p-3 hover:bg-gray-900 transform hover:scale-105 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                       {isLoadingScript ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <ArrowUp size={20} />}
                    </button>
                </div>
            </div>

            <div className="text-center mt-6 flex flex-wrap justify-center items-center gap-3">
                <span className="text-gray-500 text-sm">Get started with an example:</span>
                {examples.map(ex => (
                    <button 
                        key={ex} 
                        onClick={() => setUserInput(ex)}
                        className="px-4 py-1.5 bg-white/80 border border-gray-200 rounded-full text-sm hover:border-gray-400 transition-colors"
                    >
                        {ex.includes('github') ? 'GitHub Repo' : ex}
                    </button>
                ))}
            </div>

            {error && <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg my-8">{error}</div>}

            {scriptData && (
                <div className="mt-16 animate-fade-in">
                    <h2 className="text-3xl font-bold mb-8 text-center">✅ Content Ready</h2>
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <ScriptDisplay script={scriptData.script} />
                        <MetadataDisplay title={scriptData.title} description={scriptData.description} tags={scriptData.tags} />
                    </div>
                    <AudioGenerator onGenerate={handleGenerateAudio} isLoading={isLoadingAudio} audioUrl={audioUrl} />
                </div>
            )}
        </main>
      </div>
    </div>
    </>
  );
}

// --- Helper UI Components ---

const Navbar = () => (
    <nav className="flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-lg">
                <FileText size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl">ContentAgent</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-gray-600">
            <a href="#" className="hover:text-black">Overview</a>
            <a href="#" className="hover:text-black">Features</a>
            <a href="#" className="hover:text-black">Community</a>
        </div>
        <div>
            <button className="hidden md:inline-block mr-4 text-gray-600 hover:text-black">Login</button>
            <button className="bg-blue-500 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-600 transition-colors">Get for Free</button>
        </div>
    </nav>
);

const ScriptDisplay = ({ script }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 p-4 rounded-lg flex flex-col">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><FileText size={20} /> Script</h3>
        <textarea
            readOnly
            value={script}
            className="w-full flex-grow p-2 bg-white rounded-md border border-gray-200 resize-none mt-2 h-96"
        />
        <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(script)}`} download="script.txt" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            <Download size={16} className="inline-block mr-2" /> Download Script
        </a>
    </div>
);

const MetadataDisplay = ({ title, description, tags }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 p-4 rounded-lg flex flex-col gap-4">
        <h3 className="text-xl font-bold mb-2">🎥 YouTube Metadata</h3>
        <div>
            <h4 className="font-semibold text-gray-500">Title</h4>
            <div className="p-3 bg-gray-100/80 rounded-md mt-1 font-mono text-sm">{title}</div>
        </div>
        <div>
            <h4 className="font-semibold text-gray-500">Description</h4>
            <textarea
                readOnly
                value={description}
                className="w-full h-32 p-2 bg-gray-100/80 rounded-md mt-1 border border-gray-200/80 resize-none text-sm"
            />
        </div>
        <div>
            <h4 className="font-semibold text-gray-500">Tags</h4>
            <div className="p-3 bg-gray-100/80 rounded-md mt-1 flex flex-wrap gap-2">
                {(tags || []).map(tag => <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">{tag}</span>)}
            </div>
        </div>
    </div>
);

const AudioGenerator = ({ onGenerate, isLoading, audioUrl }) => (
     <div className="mt-8 pt-8 border-t border-gray-200 text-center">
        <h2 className="text-3xl font-bold mb-4">Step 2: Generate Audio</h2>
        <button
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full max-w-md mx-auto bg-gray-800 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            <Mic size={20} />
            {isLoading ? 'Generating Voice...' : 'Generate Audio from Script'}
        </button>
        
        {audioUrl && (
            <div className="mt-6 p-4 bg-white/80 border border-gray-200/80 rounded-lg max-w-md mx-auto animate-fade-in">
                <h3 className="font-semibold mb-2">🔊 Audio Ready</h3>
                <audio controls src={audioUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
                <a href={audioUrl} download="generated_audio.wav" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                   <Download size={16} className="inline-block mr-2" /> Download Audio
                </a>
            </div>
        )}
      </div>
);

