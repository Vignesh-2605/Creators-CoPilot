import os
import re
import base64
from typing import TypedDict, List, Optional
import uvicorn
from dotenv import load_dotenv
import torch
import soundfile as sf
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from transformers import AutoProcessor, BarkModel
import google.generativeai as genai

# --- 1. PROJECT SETUP & CONFIGURATION ---

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: Gemini API key not found. Script generation will fail.")

# --- 2. TTS MODEL LOADING & CONFIGURATION ---

processor = None
model = None

def load_tts_model():
    global processor, model
    print("Loading local TTS model (Suno's Bark)... This may take a few minutes.")
    model_id = "suno/bark"
    try:
        processor = AutoProcessor.from_pretrained(model_id)
        model = BarkModel.from_pretrained(model_id, torch_dtype=torch.float16)
        if torch.cuda.is_available():
            print("CUDA (GPU) detected. Moving model to GPU for faster performance.")
            model = model.to("cuda")
        else:
            print("No CUDA (GPU) detected. Model will run on CPU, which will be slow.")
        print("✅ TTS Model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load TTS model: {e}")

# --- 3. DATA MODELS FOR API REQUESTS ---

class ScriptRequest(BaseModel):
    source_type: str
    content: str

class AudioRequest(BaseModel):
    script: str

# --- 4. HELPER FUNCTIONS ---

def clean_script_for_tts(script: str) -> str:
    """
    Removes markdown, speaker notes, and other non-speech artifacts to prepare
    the script for the text-to-speech model.
    """
    print("Cleaning script for TTS...")
    # Remove markdown like **text** or *text*
    script = re.sub(r'\*\*(.*?)\*\*|\*(.*?)\*', r'\1\2', script)
    # Remove markdown headings like ## Title
    script = re.sub(r'#+\s.*', '', script)
    # Remove speaker notes in parentheses, e.g., (upbeat music)
    script = re.sub(r'\(.*?\)', '', script)
    # Remove labels like "Speaker:", "Intro:", "Outro:", etc.
    script = re.sub(r'^\w+:', '', script, flags=re.MULTILINE)
    # Replace multiple newlines with a single space
    script = re.sub(r'\n+', ' ', script)
    # Remove any remaining standalone asterisks or dashes
    script = script.replace('*', '').replace('-', '')
    # Trim whitespace from the start and end
    cleaned_script = script.strip()
    print("✅ Script cleaned.")
    return cleaned_script

def text_chunker_for_bark(text: str, max_chars=300): # Reduced max_chars for more stability
    """
    Splits text into smaller, sentence-aware chunks for the Bark model,
    enforcing a hard character limit to prevent model errors.
    """
    sentences = re.split(r'(?<=[.?!])\s+', text.replace("\n", " "))
    chunks, current_chunk = [], ""
    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 > max_chars:
            if current_chunk: chunks.append(current_chunk)
            current_chunk = sentence
        else:
            current_chunk += (" " + sentence) if current_chunk else sentence
    if current_chunk: chunks.append(current_chunk)
    
    final_chunks = []
    for chunk in chunks:
        if len(chunk) > max_chars:
            final_chunks.extend([chunk[i:i+max_chars] for i in range(0, len(chunk), max_chars)])
        else:
            final_chunks.append(chunk)
    return [c.strip() for c in final_chunks if c.strip()]

# --- 5. CORE AI LOGIC FUNCTIONS (Unchanged) ---
# ... (generate_script_from_topic, generate_script_from_github, etc. remain the same) ...
def generate_script_from_topic(topic: str) -> dict:
    print(f"Generating script for topic: {topic}")
    genai_model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = (
        f"Write a detailed YouTube video script for the topic: {topic}.\n\n"
        f"**IMPORTANT INSTRUCTION:** The script must be highly practical and application-focused. "
        f"Avoid theoretical explanations. Instead, focus on real-world examples, practical use cases, step-by-step walkthroughs, and how this topic is applied in the industry. "
        f"If the topic involves code, provide conceptual code snippets and explain them.\n\n"
        f"Script Requirements:\n"
        f"- Minimum 1500 words\n- Engaging intro hook\n- 4 to 5 sections focused on practical applications\n"
        f"- A summary + call to action outro\n- Conversational tone\n- Output only the script."
    )
    response = genai_model.generate_content(prompt)
    return {
        "script": response.text,
        "title": f"Practical Applications of {topic}",
        "description": f"A hands-on guide to {topic}, focusing on real-world applications.",
        "tags": [topic, "Practical", "HowTo", "Tutorial", "Technology"]
    }

