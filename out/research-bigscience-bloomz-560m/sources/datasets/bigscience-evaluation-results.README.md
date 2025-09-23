---
pretty_name: evaluation-results
size_categories:
- 100M<n<1B
task_categories:
- other
---

# BigScience BLOOM Evaluation Results


This repository contains evaluation results & original predictions of BLOOM & friends.

## Usage

You can load numeric results via:
```python
from datasets import load_dataset
ds = load_dataset("bigscience/evaluation-results", "bloom")
```

If it takes too long, it may be faster to clone the repository and load the data from disk:
```python
!git clone https://huggingface.co/datasets/bigscience/evaluation-results
ds = load_dataset("evaluation-results", "bloom")
```

For example generations (.jsonl files), you need to manually browse the repository.

## Structure

For `bigsciencelmevalharness`, `lmevalharness` & `codeeval` evaluation_frameworks the structure is:
`model_name > evaluation_framework > checkpoint_type > dataset_name > data`

## Evaluation Procedure

- `bigsciencelmevalharness` files were created using the below:
    - https://github.com/bigscience-workshop/Megatron-DeepSpeed/pull/291
    - https://github.com/bigscience-workshop/lm-evaluation-harness
- `lmevalharness` files were created using the below:
    - https://github.com/bigscience-workshop/Megatron-DeepSpeed
    - https://github.com/EleutherAI/lm-evaluation-harness
- `codeeval` files were created using the HumanEval code dataset with the below:
    - https://github.com/loubnabnl/bloom-code-evaluation
