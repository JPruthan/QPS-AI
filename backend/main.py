from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import io
import re
import os
from dotenv import load_dotenv
import google.generativeai as genai # Import Google's library

# Load environment variables from .env file
load_dotenv()

# --- NEW: Configure the Google Gemini API ---
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("Google API key not found. Make sure it's set in your .env file.")
genai.configure(api_key=api_key)
# --- END NEW ---


app = FastAPI()

# Origins for CORS middleware
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def normalize_text_to_questions(text: str) -> list[str]:
    # ... (this function remains the same)
    question_start_pattern = r'\n\s*(?:\d+\.|\([a-z]\)|\b[a-z]\.)'
    match = re.search(question_start_pattern, text)
    if match:
        text = text[match.start():]
    end_index = text.find("Question Paper Ends")
    if end_index != -1:
        text = text[:end_index]
    pattern = r'(?=\n\s*(?:\d+\.|\([a-z]\)|\b[a-z]\.|\(OR\)))'
    questions = re.split(pattern, text)
    cleaned_questions = [q.strip() for q in questions if len(q.strip()) > 10]
    return cleaned_questions

@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # ... (this function remains the same)
    contents = await file.read()
    extracted_text = ""
    try:
        if file.content_type == "application/pdf":
            pdf_document = fitz.open(stream=io.BytesIO(contents))
            for page in pdf_document:
                extracted_text += f"\n{page.get_text()}"
            pdf_document.close()
        elif file.content_type in ["image/jpeg", "image/png"]:
            image = Image.open(io.BytesIO(contents))
            extracted_text = pytesseract.image_to_string(image)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        if not extracted_text.strip():
             raise HTTPException(status_code=400, detail="No text could be extracted.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during processing: {str(e)}")
    question_list = normalize_text_to_questions(extracted_text)
    return {"filename": file.filename, "questions": question_list}

# --- UPDATED /solve endpoint to use Gemini ---
@app.post("/solve")
async def solve_questions(payload: dict):
    questions = payload.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="No questions provided.")
    
    question_to_solve = questions[0]
    
    prompt = f"""
    You are an expert academic assistant. Provide a clear, correct, and detailed answer for the following exam question.
    Explain your reasoning where appropriate.

    Question: "{question_to_solve}"

    Answer:
    """
    
    try:
        # Initialize the Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash-latest') # Using the fast and powerful Flash model
        
        # Generate the answer
        response = model.generate_content(prompt)
        
        return {"question": question_to_solve, "answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred with the Google Gemini API: {str(e)}")