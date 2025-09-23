---
license: gemma
library_name: transformers
pipeline_tag: text-generation
extra_gated_heading: Access Gemma on Hugging Face
extra_gated_prompt: >-
  To access Gemma on Hugging Face, you’re required to review and agree to
  Google’s usage license. To do this, please ensure you’re logged in to Hugging
  Face and click below. Requests are processed immediately.
extra_gated_button_content: Acknowledge license
tags:
- differential_privacy
- dp-sgd
---

# VaultGemma model card

**Model Page**: [VaultGemma][model-page]

**Resources and Technical Documentation**:

*   [VaultGemma Technical Report][tech-report]
*   [Responsible Generative AI Toolkit][rai-toolkit]
*   [VaultGemma on Kaggle][kaggle-gemma]

**Terms of Use**: [Terms][terms]

**Authors**: Google

## Model Information

Summary description and brief definition of inputs and outputs.

### Description

VaultGemma is a variant of the Gemma family of lightweight, state-of-the-art open models from Google. It is pre-trained from the ground up using Differential Privacy (DP). This provides strong, mathematically-backed privacy guarantees for its training data, limiting the extent to which the model's outputs can reveal information about any single training example.

VaultGemma uses a similar architecture as Gemma 2. VaultGemma is a pretrained model that can be instruction tuned for a variety of language understanding and generation tasks. Its relatively small size (< 1B parameters) makes it possible to deploy in environments with limited resources, democratizing access to state-of-the-art AI models that are built with privacy at their core.

### Inputs and outputs

-   **Input:**
    -   Text string, such as a question, a prompt, or a document to be summarized.
    -   Total input context of 1K (1,024) tokens.

-   **Output:**
    -   Generated text in response to the input, such as an answer to a question or a summary or categorization.

## Model Data

Data used for model training and how the data was processed.

### Training Dataset

The model was trained from scratch with differential privacy on a large-scale dataset of English-language text data from a variety of sources, including:

-   Web Documents: A diverse collection of web text ensures the model is exposed to a broad range of linguistic styles, topics, and vocabulary.
-   Code: Exposing the model to code helps it to learn the syntax and patterns of programming languages, which improves its ability to generate code and understand code-related questions.
-   Mathematics: Training on mathematical text helps the model learn logical reasoning and symbolic representation to address mathematical queries.

The defining feature of this model is that the entire pre-training process was conducted using Differentially Private Stochastic Gradient Descent (DP-SGD) with a privacy budget of ε≤2.0, δ≤1.1e-10. DP-SGD provides a formal guarantee that the model's core knowledge base is itself private with respect to the individual examples in the training set.

### Data Preprocessing

In addition to the inherent privacy protections of differential privacy, the following data cleaning and filtering methods used with Gemma 2 were applied to the training data:

-   CSAM Filtering: Rigorous CSAM (Child Sexual Abuse Material) filtering was applied at multiple stages in the data preparation process to ensure the exclusion of harmful and illegal content.
-   Sensitive Data Filtering: As part of making Gemma pre-trained models safe and reliable, automated techniques were used to filter out certain personal information and other sensitive data from training sets.
-   Additional methods: Filtering based on content quality and safety in line with [our policies][safety-policies].

## Implementation Information

Details about the model internals.

### Hardware

VaultGemma was trained using [Tensor Processing Unit (TPU)][tpu] hardware TPUv6e. Training large language models with the significant computational overhead of differential privacy requires specialized hardware. TPUs are designed to handle the massive computations involved, offering the performance, memory, and scalability necessary to train models like VaultGemma efficiently and sustainably.

### Software

Training was done using [JAX][jax] and [ML Pathways][ml-pathways]. The core of the training implementation relied on specialized algorithms for privacy-preserving machine learning at scale:

-   [Differentially Private Stochastic Gradient Descent (DP-SGD)][dp-sgd]: The optimization algorithm used to train the model while providing formal privacy guarantees.
-   [Truncated Poisson Subsampling][poisson-subsampling]: A computationally efficient method used to enable large-scale DP training with fixed-size batches, which is critical for performance on modern accelerators.
-   [DP Scaling Laws][dp-scaling-laws]: The training configuration (model size, batch size, iterations) was determined by a novel set of scaling laws developed specifically for differentially private training, ensuring the optimal use of the compute and privacy budgets.

## Evaluation

Model evaluation metrics and results.

### Benchmark Results

The model was evaluated on a range of standard academic benchmarks. As expected, there is a utility trade-off for the strong privacy guarantees offered by the model. The table below shows the performance of the 1B pre-trained (PT) VaultGemma model.

| **Benchmark**            |  **n-shot**   | **VaultGemma 1B PT** |
| :----------------------- | :-----------: | -------------------: |
| [HellaSwag][hellaswag]   |    10-shot    |                39.09 |
| [BoolQ][boolq]           |    0-shot     |                62.04 |
| [PIQA][piqa]             |    0-shot     |                68.00 |
| [SocialIQA][socialiqa]   |    0-shot     |                46.16 |
| [TriviaQA][triviaqa]     |    5-shot     |                11.24 |
| [ARC-c][arc]             |    25-shot    |                26.45 |
| [ARC-e][arc]             |    0-shot     |                51.78 |

### Empirical Memorization Analysis

