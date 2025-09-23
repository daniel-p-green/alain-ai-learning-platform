# COOKBOOK

# dphn/dolphin-2.9.1-yi-1.5-34b Quickstart
## Quick Inference
1. Install dependencies
   ```bash
   pip install transformers
   ```
2. Run the model
   ```python
   from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
   model_id = "dphn/dolphin-2.9.1-yi-1.5-34b"
   tokenizer = AutoTokenizer.from_pretrained(model_id)
   model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
   inputs = tokenizer("Hello world", return_tensors="pt")
   outputs = model.generate(**inputs)
   print(tokenizer.decode(outputs[0], skip_special_tokens=True))
   ```
Licensed under Apache-2.0.