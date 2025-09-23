# COOKBOOK

# google/mt5-small Quickstart
## Quick Inference
1. Install dependencies
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install "transformers>=4.40" sentencepiece accelerate
   ```
2. Generate text
   ```python
   from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
   model_id = "google/mt5-small"
   tokenizer = AutoTokenizer.from_pretrained(model_id)
   model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
   prompt = "translate English to German: How are you?"
   inputs = tokenizer(prompt, return_tensors="pt")
   outputs = model.generate(**inputs, max_new_tokens=64)
   print(tokenizer.decode(outputs[0], skip_special_tokens=True))
   ```
## Fine-tuning (LoRA skeleton)
1. Install optional tooling
   ```bash
   pip install peft datasets
   ```
2. Adapt this example for your dataset:
   ```python
   from datasets import load_dataset
   from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, TrainingArguments, Trainer
   model_id = "google/mt5-small"
   tokenizer = AutoTokenizer.from_pretrained(model_id)
   model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
   dataset = load_dataset("cnn_dailymail", "3.0.0")
   def preprocess(batch):
       inputs = tokenizer(batch["article"], truncation=True, padding="max_length", max_length=512)
       labels = tokenizer(batch["highlights"], truncation=True, padding="max_length", max_length=128)
       inputs["labels"] = labels["input_ids"]
       return inputs
   tokenized = dataset.map(preprocess, batched=True)
   args = TrainingArguments(output_dir="t5-base-finetuned", per_device_train_batch_size=4, num_train_epochs=1)
   trainer = Trainer(model=model, args=args, train_dataset=tokenized["train"], eval_dataset=tokenized["validation"], tokenizer=tokenizer)
   trainer.train()
   ```
Licensed under Apache-2.0.