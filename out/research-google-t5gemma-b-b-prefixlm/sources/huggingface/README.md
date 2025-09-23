---
license: gemma
library_name: transformers
pipeline_tag: text2text-generation
extra_gated_heading: Access Gemma on Hugging Face
extra_gated_prompt: To access Gemma on Hugging Face, you’re required to review and
  agree to Google’s usage license. To do this, please ensure you’re logged in to Hugging
  Face and click below. Requests are processed immediately.
extra_gated_button_content: Acknowledge license
base_model: google/t5gemma-b-b-prefixlm
---

> [!Note]
> This repository corresponds to T5Gemma (pretrained) with B encoder and B decoder (adapted using PrefixLM)

# T5Gemma model card

**Model Page**: [T5Gemma](https://ai.google.dev/gemma/docs/t5gemma)  

**Resources and Technical Documentation**:

- [T5Gemma Technical Report](https://arxiv.org/abs/2504.06225)
- [Responsible Generative AI Toolkit](https://ai.google.dev/responsible)
- [T5Gemma on Kaggle](https://www.kaggle.com/models/google/t5gemma)
- [T5Gemma on Vertex Model Garden](https://console.cloud.google.com/vertex-ai/publishers/google/model-garden/t5gemma)

**Terms of Use**: [Terms](https://ai.google.dev/gemma/terms)  

**Authors**: Google DeepMind

## Model Information

Summary description and brief definition of inputs and outputs.

### Description

T5Gemma is a family of lightweight yet powerful encoder-decoder research models from Google. These models are created by adapting pretrained decoder-only models into a encoder-decoder. This adaptation allows T5Gemma to inherit the foundational capabilities of the decoder-only models while also offering a more favorable quality-efficiency trade-off. A key feature is the flexibility to pair encoders and decoders of different sizes(e.g., a 9B encoder with a 2B decoder).  
T5Gemma is released in two different series:

- **Gemma 2 Series**:, Models directly adapted from the official Gemma 2 2B and 9B checkpoints. It includes 2B-2B, 9B-9B, and 9B-2B variants.
- **T5-compatible Series**: Models pretrained from scratch using the Gemma 2 recipe but with architectures and parameter counts that align with traditional T5 models (Small, Base, Large, XL). This series also includes an ML (Medium-Large, ~2B) model to bridge the gap between Large and XL.

These models are text-to-text, available in English, with open weights for pre-trained variants (adapted via objectives like PrefixLM or UL2) and instruction-tuned variants. T5Gemma models are well-suited for a variety of generative tasks, including question answering, summarization, and reasoning. Meanwhile, their encoders can be leveraged for discriminative tasks, providing strong performance on classification and understanding benchmarks. Their relatively small size makes it possible to deploy them in environments with limited resources such as laptops, desktops or your own cloud infrastructure, democratizing access to state of the art AI models and helping foster innovation for everyone.

### Usage

Below we share some code snippets on how to get quickly started with running the model. First, install the Transformers library with:
```sh
pip install -U transformers
```

Then, copy the snippet from the section that is relevant for your usecase.

#### Running with the `pipeline` API

```python
import torch
from transformers import pipeline

pipe = pipeline(
    "text2text-generation",
    model="google/t5gemma-b-b-prefixlm",
    device="cuda",  # replace with "mps" to run on a Mac device
)

text = "Once upon a time,"
outputs = pipe(text, max_new_tokens=32)
response = outputs[0]["generated_text"]
print(response)
```

#### Running the model on a single / multi GPU

```python
# pip install accelerate
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

tokenizer = AutoTokenizer.from_pretrained("google/t5gemma-b-b-prefixlm")
model = AutoModelForSeq2SeqLM.from_pretrained(
    "google/t5gemma-b-b-prefixlm",
    device_map="auto",
)

input_text = "Write me a poem about Machine Learning. Answer:"
input_ids = tokenizer(input_text, return_tensors="pt").to("cuda")

outputs = model.generate(**input_ids, max_new_tokens=32)
print(tokenizer.decode(outputs[0]))
```



### Inputs and outputs

- **Input:**
  - Text string, such as a question, a prompt, or a document to be summarized

- **Output:**
  - Generated English-language text in response to the input, such as an answer to a question, or a summary of a document.

### Citation

```none
@article{t5gemma_2025,
  title={Encoder-Decoder Gemma: Improving the Quality-Efficiency Trade-Off via Adaptation},
  author={Zhang, Biao and Moiseev, Fedor and Ainslie, Joshua and Suganthan, Paul and Ma, Min and Bhupatiraju, Surya and Lebron, Fede and Firat, Orhan and Joulin, Armand and Dong, Zhe},
  year={2025}
}
```

## Model Data

Data used for model training and how the data was processed.

### Training Dataset

These models were trained on a dataset of text data that includes a wide variety of sources. The 9B-9B, 9B-2B, and 2B-2B models were adapted with 2 trillion tokens, and the T5-sized models (Small, Base, Large, ML and XL) were first pretrained with 2 trillion tokens (decoder-only) and then adapted with 2 trillion tokens (encoder-decoder). Here are the key components:

- Web Documents: A diverse collection of web text ensures the model is exposed to a broad range of linguistic styles, topics, and vocabulary. Primarily English-language content.
- Code: Exposing the model to code helps it to learn the syntax and patterns of programming languages, which improves its ability to generate code or understand code-related questions.
- Mathematics: Training on mathematical text helps the model learn logical reasoning, symbolic representation, and to address mathematical queries.

The combination of these diverse data sources is crucial for training a powerful language model that can handle a wide variety of different tasks and text formats.

### Data Preprocessing

Here are the key data cleaning and filtering methods applied to the training data:

- CSAM Filtering: Rigorous CSAM (Child Sexual Abuse Material) filtering was applied at multiple stages in the data preparation process to ensure the exclusion of harmful and illegal content.
- Sensitive Data Filtering: As part of making Gemma pre-trained models safe and reliable, automated techniques were used to filter out certain personal information and other sensitive data from training sets.
- Additional methods: Filtering based on content quality and safety in line with [our policies](https://ai.google/static/documents/ai-responsibility-update-published-february-2025.pdf).

## Implementation Information

Details about the model internals.

### Hardware

T5Gemma was trained using [Tensor Processing Unit (TPU)](https://cloud.google.com/tpu/docs/intro-to-tpu) hardware (TPUv4p, TPUv5p and TPUv5e). Training large language models requires significant computational power. TPUs, designed specifically for matrix operations common in machine learning, offer several advantages in this domain:

- Performance: TPUs are specifically designed to handle the massive computations involved in training LLMs. They can speed up training considerably compared to CPUs.
- Memory: TPUs often come with large amounts of high-bandwidth memory, allowing for the handling of large models and batch sizes during training. This can lead to better model quality.
- Scalability: TPU Pods (large clusters of TPUs) provide a scalable solution for handling the growing complexity of large foundation models. You can distribute training across multiple TPU devices for faster and more efficient processing.
- Cost-effectiveness: In many scenarios, TPUs can provide a more cost-effective solution for training large models compared to CPU-based infrastructure, especially when considering the time and resources saved due to faster training.
- These advantages are aligned with [Google's commitments to operate sustainably](https://sustainability.google/operating-sustainably/).

### Software

Training was done using [JAX](https://github.com/jax-ml/jax) and [ML Pathways](https://blog.google/technology/ai/introducing-pathways-next-generation-ai-architecture/). JAX allows researchers to take advantage of the latest generation of hardware, including TPUs, for faster and more efficient training of large models. ML Pathways is Google's latest effort to build artificially intelligent systems capable of generalizing across multiple tasks. This is specially suitable for foundation models, including large language models like these ones.  
Together, JAX and ML Pathways are used as described in the [paper about the Gemini family of models](https://goo.gle/gemma2report); _"the 'single controller' programming model of Jax and Pathways allows a single Python process to orchestrate the entire training run, dramatically simplifying the development workflow."_

## Evaluation

Model evaluation metrics and results.

### Benchmark Results

These models were evaluated against a large collection of different datasets and metrics to cover different aspects of text generation.

_PT models. XX/YY: results for PrefixLM/UL2 checkpoints._

| Benchmark | Metric | 2B-2B | 9B-2B | 9B-9B | S-S | B-B | L-L | ML-ML | XL-XL |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [MMLU](https://arxiv.org/abs/2009.03300) | 5-shot, top-1 | 46.8/50.4 | 60.3/64.8 | 71.3/72.1 | 24.7/25.2 | 24.8/25.7 | 27.3/27.5 | 27.3/29.1 | 34.8/36.6 |
| [HellaSwag](https://arxiv.org/abs/1905.07830) | 10-shot | 74.9/74.0 | 75.7/74.3 | 81.0/82.5 | 30.9/30.5 | 40.5/38.6 | 57.3/54.9 | 65.4/64.5 | 68.9/69.0 |
| [PIQA](https://arxiv.org/abs/1911.11641) | 0-shot | 79.0/78.8 | 78.3/78.2 | 81.1/82.4 | 62.8/61.5 | 67.0/66.2 | 71.2/70.9 | 74.3/75.5 | 76.2/78.0 |
| [BoolQ](https://arxiv.org/abs/1905.10044) | 0-shot | 75.6/77.5 | 84.6/85.1 | 85.6/87.0 | 53.1/61.1 | 52.3/49.6 | 62.2/62.3 | 62.6/61.7 | 69.9/68.0 |
| [WinoGrande](https://arxiv.org/abs/1907.10641) | partial score | 69.5/69.8 | 68.1/58.8 | 78.7/78.2 | 52.0/50.0 | 53.9/51.6 | 58.1/56.7 | 64.6/62.4 | 64.7/65.1 |
| [ARC-e](https://arxiv.org/abs/1911.01547) | 0-shot | 77.1/76.5 | 82.9/81.1 | 85.3/86.0 | 42.3/43.8 | 48.5/47.9 | 59.5/56.9 | 65.8/63.5 | 71.2/69.2 |
| [ARC-c](https://arxiv.org/abs/1911.01547) | 25-shot | 52.0/53.5 | 59.9/59.6 | 65.0/66.5 | 23.0/23.4 | 25.1/25.7 | 32.7/31.5 | 41.4/40.4 | 46.5/45.9 |
| [TriviaQA](https://arxiv.org/abs/1705.03551) | 5-shot | 51.2/51.1 | 66.2/58.3 | 75.2/73.3 | 3.2/3.3 | 7.2/5.9 | 19.4/15.9 | 33.2/25.4 | 41.0/34.3 |
| [Natural Questions](https://github.com/google-research-datasets/natural-questions) | 5-shot | 28.4/28.3 | 37.1/33.9 | 43.1/44.0 | 7.1/7.7 | 10.8/10.9 | 15.6/15.3 | 21.5/19.6 | 23.7/21.8 |
| [HumanEval](https://arxiv.org/abs/2107.03374) | pass@1 | 27.4/28.0 | 33.5/22.0 | 40.2/37.2 | 0.6/0.0 | 3.7/1.8 | 12.8/8.5 | 17.1/15.9 | 23.2/19.5 |
| [MBPP](https://arxiv.org/abs/2108.07732) | 3-shot | 37.4/36.4 | 43.4/38.6 | 55.6/55.2 | 1.4/0.0 | 4.6/3.4 | 15.0/11.8 | 27/24.6 | 30.0/28.0 |
| [GSM8K](https://arxiv.org/abs/2110.14168) | 5-shot, maj@1 | 41.7/35.8 | 48.7/39.7 | 72.8/74.0 | 2.0/0.8 | 2.2/1.5 | 6.6/4.1 | 13.7/17.5 | 25.8/22.4 |
| [MATH-500](https://arxiv.org/abs/2103.03874) | 4-shot | 24.2/20.4 | 23.6/18.4 | 37.8/39.2 | 1.0/1.2 | 1.8/2.4 | 5.0/4.8 | 11.0/12 | 15.6/12.4 |
| [AGIEval](https://arxiv.org/abs/2304.06364) | 3-5-shot | 35.0/37.0 | 43.6/45.7 | 53.1/56.4 | 20.8/21.4 | 21.8/21.3 | 22.5/23.0 | 23.4/24.5 | 28.0/27.4 |
| [BIG-Bench](https://arxiv.org/abs/2206.04615) | 3-shot, CoT | 51.9/50.5 | 51.6/52.1 | 74.7/76.3 | 24.7/22.7 | 23.0/24.8 | 29.9/31.3 | 37.3/35.9 | 44.5/43.1 |

## Ethics and Safety

Ethics and safety evaluation approach and results.

### Evaluation Approach

Our evaluation methods include structured evaluations and internal red-teaming testing of relevant content policies. Red-teaming was conducted by a number of different teams, each with different goals and human evaluation metrics. These models were evaluated against a number of different categories relevant to ethics and safety, including:

- **Child Safety**: Evaluation of text-to-text prompts covering child safety policies, including child sexual abuse and exploitation.
- **Content Safety:** Evaluation of text-to-text prompts covering safety policies including, harassment, violence and gore, and hate speech.
- **Representational Harms**: Evaluation of text-to-text prompts covering safety policies including bias, stereotyping, and harmful associations or inaccuracies.

In addition to development level evaluations, we conduct "assurance evaluations" which are our ‘arms-length' internal evaluations for responsibility governance decision making. They are conducted separately from the model development team, to inform decision making about release. High level findings are fed back to the model team, but prompt sets are held-out to prevent overfitting and preserve the results' ability to inform decision making. Assurance evaluation results are reported to our Responsibility & Safety Council as part of release review.

### Evaluation Results

For all areas of safety testing, we saw major improvements in the categories of child safety, content safety, and representational harms relative to previous Gemma models. All testing was conducted without safety filters to evaluate the model capabilities and behaviors. For both text-to-text and image-to-text, and across all model sizes, the model produced minimal policy violations, and showed significant  improvements over previous Gemma models' performance with respect to ungrounded inferences. A limitation of our evaluations was they included only English language prompts.

## Usage and Limitations

These models have certain limitations that users should be aware of.

### Intended Usage

Open large language models (LLMs) models have a wide range of applications across various industries and domains. The following list of potential uses is not comprehensive. The purpose of this list is to provide contextual information about the possible use-cases that the model creators considered as part of model training and development.

- Content Creation and Communication
  - Text Generation: These models can be used to generate creative text formats such as poems, scripts, code, marketing copy, and email drafts.
  - Text Summarization: Generate concise summaries of a text corpus, research papers, or reports.

- Research and Education
  - Natural Language Processing (NLP) Research: These models can serve as a foundation for researchers to experiment with NLP techniques, develop algorithms, and contribute to the advancement of the field.

### Limitations

- Training Data
  - The quality and diversity of the training data significantly influence the model's capabilities. Biases or gaps in the training data can lead to limitations in the model's responses.
  - The scope of the training dataset determines the subject areas the model can handle effectively.

- Context and Task Complexity
  - Models are better at tasks that can be framed with clear prompts and instructions. Open-ended or highly complex tasks might be challenging.
  - A model's performance can be influenced by the amount of context provided (longer context generally leads to better outputs, up to a certain point).

- Language Ambiguity and Nuance
  - Natural language is inherently complex. Models might struggle to grasp subtle nuances, sarcasm, or figurative language.

- Factual Accuracy
  - Models generate responses based on information they learned from their training datasets, but they are not knowledge bases. They may generate incorrect or outdated factual statements.

- Common Sense
  - Models rely on statistical patterns in language. They might lack the ability to apply common sense reasoning in certain situations.

### Ethical Considerations and Risks

The development of large language models (LLMs) raises several ethical concerns. In creating an open model, we have carefully considered the following:

- Bias and Fairness
  - LLMs trained on large-scale, real-world text data can reflect socio-cultural biases embedded in the training material. These models underwent careful scrutiny, input data pre-processing described and posterior evaluations reported in this card.

- Misinformation and Misuse
  - LLMs can be misused to generate text that is false, misleading, or harmful.
  - Guidelines are provided for responsible use with the model, see the [Responsible Generative AI Toolkit](https://ai.google.dev/responsible).

- Transparency and Accountability:
  - This model card summarizes details on the models' architecture, capabilities, limitations, and evaluation processes.
  - A responsibly developed open model offers the opportunity to share innovation by making LLM technology accessible to developers and researchers across the AI ecosystem.

Risks identified and mitigations:

- **Perpetuation of biases**: It's encouraged to perform continuous monitoring (using evaluation metrics, human review) and the exploration of de-biasing techniques during model training, fine-tuning, and other use cases.
- **Generation of harmful content**: Mechanisms and guidelines for content safety are essential. Developers are encouraged to exercise caution and implement appropriate content safety safeguards based on their specific product policies and application use cases.
- **Misuse for malicious purposes**: Technical limitations and developer and end-user education can help mitigate against malicious applications of LLMs. Educational resources and reporting mechanisms for users to flag misuse are provided. Prohibited uses of Gemma models are outlined in the [Gemma Prohibited Use Policy](https://ai.google.dev/gemma/prohibited_use_policy).
- **Privacy violations**: Models were trained on data filtered for removal of certain personal information and other sensitive data. Developers are encouraged to adhere to privacy regulations with privacy-preserving techniques.

### Benefits

At the time of release, this family of models provides high-performance open encoder-decoder large language model implementations designed from the ground up for Responsible AI development compared to similarly sized models.

Using the benchmark evaluation metrics described in this document, these models have shown to provide superior performance to other, comparably-sized open model alternatives.