We also conducted empirical tests to measure the model's "memorization rate"—its tendency to reproduce sequences from its training data. We followed the established methodology in the [Gemma 3 technical report][g3-tech-report]. The model was prompted with 50-token prefixes extracted from the training corpus to determine if it would generate the corresponding 50-token suffixes. The evaluation specifically tested for:

-   Exact Memorization: Verbatim reproduction of the suffix.
-   Approximate Memorization: Reproduction of the suffix with up to a 10% error rate.

VaultGemma exhibited **no detectable memorization** (neither exact nor approximate) in these tests. This empirical finding strongly validates the effectiveness of the Differentially Private Stochastic Gradient Descent (DP-SGD) pre-training process in preventing the retention of individual training examples.

## Ethics and Safety

We use the same data mixture as Gemma 2, and utilize differential privacy during the training process to ensure the model's parameters do not memorize individual training examples, providing a formal privacy guarantee for the training data. Further we are only providing a pre-trained model.

## Usage and Limitations

These models have certain limitations that users should be aware of.

### Intended Usage

VaultGemma is intended for a wide range of natural language processing (NLP) applications. The purpose of this list is to provide contextual information about possible use cases that the model creators considered.

-   Privacy-Preserving NLP Research: Serve as a strong baseline for researchers to experiment with privacy-preserving techniques, develop new algorithms, and fine-tune models on sensitive data.
-   Applications with Sensitive Data: Can be fine-tuned on private or sensitive datasets (e.g., in healthcare, finance) where it is critical that the base model itself does not carry risks from public pre-training data.
-   Content Creation and Communication: Generate creative text, power chatbots, and summarize documents in scenarios where data privacy is a primary concern.

### Limitations

-   Utility Gap for Privacy: There is an inherent trade-off between the strength of the privacy guarantee and model utility. As shown in the evaluation benchmarks, VaultGemma may underperform compared to non-private models of a similar size.
-   Training Data: The quality and diversity of the training data influence the model's capabilities. Biases or gaps in the training data can lead to limitations in the model's responses.
-   Factual Accuracy: The model generates responses based on patterns from its training data but is not a knowledge base. It may generate incorrect or outdated factual statements.
-   Language Nuance: The model may struggle to grasp subtle nuances, sarcasm, or figurative language.

### Ethical Considerations and Risks

The development of language models raises several ethical concerns. In creating this open model, we have carefully considered the following:

-   Bias and Fairness: Models trained on large-scale data can reflect socio-cultural biases from the training material.
-   Misinformation and Misuse: Models can be misused to generate text that is false, misleading, or harmful. Guidelines are provided for responsible use in the [Responsible Generative AI Toolkit][rai-toolkit].
-   Transparency and Accountability: This model card summarizes details on the model's architecture, capabilities, limitations, and evaluation processes

Risks identified and mitigations:

-   **Perpetuation of biases**: It's encouraged to perform continuous monitoring (using evaluation metrics, human review) and the exploration of de-biasing techniques during model training, fine-tuning, and other use cases.
-   **Generation of harmful content**: Mechanisms and guidelines for content safety are essential. Developers are encouraged to exercise caution and implement appropriate content safety safeguards based on their specific product policies and application use cases.
-   **Misuse for malicious purposes**: Technical limitations and developer and end-user education can help mitigate against malicious applications of VLMs. Educational resources and reporting mechanisms for users to flag misuse are provided. Prohibited uses of Gemma models are outlined in the [Gemma Prohibited Use Policy][prohibited-use].
-   **Privacy violations**: Models were trained on data filtered for removal of certain personal information and other sensitive data. Further, we use differential privacy during pre-training, with ε≤2.0, δ≤1.1e-10. Developers are encouraged to adhere to privacy regulations with privacy-preserving techniques.

### Benefits

At the time of release to the best of our knowledge, this model is the largest and highest-performing open language model pretrained from the ground up with formal differential privacy. Its primary benefit is providing strong, mathematically-backed privacy guarantees for its training data, making it uniquely suited for applications and research where training data privacy is a critical concern.

[model-page]: # "Link to VaultGemma Model Page"
[tech-report]: https://services.google.com/fh/files/blogs/vaultgemma_tech_report.pdf
[rai-toolkit]: https://ai.google.dev/responsible
[kaggle-gemma]: https://www.kaggle.com/models/google/vaultgemma
[terms]: https://ai.google.dev/gemma/terms
[safety-policies]: https://ai.google/static/documents/ai-responsibility-update-published-february-2025.pdf
[prohibited-use]: https://ai.google.dev/gemma/prohibited_use_policy
[tpu]: https://cloud.google.com/tpu/docs/intro-to-tpu
[jax]: https://github.com/jax-ml/jax
[ml-pathways]: https://blog.google/technology/ai/introducing-pathways-next-generation-ai-architecture/
[dp-sgd]: https://arxiv.org/abs/1607.00133
[poisson-subsampling]: https://arxiv.org/abs/2411.04205
[dp-scaling-laws]: https://arxiv.org/pdf/2501.18914
[g3-tech-report]: https://arxiv.org/pdf/2503.19786

[hellaswag]: https://arxiv.org/abs/1905.07830
[boolq]: https://arxiv.org/abs/1905.10044
[piqa]: https://arxiv.org/abs/1911.11641
[socialiqa]: https://arxiv.org/abs/1904.09728
[triviaqa]: https://arxiv.org/abs/1705.03551
[arc]: https://arxiv.org/abs/1911.01547