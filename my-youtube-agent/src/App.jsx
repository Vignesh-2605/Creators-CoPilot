import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Mic, Sparkles, ArrowUp, Upload } from 'lucide-react';
import './App.css'; // Import the new CSS file
import logo from './assets/logo.png'; // Import the logo

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
    <BubblingCursor />
    <div className="app-container">
      <div className="background-gradient">
          <div className="gradient-shape-1"></div>
          <div className="gradient-shape-2"></div>
      </div>
      
      <div className="main-content">
        <Navbar />
        <header className="app-header">
          <h1>
            Build great content with <span className="highlight-text">AI</span>.
          </h1>
          <p>
            Select a source, say what you want, and let AI do the magic. Generate scripts, metadata, and even voiceovers in minutes.
          </p>
        </header>

        <main>
            <div className="input-area-container">
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="main-textarea"
                    placeholder="Describe your app, topic, or paste a GitHub URL..."
                />
                <div className="input-controls">
                    <div className="icon-buttons">
                        <button onClick={() => fileInputRef.current.click()} className="icon-button">
                            <Upload size={20} />
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden-file-input"/>
                        </button>
                        <button className="icon-button">
                           <Sparkles size={20} />
                        </button>
                    </div>
                    <button 
                        onClick={handleSubmitFromText} 
                        disabled={isLoadingScript}
                        className="submit-button"
                    >
                       {isLoadingScript ? <div className="spinner"></div> : <ArrowUp size={20} />}
                    </button>
                </div>
            </div>

            <div className="example-prompts">
                <span>Get started with an example:</span>
                {examples.map(ex => (
                    <button 
                        key={ex} 
                        onClick={() => setUserInput(ex)}
                        className="example-button"
                    >
                        {ex.includes('github') ? 'GitHub Repo' : ex}
                    </button>
                ))}
            </div>

            {error && <div className="error-message">{error}</div>}

            {scriptData && (
                <div className="results-section">
                    <h2>✅ Content Ready</h2>
                    <div className="results-grid">
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
    <nav className="navbar">
        <div className="logo">
            <img src={logo} alt="App Logo" className="app-logo" />
            <span>Creator's Co-Pilot</span>
        </div>
        
        <div className="nav-actions">
            <button className="login-button">Login</button>
            <button className="cta-button">Get for Free</button>
        </div>
    </nav>
);

const ScriptDisplay = ({ script }) => (
    <div className="card">
        <h3><FileText size={20} /> Script</h3>
        <textarea
            readOnly
            value={script}
            className="display-textarea"
        />
        <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(script)}`} download="script.txt" className="download-link">
            <Download size={16} /> Download Script
        </a>
    </div>
);

const MetadataDisplay = ({ title, description, tags }) => (
    <div className="card">
        <h3>🎥 YouTube Metadata</h3>
        <div className="metadata-item">
            <h4>Title</h4>
            <div className="metadata-title-box">{title}</div>
        </div>
        <div className="metadata-item">
            <h4>Description</h4>
            <textarea
                readOnly
                value={description}
                className="display-textarea description-box"
            />
        </div>
        <div className="metadata-item">
            <h4>Tags</h4>
            <div className="tags-container">
                {(tags || []).map(tag => <span key={tag} className="tag-item">{tag}</span>)}
            </div>
        </div>
    </div>
);

const AudioGenerator = ({ onGenerate, isLoading, audioUrl }) => (
     <div className="audio-generator">
        <h2>Step 2: Generate Audio</h2>
        <button
            onClick={onGenerate}
            disabled={isLoading}
            className="generate-audio-button"
        >
            <Mic size={20} />
            {isLoading ? 'Generating Voice...' : 'Generate Audio from Script'}
        </button>
        
        {audioUrl && (
            <div className="audio-player-container">
                <h3>🔊 Audio Ready</h3>
                <audio controls src={audioUrl} className="audio-player">
                    Your browser does not support the audio element.
                </audio>
                <a href={audioUrl} download="generated_audio.wav" className="download-link">
                   <Download size={16} /> Download Audio
                </a>
            </div>
        )}
      </div>
);
