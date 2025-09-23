# COOKBOOK

# bigscience/bloomz-560m Quickstart
## Quick Inference
1. Install dependencies
   ```bash
   pip install transformers
   ```
2. Run the model
   ```python
   from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
   model_id = "bigscience/bloomz-560m"
   tokenizer = AutoTokenizer.from_pretrained(model_id)
   model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
   inputs = tokenizer("Hello world", return_tensors="pt")
   outputs = model.generate(**inputs)
   print(tokenizer.decode(outputs[0], skip_special_tokens=True))
   ```
Licensed under bigscience-bloom-rail-1.0.