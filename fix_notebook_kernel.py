import json
import os

# Path to the notebook
notebook_path = 'content/notebooks/openai/gpt-oss-20b/getting-started-with-gpt-oss-20b.ipynb'

# Read the notebook
with open(notebook_path, 'r', encoding='utf-8') as f:
    notebook = json.load(f)

# Update kernel specification
notebook['metadata']['kernelspec'] = {
    "display_name": "Python 3 (ipykernel)",
    "language": "python",
    "name": "python3"
}

# Update language info
notebook['metadata']['language_info'] = {
    "codemirror_mode": {
        "name": "ipython",
        "version": 3
    },
    "file_extension": ".py",
    "mimetype": "text/x-python",
    "name": "python",
    "nbconvert_exporter": "python",
    "pygments_lexer": "ipython3",
    "version": "3.8.0"
}

# Save the notebook
with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=2, ensure_ascii=False)
    f.write('\n')

print(f"Notebook {notebook_path} has been updated with the correct kernel configuration.")
