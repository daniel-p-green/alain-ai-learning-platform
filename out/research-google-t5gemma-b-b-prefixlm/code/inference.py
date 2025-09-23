from transformers import AutoModelForCausalLM, AutoTokenizer
import os
model_id=os.getenv('MODEL_ID','google/t5gemma-b-b-prefixlm')
 tok=AutoTokenizer.from_pretrained(model_id)
 mdl=AutoModelForCausalLM.from_pretrained(model_id,device_map='auto')
 print('Loaded', model_id)