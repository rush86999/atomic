# Atomic Text2Vec and Classification API 

Atomic Text2Vec and Classification API runs two separate AI models behind a FastAPI server

## Instructions
1. Download [`bart-large-mnli`](https://huggingface.co/facebook/bart-large-mnli) & [`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/main/1_Pooling) from HuggingFace
2. Place `bart-large-mnli` under `app/models/classfication` folder
3. Place `all-MiniLM-L6-v2` under `app/models/text2vec` folder
4. Place the files in `root-files` directory in the root of the directory
5. Build the Docker image using `docker build <path>` command with the provided Dockerfile
6. Upload docker to your own cloud and add the necessary environment variables for auth
    - add you custom username and password