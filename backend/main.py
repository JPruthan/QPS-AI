from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add this section to allow requests from your frontend
origins = [
    "http://localhost:5173",  # The default port for Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# End of new section

@app.get("/health")
def read_health():
    """Returns a success status message."""
    return {"status": "ok"}