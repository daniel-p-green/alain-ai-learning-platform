# COOKBOOK

# Inference examples

Transformers

```py
from transformers import pipeline
import torch

model_id = "facebook/MobileLLM-R1-950M"

pipe = pipeline(
    "text-generation",
    model=model_id,
    torch_dtype="auto",
    device_map="auto",
)
