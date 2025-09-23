---
annotations_creators: []
language_creators:
- crowdsourced
- expert-generated
language:
- code
license:
- other
multilinguality:
- multilingual
pretty_name: The-Stack
size_categories:
- unknown
source_datasets: []
task_categories:
- text-generation

extra_gated_prompt: >-
  ## Terms of Use for The Stack


  The Stack dataset is a collection of source code in over 300 programming
  languages. We ask that you read and acknowledge the following points before
  using the dataset:

  1. The Stack is a collection of source code from repositories with various
  licenses. Any use of all or part of the code gathered in The Stack must abide
  by the terms of the original licenses, including attribution clauses when
  relevant. We facilitate this by providing provenance information for each data
  point.

  2. The Stack is regularly updated to enact validated data removal requests. By
  clicking on "Access repository", you agree to update your own version of The
  Stack to the most recent usable version specified by the maintainers in [the
  following
  thread](https://huggingface.co/datasets/bigcode/the-stack/discussions/7). If
  you have questions about dataset versions and allowed uses, please also ask
  them in the dataset’s [community
  discussions](https://huggingface.co/datasets/bigcode/the-stack/discussions/new).
  We will also notify users via email when the latest usable version changes.

  3. To host, share, or otherwise provide access to The Stack dataset, you must
  include [these Terms of
  Use](https://huggingface.co/datasets/bigcode/the-stack#terms-of-use-for-the-stack)
  and require users to agree to it.


  By clicking on "Access repository" below, you accept that your contact
  information (email address and username) can be shared with the dataset
  maintainers as well.
    
extra_gated_fields:
  Email: text
  I have read the License and agree with its terms: checkbox
---
# StarCoder Training Dataset

## Dataset description
This is the dataset used for training [StarCoder](https://huggingface.co/bigcode/starcoder) and [StarCoderBase](https://huggingface.co/bigcode/starcoderbase). It contains 783GB of code in 86 programming languages, and includes 54GB GitHub Issues + 13GB Jupyter notebooks in scripts and text-code pairs,
and 32GB of GitHub commits, which is approximately 250 Billion tokens.

## Dataset creation
The creation and filtering of The Stack is explained in the [original dataset](https://huggingface.co/datasets/bigcode/the-stack-dedup), we additionally decontaminate and clean all 86 programming
languages in the dataset, in addition to GitHub issues, Jupyter Notebooks and GitHub commits. We also apply near-deduplication and remove PII, all details are mentionned in our [Paper: 💫 StarCoder, May The Source Be With You](https://drive.google.com/file/d/1cN-b9GnWtHzQRoE7M7gAEyivY0kl4BYs/view)

## How to use the dataset
```python
from datasets import load_dataset

# to load python for example
ds = load_dataset("bigcode/starcoderdata", data_dir="python", split="train")
```

GitHub issues, GitHub commits and Jupyter notebooks subsets have different columns from the rest so loading the entire dataset at once may fail, we suggest loading programming languages separatly from these categories. 
````
jupyter-scripts-dedup-filtered
jupyter-structured-clean-dedup
github-issues-filtered-structured
git-commits-cleaned
````
