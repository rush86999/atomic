from logging import log
from typing import List

import torch
from transformers import AutoTokenizer, AutoModel


# Mean Pooling - Take attention mask into account for correct averaging
def mean_pooling(model_output, attention_mask):
    # First element of model_output contains all token embeddings
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(
        -1).expand(token_embeddings.size()).float()
    return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)


def run_model(sentences):
    # Sentences we want sentence embeddings for
    model_path = '/code/app/models/text2vec/all-MiniLM-L6-v2/'
    # load model
    tokenizer = AutoTokenizer.from_pretrained(
        model_path, local_files_only=True
    )
    
    model = AutoModel.from_pretrained(
        model_path, local_files_only=True
    )
    # tokenizer = AutoTokenizer.from_pretrained(
        # 'sentence-transformers/all-MiniLM-L6-v2')
    # model = AutoModel.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')
    
    # Tokenize sentences
    encoded_input = tokenizer(sentences, padding=True,
                              truncation=True, return_tensors='pt')

    # Compute token embeddings
    with torch.no_grad():
        model_output = model(**encoded_input)

    # Perform pooling. In this case, max pooling.
    sentence_embeddings = mean_pooling(
        model_output, encoded_input['attention_mask'])
    return sentence_embeddings.tolist()[0]

def handler(sentences: List[str]):
    # validate
    if (type(sentences) != list):
        log.error("sentences must be a list")
        return None
    if (len(sentences) == 0):
        log.error("sentences is empty")
        return None
    if (sentences == None):
        log.error("sentences not provided")
        return None
    embeddings = run_model(sentences)
    
    return embeddings