from transformers import AutoModelForCausalLM, AutoTokenizer
import os
model_id=os.getenv('MODEL_ID','dphn/dolphin-2.9.1-yi-1.5-34b')
 tok=AutoTokenizer.from_pretrained(model_id)
 mdl=AutoModelForCausalLM.from_pretrained(model_id,device_map='auto')
 print('Loaded', model_id)