def generate_script_from_github(github_url: str) -> dict:
    print(f"Generating script for GitHub URL: {github_url}")
    match = re.search(r"github\.com/([\w.-]+)/([\w.-]+)", github_url)
    if not match:
        raise ValueError("Invalid GitHub URL format.")
    owner, repo = match.groups()
    api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    readme_response = requests.get(api_url)
    readme_response.raise_for_status()
    readme_content = base64.b64decode(readme_response.json()['content']).decode('utf-8')
    genai_model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = (
        f"You are a tech presenter. Based on the following README for the '{repo}' project, create a practical, engaging YouTube script. "
        f"Cover what problem it solves, its main features, how to get started, and potential use cases. "
        f"Make it conversational for developers. Output only the script.\n\n--- README ---\n{readme_content}"
    )
    script_response = genai_model.generate_content(prompt)
    return {
        "script": script_response.text,
        "title": f"Project Spotlight: A Deep Dive into {repo}",
        "description": f"An exploration of the '{repo}' GitHub project. Learn what it does and how to use it.",
        "tags": [repo, "GitHub", "Open Source", "Programming", "Tutorial"]
    }

def process_user_script(raw_script: str) -> dict:
    print("Processing user-provided script.")
    return {
        "script": raw_script,
        "title": "User-Provided Script",
        "description": "Audio generated from a user-provided script.",
        "tags": ["custom script", "tts"]
    }

def generate_script_from_file(file_content: str) -> dict:
    print("Generating script from file content.")
    genai_model = genai.GenerativeModel('gemini-1.5-flash')
    is_code = any(kw in file_content for kw in ["def ", "function", "import", "class", "const"])
    if is_code:
        prompt = (
            "You are a coding instructor. Based on the provided code, generate a detailed, step-by-step YouTube tutorial script. "
            "Explain how to build the project, the logic of the code, how to run it, and deployment considerations. "
            "Make it clear and practical. Output only the script.\n\n--- CODE ---\n{file_content}"
        )
        title = "Step-by-Step Coding Tutorial"
    else:
        prompt = (
            "You are a presenter. Based on the provided text, create an engaging and explanatory YouTube script that "
            "summarizes and explains the key points. Output only the script.\n\n--- TEXT ---\n{file_content}"
        )
        title = "Content Explained"
    response = genai_model.generate_content(prompt)
    return {"script": response.text, "title": title}
    
# --- 6. FASTAPI APPLICATION SETUP & ENDPOINTS ---

app = FastAPI(title="AI YouTube Content Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup_event():
    load_tts_model()

@app.post("/generate-script", summary="Generate a YouTube script from various sources")
async def handle_script_generation(request: ScriptRequest):
    try:
        if request.source_type == "topic":
            result = generate_script_from_topic(request.content)
        elif request.source_type == "github":
            result = generate_script_from_github(request.content)
        elif request.source_type == "script":
            result = process_user_script(request.content)
        elif request.source_type == "file":
            result = generate_script_from_file(request.content)
        else:
            raise HTTPException(status_code=400, detail="Invalid source_type specified.")
        return result
    except Exception as e:
        print(f"Error in /generate-script: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-audio", summary="Generate audio from a provided script")
async def handle_audio_generation(request: AudioRequest):
    if not model or not processor:
        raise HTTPException(status_code=503, detail="TTS model is not available.")
    try:
        print("Starting audio generation...")
        # STEP 1: Clean the script to remove non-speech text
        cleaned_script = clean_script_for_tts(request.script)
        
        # STEP 2: Chunk the now-clean script
        script_chunks = text_chunker_for_bark(cleaned_script)
        
        if not script_chunks:
            raise HTTPException(status_code=400, detail="Script is empty after cleaning.")

        audio_pieces = []
        voice_preset = "v2/en_speaker_6"

        for i, chunk in enumerate(script_chunks):
            # Improved logging: shows the exact chunk being processed
            print(f"--> Generating audio for chunk {i+1}/{len(script_chunks)}: '{chunk[:80]}...'")
            
            inputs = processor(chunk, voice_preset=voice_preset, return_tensors="pt")
            inputs_on_device = {key: val.to(model.device) for key, val in inputs.items()}
            with torch.no_grad():
                speech_output = model.generate(**inputs_on_device, do_sample=True, fine_temperature=0.4, coarse_temperature=0.8, pad_token_id=processor.tokenizer.pad_token_id)
            audio_pieces.append(speech_output.cpu().numpy().squeeze())

        full_audio = np.concatenate(audio_pieces).astype(np.float32)
        output_path = "static/generated_audio.wav"
        sf.write(output_path, full_audio, model.generation_config.sample_rate)
        
        print(f"✅ Audio file saved to {output_path}")
        return {"audio_url": f"/{output_path}"}
        
    except Exception as e:
        print(f"Error in /generate-audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)