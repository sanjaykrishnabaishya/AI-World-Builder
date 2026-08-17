from fastapi import FastAPI

app = FastAPI(title="AI World Builder API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI World Builder API!"}
