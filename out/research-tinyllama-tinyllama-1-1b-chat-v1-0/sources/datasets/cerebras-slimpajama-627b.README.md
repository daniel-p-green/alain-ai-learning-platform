---
task_categories:
- text-generation
language:
- en
pretty_name: SlimPajama-627B
---

## Dataset Description

- **Homepage:** [SlimPajama Blog](https://www.cerebras.net/blog/slimpajama-a-627b-token-cleaned-and-deduplicated-version-of-redpajama)
- **Repository:** [Pre-Processing Libraries](https://github.com/Cerebras/modelzoo/tree/main/modelzoo/transformers/data_processing/slimpajama)
- **Size of compressed dataset:** 895 GB

The dataset consists of 59166 jsonl files and is ~895GB compressed. It is a cleaned and deduplicated version of [Together's RedPajama](https://github.com/togethercomputer/redpajama-data). 

Check out our [blog post](https://www.cerebras.net/blog/slimpajama-a-627b-token-cleaned-and-deduplicated-version-of-redpajama) explaining our methods, [our code on GitHub](https://github.com/Cerebras/modelzoo/tree/main/modelzoo/transformers/data_processing/slimpajama), and join the discussion on the [Cerebras Discord](https://discord.gg/q6bZcMWJVu).

## Getting Started
You can download the dataset using Hugging Face datasets:
```python
from datasets import load_dataset
ds = load_dataset("cerebras/SlimPajama-627B")
```

## Background

Today we are releasing SlimPajama – the largest extensively deduplicated, multi-corpora, open-source dataset for training large language models. SlimPajama was created by cleaning and deduplicating the 1.2T token RedPajama dataset from Together. By filtering out low quality data and duplicates, we were able to remove 49.6% of bytes, slimming down the dataset from 1210B to 627B tokens. We believe SlimPajama offers the highest quality and most compute efficient data to train on for runs up to 627B tokens. When upsampled, we expect SlimPajama to perform equal to or better than RedPajama-1T when training at trillion token scale. 

In addition to the data, we are also releasing the tools we built to create SlimPajama. Applying [MinHashLSH](http://infolab.stanford.edu/~ullman/mmds/book0n.pdf) deduplication to trillion token datasets like RedPajama was not possible with off-the-shelf open-source code. We made several improvements to existing solutions to produce an infrastructure that can perform MinHashLSH deduplication on trillion token datasets in a distributed, multi-threaded, and memory efficient fashion. Today we are open-sourcing this infrastructure to enable the community to easily create higher quality, extensively deduplicated datasets in the future. 

### Our contributions

1. SlimPajama 627B – the largest extensively deduplicated, multi-corpora, open dataset for LLM training. We release it under the Apache 2.0 license.
2. Releasing validation and test sets, 500M tokens each, which has been decontaminated against the training data.
3. Library of methods to replicate or pre-process from scratch other datasets. To the best of our knowledge these are the first open-source tools to enable cleaning and MinHashLSH deduplication of text data at trillion token scale.

The full set of scripts to recreate the dataset from the original RedPajama dataset are available on the [Cerebras GitHub](https://github.com/Cerebras/modelzoo/tree/main/modelzoo/transformers/data_processing/slimpajama). A deeper explanation of our cleaning and deduplication process can be found in the [SlimPajama blog post](https://www.cerebras.net/blog/slimpajama-a-627b-token-cleaned-and-deduplicated-version-of-redpajama).

## Dataset Summary

The [latest research](https://arxiv.org/abs/2306.01116) has shown that data quality is as important as data quantity. While training on more than one data epoch can be beneficial, this should be a choice rather than a side-effect of duplicates in the dataset. We decided to extensively deduplicate RedPajama to produce a dataset with higher information density. This means when using SlimPajama, you can achieve higher accuracy with the same compute budget when compared to other datasets.

#### Comparison of dataset features
| Data source     | Tokens  | Open Source | Curated Data Sources | Deduplication Level |
| --------------- | ------- | ----------- | -------------------- | ------------------- |
| SlimPajama      | **627B**| **Yes**     | **Yes**              | **Extensive**       |
| RedPajama       | 1.21T   | **Yes**     | **Yes**              | Partial             |
| RefinedWeb-600B | 600B    | **Yes**     | No                   | **Extensive**       |
| RefinedWeb-5T   | **5T**  | No          | No                   | **Extensive**       |
| LLaMA           | 1.4T    | No          | **Yes**              | Partial             |
| MPT             | 1T      | No          | **Yes**              | Partial             |
| MassiveText     | 1.4T    | No          | **Yes**              | **Extensive**       |


#### Document low-length filter rates

| Data source   | Document low-length filter rate |
| ------------- | ------------------------------- |
| Commoncrawl   | 0.02%                           |
| C4            | 4.70%                           |
| GitHub        | 0.00%                           |
| Books         | 0.00%                           |
| ArXiv         | 0.62%                           |
| Wikpedia      | 0.00%                           |
| StackExchange | 0.32%                           |
| Total         | 1.86%                           |

#### Data source byte deduplication rates

| Data source    | Byte deduplication rate |
| -------------  | ----------------------  |
| Commoncrawl    | 63.76%                  |
| C4             | 6.85%                   |
| GitHub         | 46.16%                  |
| Books          | 2.01%                   |
| ArXiv          | 0.06%                   |
| Wikipedia      | 2.24%                   |
| StackExchange  | 0.20%                   |
| Total          | 49.60%                  |

#### Data source proportions for SlimPajama and RedPajama

| Data source   | SlimPajama | RedPajama |
| ------------- | ---------- | --------- |
| Commoncrawl   | 52.2%      | 72.6%    |
| C4            | 26.7%      | 14.4%    |
| GitHub        | 5.2%       | 4.9%     |
| Books         | 4.2%       | 2.1%     |
| ArXiv         | 4.6%       | 2.3%     |
| Wikpedia      | 3.8%       | 2.0%     |
| StackExchange | 3.3%       | 1.7%     |


### Languages

Primarily English, with some non-English files in Wikipedia.


### Dataset Structure

The dataset consists of jsonl files, with structure as follows:

```json
{
    "text": ...,
    "meta": {"redpajama_set_name": "RedPajamaCommonCrawl" | "RedPajamaC4" | "RedPajamaGithub" | "RedPajamaBook" | "RedPajamaArXiv" | "RedPajamaWikipedia" | "RedPajamaStackExchange"},
}
```

### Dataset Creation

SlimPajama was created by cleaning and deduplicating the [RedPajama dataset from Together](https://github.com/togethercomputer/redpajama-data) via MinHashLSH. RedPajama is an open-source reproduction of the [LLaMA](https://arxiv.org/abs/2302.13971) data collection methodology.


### Source Data

The data sources composing RedPajama are explained in [its model card](https://huggingface.co/datasets/togethercomputer/RedPajama-Data-1T). 


To cite SlimPajama, please use:

```
@misc{cerebras2023slimpajama,
  author = {Soboleva, Daria and Al-Khateeb, Faisal and Myers, Robert and Steeves, Jacob R and Hestness, Joel and Dey, Nolan},
  title = {{SlimPajama: A 627B token cleaned and deduplicated version of RedPajama}},
  month = June,
  year = 2023,
  howpublished = {\url{https://www.cerebras.net/blog/slimpajama-a-627b-token-cleaned-and-deduplicated-version-of-redpajama}},
  url = {https://huggingface.co/datasets/cerebras/SlimPajama-627B},
}
```

## License
Please refer to the licenses of the data subsets you use.

- [Common Crawl Foundation Terms of Use](https://commoncrawl.org/terms-of-use/full/)
- [C4 license](https://huggingface.co/datasets/allenai/c4#license)
- GitHub was limited to MIT, BSD, or Apache licenses only
- Books: [the_pile_books3 license](https://huggingface.co/datasets/the_pile_books3#licensing-information) and [pg19 license](https://huggingface.co/datasets/pg19#licensing-information)
- [ArXiv Terms of Use](https://info.arxiv.org/help/api/tou.html)
- [Wikipedia License](https://huggingface.co/datasets/wikipedia#licensing-information)
- [StackExchange license on the Internet Archive](https://archive.org/details/stackexchange)


## Acknowledgements
- We’d like to thank Together, Ontocord.ai, ETH DS3Lab , AAI CERC Lab for creating the original RedPajama dataset and releasing it open source.
- This release was made possible with the support and collaboration of Opentensor.
- Easy cloud access to Cerebras systems is provided by our partner Cirrascale.