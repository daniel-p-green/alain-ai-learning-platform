# COOKBOOK

# Salesforce/codet5p‑220m Usage Cookbook

Below is a minimal, copy‑and‑paste guide for running the provided scripts with the **Salesforce/codet5p-220m** model.

---

## Quick Inference

The repository ships two evaluation utilities:

| Script | Purpose |
|--------|---------|
| `eval_contrast_retrieval.py` | Contrastive retrieval (text ↔ code) |
| `eval_match_retrieval.py`   | Matching retrieval (text ↔ text or code ↔ code) |

Both scripts share the same command‑line interface.  
They load a pretrained model via Hugging Face’s `AutoModel`, tokenize with `AutoTokenizer`, and compute embeddings for the dataset.

### 1. Install dependencies

```bash
# Create a virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install required packages
pip install torch transformers tqdm numpy
```

> **Note**  
> The scripts expect the `data_utils.py` module to be in the same directory. Ensure that file is present.

### 2. Prepare your data

The helper function `create_dataset(data_dir, task)` will automatically load the correct split files for a given task (e.g., `AdvTest`, `cosqa`).  
Place your dataset under a folder structure like:

```
data/
├── AdvTest/
│   ├── train.jsonl
│   ├── valid.jsonl
│   └── test.jsonl
└── cosqa/
    ├── ...
```

### 3. Run inference

#### Contrastive Retrieval

```bash
python eval_contrast_retrieval.py \
    --model_name_or_path salesforce/codet5p-220m \
    --data_dir ./data/AdvTest \
    --task AdvTest \
    --max_length 512 \
    --batch_size 32 \
    --device cuda:0   # or cpu
```

#### Matching Retrieval

```bash
python eval_match_retrieval.py \
    --model_name_or_path salesforce/codet5p-220m \
    --data_dir ./data/AdvTest \
    --task AdvTest \
    --max_length 512 \
    --batch_size 32 \
    --device cuda:0   # or cpu
```

Both scripts will print a summary of retrieval metrics (e.g., Recall@k) to the console.

---

## Fine‑tuning or Evaluation

The provided snippets **do not** contain any training