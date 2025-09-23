# COOKBOOK

# T5‑Base Usage Cookbook

Below are the minimal steps you need to get started with **t5‑base** in a Colab notebook or any Python environment that supports TensorFlow 2.x.

---

## Quick Inference

1. **Install the required libraries**  
   ```python
   print("Installing dependencies...")
   %tensorflow_version 2.x          # Use TF 2.x in Colab
   !pip install -q t5                # Install the T5 library
   ```

2. **Import the necessary modules**  
   ```python
   import tensorflow.compat.v1 as tf
   import t5
   import t5.models
   import seqio
   ```

3. **(Optional) Set up your data and model directories** – if you plan to load a pre‑trained checkpoint or use custom datasets, define the paths.  
   ```python
   BASE_DIR = "gs://"          # Replace with your bucket/path
   DATA_DIR = os.path.join(BASE_DIR, "data")
   MODELS_DIR = os.path.join(BASE_DIR, "models")
   ```

4. **Load a pre‑trained T5‑base model** (example using the `t5.models.MtfModel` API)  
   ```python
   # Load the default t5-base checkpoint
   model = t5.models.MtfModel(
       name="t5_base",
       vocab_file="gs://t5-data/vocab.t5.11b.vocab.txt",
       spm_model_file="gs://t5-data/spm.model"
   )
   ```

5. **Run inference** – feed a prompt to the model and get the generated text.  
   ```python
   # Example: translate English to French
   input_text = "translate English to French: The quick brown fox jumps over the lazy dog."
   output = model.generate(input_text, max_length=50)
   print(output)  # e.g., "Le rapide renard brun saute par-dessus le chien paresseux."
   ```

---

## Fine‑tuning or Evaluation

*No fine‑tuning or evaluation code snippets were provided in the supplied material.*  
If you need to train or evaluate a model, refer to the official T5 documentation or other resources that include training loops and dataset handling.