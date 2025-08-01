from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import io
import re
import openai

# Configure the OpenAI client to connect to your local Ollama server
client = openai.OpenAI(
    base_url='http://localhost:11434/v1',
    api_key='ollama', # This can be any string, 'ollama' is common
)

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
    """
    Cleans and splits a block of text into a list of questions.
    """
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
    """Returns a success status message."""
    return {"status": "ok"}
    
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts a file, extracts text, normalizes it into questions,
    and returns the result as JSON.
    """
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

@app.post("/solve")
async def solve_questions(payload: dict):
    """
    Receives questions and sends the first one to the local Ollama model for an answer.
    """
    questions = payload.get("questions", [])
    if not questions:
        raise HTTPException(status_code=400, detail="No questions provided.")
    
    first_question = questions[0]
    
    try:
        completion = client.chat.completions.create(
            # IMPORTANT: Make sure this model name matches the one you downloaded with Ollama!
            model="gemma3:4b", 
            messages=[
                {"role": "system", "content": "You are a helpful assistant that provides correct, clear, and concise answers to exam questions."},
                {"role": "user", "content": first_question}
            ]
        )
        answer = completion.choices[0].message.content
        return {"question": first_question, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred with the local AI model: {str(e)}")