#🎬 Creator's Co-Pilot
An AI-powered agent that automates the YouTube content creation workflow, from script generation to final voiceover.

Creator's Co-Pilot is an advanced, AI-powered web application designed to automate and accelerate the YouTube video production workflow. It transforms a simple idea into a complete content package—including a script, metadata, and voiceover—in minutes.

This project uses a full-stack architecture with a React frontend and a Python (FastAPI) backend, leveraging powerful AI models like Google's Gemini for text generation and Suno's Bark for high-quality, local Text-to-Speech (TTS).

##🌟 Project Philosophy
The goal of Creator's Co-Pilot is to empower content creators by handling the most time-consuming parts of video production. By automating scriptwriting, metadata generation, and voiceovers, creators can focus on what they do best: creating engaging and impactful content. This tool is built to be a true "co-pilot," assisting at every step of the creative process.

##✨ Core Features
Multi-Source Content Generation: Create scripts from various inputs:

###📝 Topic: Generate a detailed, practical script from a single topic.

###🐙 GitHub Repository: Analyze a public repo's README to create a project spotlight video.

###📄 File Upload: Upload code, text files, or documents to generate a step-by-step tutorial or an explanatory video.

###✍️ Your Own Script: Provide your own script to be used directly for audio generation.

###🤖 Automated Metadata: Automatically generates a relevant YouTube title, description, and tags for every script.

###🎤 High-Quality Local TTS: Uses the Suno Bark model to generate natural-sounding voiceovers locally, ensuring stability and removing reliance on external APIs.

###💬 Modern Chat-Based UI: A sleek, conversational interface built with React makes the content creation process intuitive and engaging.

###📊 Interactive Progress: A custom circular progress bar provides real-time feedback during the audio generation process.

##🛠️ Technical Architecture & Deep Dive
The project is built with a modern, decoupled architecture for scalability and maintainability.

###Backend
Framework: FastAPI
Chosen for its high performance, asynchronous capabilities, and automatic API documentation, making it ideal for a responsive, AI-driven backend.

AI Workflow Orchestration: LangGraph
Manages the complex flows of AI logic. It provides a robust, stateful, and modular way to define the different generation agents (topic, GitHub, file), making the system easy to debug and extend.

###Models:

Google Gemini 1.5 Flash (Text): Used for all script and metadata creation. Selected for its excellent balance of speed, context understanding, and high-quality, practical text output.

Suno Bark (Audio): A powerful local TTS model. Chosen after extensive testing to ensure a stable, reliable, and free audio generation process, removing dependencies on external APIs that proved to be unreliable.

###Frontend
Framework: React
Chosen for its component-based architecture, which is perfect for building the dynamic and interactive chat interface.

Styling: Standard CSS with Theming
Uses a themeable, dark-mode-first design with CSS variables, allowing for easy customization and a polished user experience.

###🚀 Getting Started
To run this project locally, you will need to set up both the backend and the frontend in two separate terminals.

Prerequisites
Python 3.9+
Node.js and npm

1. Backend Setup
Clone the repository:
```
git clone [https://github.com/your-username/creators-co-pilot.git](https://github.com/your-username/creators-co-pilot.git)
cd creators-co-pilot
```
Install Python dependencies:
```
pip install -r requirements.txt
```
Set up your API keys:

Create a file named .env in the backend directory.

Add your Google Gemini API key to this file:
```
GEMINI_API_KEY="your_gemini_api_key_here"
```
Run the backend server:

The first time you run the server, it will download the Bark TTS model (over 1GB), which may take several minutes.
```
uvicorn backend_api:app --reload
```
The backend will now be running at http://127.0.0.1:8000.

2. Frontend Setup
Navigate to the frontend directory:
```
cd ../my-youtube-agent
```
Install npm packages:
```
npm install
```
Run the React application:
```
npm run dev
```
