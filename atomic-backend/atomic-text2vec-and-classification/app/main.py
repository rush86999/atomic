from typing import List, Union
from dotenv import load_dotenv
import os
import secrets
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

load_dotenv('./.env')

from inference.text2vec import handler as text2vec_handler
from inference.classification import handler as classification_handler
from inference.sentenceSimilarityDemo import handler as sentenceSimilarityDemo_handler
class Text2Vector(BaseModel):
    sentences: List[str]

class Classification(BaseModel):
    sentence: str
    labels: List[str]
    
class ClassificationResponse(BaseModel):
    labels: List[str]
    scores: List[float]
    sequence: str
    
# print(os.environ["vonage_api"])
#vonage_api=your_api inside .env
app = FastAPI()
security = HTTPBasic()


@app.get("/")
def read_root():
    return {"Hello": "World"}


# @app.get("/items/{item_id}")
# def read_item(item_id: int, q: Union[str, None] = None):
#     return {"item_id": item_id, "q": q}

def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(
        credentials.username, os.environ["username"])
    correct_password = secrets.compare_digest(
        credentials.password, os.environ["password"])
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.post("/classification", response_model=ClassificationResponse)
async def read_classification(classification: Classification, username: str = Depends(get_current_username)):
    # validate input
    print("username: ", username)
    sentence = classification.sentence
    labels = classification.labels
    if (sentence == None):
        raise HTTPException(status_code=400, detail="sentences not provided")
    
    if (type(sentence) != str):
        raise HTTPException(status_code=400, detail="sentence must be a string")
    
    if (type(labels) != list):
        raise HTTPException(status_code=400, detail="labels must be a list")
    
    if (len(labels) == 0):
        raise HTTPException(status_code=400, detail="No labels provided")
    
    return classification_handler(classification.sentence, classification.labels)

@app.post("/text2vector", response_model=List[float])
async def read_text2vector(text2vector: Text2Vector, username: str = Depends(get_current_username)):
    print("username: ", username)
    sentences = text2vector.sentences
    # validate input
    if (sentences == None):
        raise HTTPException(status_code=400, detail="sentences not provided")
    
    if (len(sentences) == 0):
        raise HTTPException(status_code=400, detail="sentences is empty")
    
    if (type(sentences) != list):
        raise HTTPException(status_code=404, detail="Sentences must be a list")
    
    embeddings = text2vec_handler(sentences)
    return embeddings

@app.post("/sentence-similarity-demo", response_model=List[float])
async def read_sentenceSimilarityDemo(text2vector: Text2Vector, username: str = Depends(get_current_username)):
    print("username: ", username)
    sentences = text2vector.sentences
    # validate input
    if (sentences == None):
        raise HTTPException(status_code=400, detail="sentences not provided")

    if (len(sentences) == 0):
        raise HTTPException(status_code=400, detail="sentences is empty")

    if (type(sentences) != list):
        raise HTTPException(status_code=404, detail="Sentences must be a list")

    cosine_similarities = sentenceSimilarityDemo_handler(sentences)
    return cosine_similarities

