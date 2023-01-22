from transformers import AutoModelForSequenceClassification, AutoTokenizer
from transformers import pipeline
from logging import log
from typing import List
import torch


def get_prob(premise: str, hypothesis: str, nli_model: any, tokenizer: any):
    device = torch.device('cuda')
    x = tokenizer.encode(premise, hypothesis, return_tensors='pt',
                         truncation_strategy='only_first')
    logits = nli_model(x.to(device))[0]
    # we throw away "neutral" (dim 1) and take the probability of
    # "entailment" (2) as the probability of the label being true
    entail_contradiction_logits = logits[:, [0, 2]]
    probs = entail_contradiction_logits.softmax(dim=1)
    prob_label_is_true = probs[:, 1]
    return prob_label_is_true
    
    
def run_model(sentence: str, labels: List[str], multi_label: bool=True):
    device = torch.device('cuda')
    model_path = '/code/app/models/classification/bart-large-mnli/'
    tokenizer = AutoTokenizer.from_pretrained(
        model_path, local_files_only=True
    )
    model = AutoModelForSequenceClassification.from_pretrained(
        model_path, local_files_only=True
    )
    
    model.to(device)
    
    # classifier = pipeline('zero-shot-classification',
    #                       model=model, tokenizer=tokenizer, device=0)
    
    ## Alternative to above if not local files:
    # classifier = pipeline("zero-shot-classification",
    #                   model="facebook/bart-large-mnli")
    
    # run classifier on sentence
    # results = classifier(sentence, labels, multi_label=True)
    
    #Do it manually with pytorch for GPU use
    scores = []
    for label in labels:
        score = get_prob(sentence, label, model, tokenizer)
        scores.append(score)
    
    #{'labels': ['travel', 'exploration', 'dancing', 'cooking'],
    # 'scores': [0.9945111274719238,
    #  0.9383890628814697,
    #  0.0057061901316046715,
    #  0.0018193122232332826],
    # 'sequence': 'one day I will see the world'}
    
    results = {
        'labels': labels,
        'scores': scores,
        'sequence': sentence,
    }
    print(results, 'results from classifier')

    return results

def handler(sentence: str, labels: List[str], multi_label: bool=True):
    # validate input
    if (type(sentence) != str):
        log.error("sentence must be a string")
        return None
    if (type(labels) != list):
        log.error("labels must be a list")
        return None
    if (len(labels) == 0):
        log.error("No labels provided")
        return None
    results = run_model(sentence, labels, multi_label)
    return results
