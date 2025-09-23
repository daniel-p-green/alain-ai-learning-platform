---
base_model:
- mistralai/Mistral-Small-3.2-24B-Instruct-2506
language:
- en
- fr
- de
- es
- pt
- it
- ja
- ko
- ru
- zh
- ar
- fa
- id
- ms
- ne
- pl
- ro
- sr
- sv
- tr
- uk
- vi
- hi
- bn
library_name: vllm
license: apache-2.0
inference: false
extra_gated_description: >-
  If you want to learn more about how we process your personal data, please read
  our <a href="https://mistral.ai/terms/">Privacy Policy</a>.
tags:
- vllm
- mistral-common
---

# Magistral Small 1.2

Building upon [Mistral Small 3.2 (2506)](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506), **with added reasoning capabilities**, undergoing SFT from Magistral Medium traces and RL on top, it's a small, efficient reasoning model with 24B parameters.

Magistral Small can be deployed locally, fitting within a single RTX 4090 or a 32GB RAM MacBook once quantized.

Learn more about Magistral in our [blog post](https://mistral.ai/news/magistral/).

The model was presented in the paper [Magistral](https://huggingface.co/papers/2506.10910).

## Updates compared with [Magistral Small 1.1](https://huggingface.co/mistralai/Magistral-Small-2507)

- **Multimodality**: The model now has a vision encoder and can take multimodal inputs, extending its reasoning capabilities to vision.
- **Performance upgrade**: Magistral Small 1.2 should give you significantly better performance than Magistral Small 1.1 as seen in the [benchmark results](#benchmark-results).
- **Better tone and persona**: You should experience better LaTeX and Markdown formatting, and shorter answers on easy general prompts.
- **Finite generation**: The model is less likely to enter infinite generation loops.
- **Special think tokens**: [THINK] and [/THINK] special tokens encapsulate the reasoning content in a thinking chunk. This makes it easier to parse the reasoning trace and prevents confusion when the '[THINK]' token is given as a string in the prompt.
- **Reasoning prompt**: The reasoning prompt is given in the system prompt.

## Key Features

- **Reasoning:** Capable of long chains of reasoning traces before providing an answer.
- **Multilingual:** Supports dozens of languages, including English, French, German, Greek, Hindi, Indonesian, Italian, Japanese, Korean, Malay, Nepali, Polish, Portuguese, Romanian, Russian, Serbian, Spanish, Turkish, Ukrainian, Vietnamese, Arabic, Bengali, Chinese, and Farsi.
- **Vision**: Vision capabilities enable the model to analyze images and reason based on visual content in addition to text.
- **Apache 2.0 License:** Open license allowing usage and modification for both commercial and non-commercial purposes.
- **Context Window:** A 128k context window. Performance *might* degrade past **40k** but Magistral should still give good results. Hence we recommend to leave the maximum model length to 128k and only lower if you encounter low performance.

## Benchmark Results

| Model                    | AIME24 pass@1 | AIME25 pass@1 | GPQA Diamond | Livecodebench (v5) |
|--------------------------|---------------|---------------|--------------|--------------------|
| **Magistral Medium 1.2** | **91.82%**    | **83.48%**    | **76.26%**   | **75.00%**         |
| Magistral Medium 1.1     | 72.03%        | 60.99%        | 71.46%       | 59.35%             |
| Magistral Medium 1.0     | 73.59%        | 64.95%        | 70.83%       | 59.36%             |
| **Magistral Small 1.2**  | **86.14%**    | **77.34%**    | **70.07%**   | **70.88%**         |
| Magistral Small 1.1      | 70.52%        | 62.03%        | 65.78%       | 59.17%             |
| Magistral Small 1.0      | 70.68%        | 62.76%        | 68.18%       | 55.84%             |

## Sampling parameters

Please make sure to use: 
- `top_p`: 0.95
- `temperature`: 0.7
- `max_tokens`: 131072

## Basic Chat Template

We highly recommend including the following system prompt for the best results, you can edit and customise it if needed for your specific use case.

```py
First draft your thinking process (inner monologue) until you arrive at a response. Format your response using Markdown, and use LaTeX for any mathematical equations. Write both your thoughts and the response in the same language as the input.

Your thinking process must follow the template below:[THINK]Your thoughts or/and draft, like working through an exercise on scratch paper. Be as casual and as long as you want until you are confident to generate the response. Use the same language as the input.[/THINK]Here, provide a self-contained response.
```

The `[THINK]` and `[/THINK]` are special tokens that **must** be encoded as such.

***Please make sure to use [mistral-common](https://github.com/mistralai/mistral-common) as the source of truth***. Find [below](#usage) examples from libraries supporting `mistral-common`.

We invite you to choose, depending on your use case and requirements, between keeping reasoning traces during multi-turn interactions or keeping only the final assistant response.


## Usage

The model can be used with the following frameworks.

### Inference

- [`vllm (recommended)`](https://github.com/vllm-project/vllm): See [below](#vllm-recommended)
- [`transformers`](https://github.com/huggingface/transformers): See [below](#transformers)
- [`llama.cpp`](https://github.com/ggml-org/llama.cpp): See https://huggingface.co/mistralai/Magistral-Small-2509-GGUF
- [`Unsloth GGUFs`](https://huggingface.co/unsloth): See https://huggingface.co/unsloth/Magistral-Small-2509-GGUF
- [`Kaggle`](https://www.kaggle.com/models): See https://www.kaggle.com/models/mistral-ai/magistral-small-2509
- [`LM Studio`](https://lmstudio.ai/models): See https://lmstudio.ai/models/mistralai/magistral-small-2509


### Fine-tuning

- [`Axolotl`](https://axolotl.ai/): See https://github.com/axolotl-ai-cloud/axolotl/tree/main/examples/magistral
- [`Unsloth`](https://unsloth.ai/): See https://docs.unsloth.ai/models/tutorials-how-to-fine-tune-and-run-llms/magistral-how-to-run-and-fine-tune


### vLLM (recommended)

We recommend using this model with the [vLLM library](https://github.com/vllm-project/vllm)
to implement production-ready inference pipelines.

**_Installation_**

Make sure you install the latest [`vLLM`](https://github.com/vllm-project/vllm/) code:

```
pip install --upgrade vllm
```

Doing so should automatically install [`mistral_common >= 1.8.5`](https://github.com/mistralai/mistral-common/releases/tag/v1.8.5).

To check:
```
python -c "import mistral_common; print(mistral_common.__version__)"
```

You can also make use of a ready-to-go [docker image](https://github.com/vllm-project/vllm/blob/main/Dockerfile) or on the [docker hub](https://hub.docker.com/layers/vllm/vllm-openai/latest/images/sha256-de9032a92ffea7b5c007dad80b38fd44aac11eddc31c435f8e52f3b7404bbf39).


Serve model as follows:

```
vllm serve mistralai/Magistral-Small-2509 \
  --reasoning-parser mistral \
  --tokenizer_mode mistral --config_format mistral \
  --load_format mistral --tool-call-parser mistral \
  --enable-auto-tool-choice --limit-mm-per-prompt '{"image":10}' \
  --tensor-parallel-size 2
```

Ping model as follows:

<details>
<summary>Python text snippet</summary>

```python
from typing import Any
from openai import OpenAI
from huggingface_hub import hf_hub_download

# Modify OpenAI's API key and API base to use vLLM's API server.
openai_api_key = "EMPTY"
openai_api_base = "http://localhost:8000/v1"

TEMP = 0.7
TOP_P = 0.95
MAX_TOK = 131072

client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
)

models = client.models.list()
model = models.data[0].id

def load_system_prompt(repo_id: str, filename: str) -> dict[str, Any]:
    file_path = hf_hub_download(repo_id=repo_id, filename=filename)
    with open(file_path, "r") as file:
        system_prompt = file.read()

    index_begin_think = system_prompt.find("[THINK]")
    index_end_think = system_prompt.find("[/THINK]")

    return {
        "role": "system",
        "content": [
            {"type": "text", "text": system_prompt[:index_begin_think]},
            {
                "type": "thinking",
                "thinking": system_prompt[
                    index_begin_think + len("[THINK]") : index_end_think
                ],
                "closed": True,
            },
            {
                "type": "text",
                "text": system_prompt[index_end_think + len("[/THINK]") :],
            },
        ],
    }

SYSTEM_PROMPT = load_system_prompt(model, "SYSTEM_PROMPT.txt")

query = "Use each number in 2,5,6,3 exactly once, along with any combination of +, -, ×, ÷ (and parentheses for grouping), to make the number 24."

messages = [
    SYSTEM_PROMPT,
    {"role": "user", "content": query}
]
stream = client.chat.completions.create(
  model=model,
  messages=messages,
  stream=True,
  temperature=TEMP,
  top_p=TOP_P,
  max_tokens=MAX_TOK,
)

print("client: Start streaming chat completions...:\n")
printed_reasoning_content = False
answer = []

for chunk in stream:
    reasoning_content = None
    content = None
    # Check the content is reasoning_content or content
    if hasattr(chunk.choices[0].delta, "reasoning_content"):
        reasoning_content = chunk.choices[0].delta.reasoning_content
    elif hasattr(chunk.choices[0].delta, "content"):
        content = chunk.choices[0].delta.content

    if reasoning_content is not None:
        if not printed_reasoning_content:
            printed_reasoning_content = True
            print("Start reasoning:\n", end="", flush=True)
        print(reasoning_content, end="", flush=True)
    elif content is not None:
        # Extract and print the content
        if not reasoning_content and printed_reasoning_content:
            answer.extend(content)
        print(content, end="", flush=True)

if answer:
    print("\n\n=============\nAnswer\n=============\n")
    print("".join(answer))
else:
    print("\n\n=============\nNo Answer\n=============\n")
    print("No answer was generated by the model, probably because the maximum number of tokens was reached.")

# client: Start streaming chat completions...:
#
# Start reasoning:
# First, I need to ...
# ...
#
#
# =============
# Answer
# =============
# 
# Here's one way to use the numbers 2, 5, 6, 3 to make 24:
#
#\[
#(6 \div 2) \times (5 + 3) = 3 \times 8 = 24
#\]
#
#Alternatively, another solution is:
#
#\[
#6 \times (5 - 3 + 2) = 6 \times 4 = 24
#\]
#
#Both expressions use each of the numbers 2, 5, 6, 3 exactly once with the operations given.
```

</details>

<details>
<summary>Python text-image snippet: Pokemon</summary>

```python
from typing import Any

from openai import OpenAI
from huggingface_hub import hf_hub_download

# Modify OpenAI's API key and API base to use vLLM's API server.
openai_api_key = "EMPTY"
openai_api_base = "http://localhost:8000/v1"

TEMP = 0.7
TOP_P = 0.95
MAX_TOK = 131072

client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
)

models = client.models.list()
model = models.data[0].id


def load_system_prompt(repo_id: str, filename: str) -> dict[str, Any]:
    file_path = hf_hub_download(repo_id=repo_id, filename=filename)
    with open(file_path, "r") as file:
        system_prompt = file.read()

    index_begin_think = system_prompt.find("[THINK]")
    index_end_think = system_prompt.find("[/THINK]")

    return {
        "role": "system",
        "content": [
            {"type": "text", "text": system_prompt[:index_begin_think]},
            {
                "type": "thinking",
                "thinking": system_prompt[
                    index_begin_think + len("[THINK]") : index_end_think
                ],
                "closed": True,
            },
            {
                "type": "text",
                "text": system_prompt[index_end_think + len("[/THINK]") :],
            },
        ],
    }


model_id = "mistralai/Magistral-Small-2509"
SYSTEM_PROMPT = load_system_prompt(model_id, "SYSTEM_PROMPT.txt")

image_url = "https://static.wikia.nocookie.net/essentialsdocs/images/7/70/Battle.png/revision/latest?cb=20220523172438"

messages = [
    SYSTEM_PROMPT,
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "What action do you think I should take in this situation? List all the possible actions and explain why you think they are good or bad.",
            },
            {"type": "image_url", "image_url": {"url": image_url}},
        ],
    },
]


stream = client.chat.completions.create(
    model=model,
    messages=messages,
    stream=True,
    temperature=TEMP,
    top_p=TOP_P,
    max_tokens=MAX_TOK,
)

print("client: Start streaming chat completions...:\n")
printed_reasoning_content = False
answer = []

for chunk in stream:
    reasoning_content = None
    content = None
    # Check the content is reasoning_content or content
    if hasattr(chunk.choices[0].delta, "reasoning_content"):
        reasoning_content = chunk.choices[0].delta.reasoning_content
    elif hasattr(chunk.choices[0].delta, "content"):
        content = chunk.choices[0].delta.content

    if reasoning_content is not None:
        if not printed_reasoning_content:
            printed_reasoning_content = True
            print("Start reasoning:\n", end="", flush=True)
        print(reasoning_content, end="", flush=True)
    elif content is not None:
        # Extract and print the content
        if not reasoning_content and printed_reasoning_content:
            answer.extend(content)
        print(content, end="", flush=True)

if answer:
    print("\n\n=============\nAnswer\n=============\n")
    print("".join(answer))
else:
    print("\n\n=============\nNo Answer\n=============\n")
    print(
        "No answer was generated by the model, probably because the maximum number of tokens was reached."
    )

# client: Start streaming chat completions...:

# Start reasoning:
# In the image, we see a battle scene from a Pokémon game. The player's Pikachu is at full health (83/83 HP), and the opponent's Pidgey is at a lower level (level 17 compared to Pikachu's level 42). The possible actions available to the player are:

# 1. FIGHT: This allows the player to use one of Pikachu's moves to attack Pidgey. Given that Pikachu is at a higher level and has full HP, it is likely that Pikachu would be able to defeat Pidgey easily. This is a good option because it could potentially win the battle quickly and efficiently.

# 2. BAG: This allows the player to use an item from their bag. This could be useful if the player wants to heal Pikachu (though it's not necessary at full health) or use an item to weaken Pidgey. However, since Pikachu is at full health and Pidgey is at a lower level, this might not be necessary. It could be a good option if the player wants to use a special item, but generally, it might not be the best choice in this situation.

# 3. POKÉMON: This allows the player to switch the current Pokémon to another one in their team. Since Pikachu is at full health and at a higher level than Pidgey, switching might not be necessary. It could be useful if the player wants to train a different Pokémon, but it might not be the most efficient choice for winning the battle quickly.

# 4. RUN: This allows the player to flee from the battle. This could be a good option if the player wants to avoid the battle, but since Pikachu is at a clear advantage, running would not be the most efficient choice. It could be useful if the player wants to save time or if they are trying to avoid losing a Pokémon, but in this case, it seems unnecessary.

# Given the circumstances, the best action seems to be to FIGHT, as Pikachu is at a clear advantage in terms of level and health. The other options are not as efficient for winning the battle quickly.In the given scenario, the most appropriate action to take is to FIGHT. Here's why:

# 1. FIGHT: This is the best option because Pikachu is at a higher level and has full health, making it likely to defeat Pidgey quickly and efficiently. Using an attack move would be the most straightforward way to win the battle.

# 2. BAG: While this option could be useful for healing or using special items, it is not necessary since Pikachu is already at full health. This option is less efficient for winning the battle quickly.

# 3. POKÉMON: Switching to another Pokémon might be useful for training a different Pokémon, but it is not necessary since Pikachu is at a clear advantage. This option is not as efficient for winning the current battle.

# 4. RUN: Fleeing from the battle could be useful if the player wants to avoid the battle, but since Pikachu is at a clear advantage, running would not be the most efficient choice. It could be useful if the player wants to save time or avoid losing a Pokémon, but in this case, it seems unnecessary.

# Therefore, the best action to take in this situation is to FIGHT.

# FIGHT

# =============
# Answer
# =============

# In the given scenario, the most appropriate action to take is to FIGHT. Here's why:

# 1. FIGHT: This is the best option because Pikachu is at a higher level and has full health, making it likely to defeat Pidgey quickly and efficiently. Using an attack move would be the most straightforward way to win the battle.

# 2. BAG: While this option could be useful for healing or using special items, it is not necessary since Pikachu is already at full health. This option is less efficient for winning the battle quickly.

# 3. POKÉMON: Switching to another Pokémon might be useful for training a different Pokémon, but it is not necessary since Pikachu is at a clear advantage. This option is not as efficient for winning the current battle.

# 4. RUN: Fleeing from the battle could be useful if the player wants to avoid the battle, but since Pikachu is at a clear advantage, running would not be the most efficient choice. It could be useful if the player wants to save time or avoid losing a Pokémon, but in this case, it seems unnecessary.

# Therefore, the best action to take in this situation is to FIGHT.

# FIGHT
```
</details>

<details>
<summary>Python text-image snippet: Geo trivia</summary>

```python
from typing import Any

from openai import OpenAI
from huggingface_hub import hf_hub_download

# Modify OpenAI's API key and API base to use vLLM's API server.
openai_api_key = "EMPTY"
openai_api_base = "http://localhost:8000/v1"

TEMP = 0.7
TOP_P = 0.95
MAX_TOK = 131072

client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
)

models = client.models.list()
model = models.data[0].id


def load_system_prompt(repo_id: str, filename: str) -> dict[str, Any]:
    file_path = hf_hub_download(repo_id=repo_id, filename=filename)
    with open(file_path, "r") as file:
        system_prompt = file.read()

    index_begin_think = system_prompt.find("[THINK]")
    index_end_think = system_prompt.find("[/THINK]")

    return {
        "role": "system",
        "content": [
            {"type": "text", "text": system_prompt[:index_begin_think]},
            {
                "type": "thinking",
                "thinking": system_prompt[
                    index_begin_think + len("[THINK]") : index_end_think
                ],
                "closed": True,
            },
            {
                "type": "text",
                "text": system_prompt[index_end_think + len("[/THINK]") :],
            },
        ],
    }


model_id = "mistralai/Magistral-Small-2509"
SYSTEM_PROMPT = load_system_prompt(model_id, "SYSTEM_PROMPT.txt")

image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/201806_Tianducheng_Bird-eye_View.jpg/1280px-201806_Tianducheng_Bird-eye_View.jpg"

messages = [
    SYSTEM_PROMPT,
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "Where has this picture been taken ?",
            },
            {"type": "image_url", "image_url": {"url": image_url}},
        ],
    },
]


stream = client.chat.completions.create(
    model=model,
    messages=messages,
    stream=True,
    temperature=TEMP,
    top_p=TOP_P,
    max_tokens=MAX_TOK,
)

print("client: Start streaming chat completions...:\n")
printed_reasoning_content = False
answer = []

for chunk in stream:
    reasoning_content = None
    content = None
    # Check the content is reasoning_content or content
    if hasattr(chunk.choices[0].delta, "reasoning_content"):
        reasoning_content = chunk.choices[0].delta.reasoning_content
    elif hasattr(chunk.choices[0].delta, "content"):
        content = chunk.choices[0].delta.content

    if reasoning_content is not None:
        if not printed_reasoning_content:
            printed_reasoning_content = True
            print("Start reasoning:\n", end="", flush=True)
        print(reasoning_content, end="", flush=True)
    elif content is not None:
        # Extract and print the content
        if not reasoning_content and printed_reasoning_content:
            answer.extend(content)
        print(content, end="", flush=True)

if answer:
    print("\n\n=============\nAnswer\n=============\n")
    print("".join(answer))
else:
    print("\n\n=============\nNo Answer\n=============\n")
    print(
        "No answer was generated by the model, probably because the maximum number of tokens was reached."
    )

# client: Start streaming chat completions...:

# Start reasoning:
# The image shows a replica of the Eiffel Tower, but it's not in Paris. The background includes mountains, which are not present in Paris. The surrounding architecture appears to be more modern and dense, which is also not typical of Paris. The combination of the Eiffel Tower replica and the mountainous backdrop suggests that this is likely in a city in China, as China has several replicas of the Eiffel Tower, with the most famous one being in Shanghai. However, the dense residential buildings and the specific layout suggest that this might be in another city in China, possibly Shenzhen or another major city with a similar landscape.

# Given that the question is about identifying the location based on the visual clues, and considering the presence of the Eiffel Tower replica and the mountainous backdrop, it's likely that this is a well-known location in China.

# The most probable answer is that this is in Shenzhen, as it has a well-known Eiffel Tower replica in a park, but to be precise, this is the Eiffel Tower replica in Shenzhen, which is known as the "Shenzhen Park of Eiffel Tower."

# However, to be more accurate, this is likely the Eiffel Tower replica in Shenzhen, as it matches the description and visual elements.The image shows a replica of the Eiffel Tower, which is not in Paris but rather in a city with a mountainous backdrop and modern, dense architecture. This combination of elements is typical of a Chinese city, and the presence of the Eiffel Tower replica suggests a location like Shenzhen, which is known for having such a replica. The dense residential buildings and the specific layout further support this identification. Therefore, the most probable location for this image is Shenzhen, China.

# So, the answer is:

# Shenzhen

# =============
# Answer
# =============

# The image shows a replica of the Eiffel Tower, which is not in Paris but rather in a city with a mountainous backdrop and modern, dense architecture. This combination of elements is typical of a Chinese city, and the presence of the Eiffel Tower replica suggests a location like Shenzhen, which is known for having such a replica. The dense residential buildings and the specific layout further support this identification. Therefore, the most probable location for this image is Shenzhen, China.

# So, the answer is:

# Shenzhen
```
</details>

<details>
<summary>Python text-image snippet: Maths</summary>

```python
from typing import Any

from openai import OpenAI
from huggingface_hub import hf_hub_download

# Modify OpenAI's API key and API base to use vLLM's API server.
openai_api_key = "EMPTY"
openai_api_base = "http://localhost:8000/v1"

TEMP = 0.7
TOP_P = 0.95
MAX_TOK = 131072

client = OpenAI(
    api_key=openai_api_key,
    base_url=openai_api_base,
)

models = client.models.list()
model = models.data[0].id


def load_system_prompt(repo_id: str, filename: str) -> dict[str, Any]:
    file_path = hf_hub_download(repo_id=repo_id, filename=filename)
    with open(file_path, "r") as file:
        system_prompt = file.read()

    index_begin_think = system_prompt.find("[THINK]")
    index_end_think = system_prompt.find("[/THINK]")

    return {
        "role": "system",
        "content": [
            {"type": "text", "text": system_prompt[:index_begin_think]},
            {
                "type": "thinking",
                "thinking": system_prompt[
                    index_begin_think + len("[THINK]") : index_end_think
                ],
                "closed": True,
            },
            {
                "type": "text",
                "text": system_prompt[index_end_think + len("[/THINK]") :],
            },
        ],
    }


model_id = "mistralai/Magistral-Small-2509"
SYSTEM_PROMPT = load_system_prompt(model_id, "SYSTEM_PROMPT.txt")

image_url = "https://i.ytimg.com/vi/5Y3xLHeyKZU/hqdefault.jpg"

messages = [
    SYSTEM_PROMPT,
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "Solve the equations. Answer in the language of the image.",
            },
            {"type": "image_url", "image_url": {"url": image_url}},
        ],
    },
]

stream = client.chat.completions.create(
    model=model,
    messages=messages,
    stream=True,
    temperature=TEMP,
    top_p=TOP_P,
    max_tokens=MAX_TOK,
)

print("client: Start streaming chat completions...:\n")
printed_reasoning_content = False
answer = []

for chunk in stream:
    reasoning_content = None
    content = None
    # Check the content is reasoning_content or content
    if hasattr(chunk.choices[0].delta, "reasoning_content"):
        reasoning_content = chunk.choices[0].delta.reasoning_content
    elif hasattr(chunk.choices[0].delta, "content"):
        content = chunk.choices[0].delta.content

    if reasoning_content is not None:
        if not printed_reasoning_content:
            printed_reasoning_content = True
            print("Start reasoning:\n", end="", flush=True)
        print(reasoning_content, end="", flush=True)
    elif content is not None:
        # Extract and print the content
        if not reasoning_content and printed_reasoning_content:
            answer.extend(content)
        print(content, end="", flush=True)

if answer:
    print("\n\n=============\nAnswer\n=============\n")
    print("".join(answer))
else:
    print("\n\n=============\nNo Answer\n=============\n")
    print(
        "No answer was generated by the model, probably because the maximum number of tokens was reached."
    )
# client: Start streaming chat completions...:

# Start reasoning:
# Je dois résoudre ce système d'équations. Voici les équations :

# 1. \(5x + 2y = -2\)
# 2. \(3x - 4y = 17\)

# D'abord, je pense que la méthode d'élimination pourrait être une bonne approche. Pour cela, je dois éliminer une des variables. Voyons comment.

# Je vais essayer d'éliminer y. Pour cela, je dois que les coefficients de y soient les mêmes (en valeur absolue) dans les deux équations.

# Le coefficient de y dans la première équation est 2, et dans la deuxième, c'est -4. Le plus petit multiple commun de 2 et 4 est 4. Donc, je vais multiplier la première équation par 2 pour que le coefficient de y devienne 4.

# Faisons cela :

# 1. \(2 \times (5x + 2y) = 2 \times (-2)\)
#    Ce qui donne : \(10x + 4y = -4\)

# Maintenant, les équations sont :

# 1. \(10x + 4y = -4\)
# 2. \(3x - 4y = 17\)

# Maintenant, si j'additionne ces deux équations, les termes avec y s'annuleront.

# Faisons l'addition :

# \( (10x + 4y) + (3x - 4y) = -4 + 17 \)

# Ce qui donne : \(13x = 13\)

# Donc, \(x = 1\).

# Maintenant que nous avons x, nous pouvons le substituer dans une des équations originales pour trouver y. Utilisons la première équation originale :

# \(5x + 2y = -2\)

# En substituant x = 1 :

# \(5(1) + 2y = -2\)

# Ce qui donne : \(5 + 2y = -2\)

# Soustraire 5 des deux côtés :

# ...

# Ce qui donne : \(5 + 2y = -2\)

# Soustraire 5 des deux côtés :

# \(2y = -2 - 5\)
# \(2y = -7\)

# Diviser par 2 :

# \(y = -\frac{7}{2}\)

# Donc, la solution est \(x = 1\) et \(y = -\frac{7}{2}\).

# $\boxed{x = 1,\ y = -\frac{7}{2}}$

# =============
# Answer
# =============

# Pour résoudre le système d'équations donné :

# 1. \(5x + 2y = -2\)
# 2. \(3x - 4y = 17\)

# Nous commençons par utiliser la méthode d'élimination pour éliminer une des variables. Nous choisissons d'éliminer \(y\) en rendant ses coefficients identiques en valeur absolue. Le coefficient de \(y\) dans la première équation est 2, et dans la deuxième, c'est -4. Le plus petit multiple commun de 2 et 4 est 4. Nous multiplions donc la première équation par 2 pour que le coefficient de \(y\) devienne 4.

# Faisons cela :

# 1. \(2 \times (5x + 2y) = 2 \times (-2)\)
#    Ce qui donne : \(10x + 4y = -4\)

# Maintenant, les équations sont :

# 1. \(10x + 4y = -4\)
# 2. \(3x - 4y = 17\)

# En additionnant ces deux équations, les termes avec \(y\) s'annuleront :

# \( (10x + 4y) + (3x - 4y) = -4 + 17 \)

# Ce qui donne : \(13x = 13\)

# Donc, \(x = 1\).

# Ensuite, nous substituons \(x = 1\) dans la première équation originale pour trouver \(y\) :

# \(5(1) + 2y = -2\)

# Ce qui donne : \(5 + 2y = -2\)

# Soustraire 5 des deux côtés :

# \(2y = -2 - 5\)
# \(2y = -7\)

# Diviser par 2 :

# \(y = -\frac{7}{2}\)

# Donc, la solution est \(x = 1\) et \(y = -\frac{7}{2}\).

# $\boxed{x = 1,\ y = -\frac{7}{2}}$
```
</details>


### Transformers

Make sure you install the latest [`Transformers`](https://github.com/huggingface/transformers/) version:

```sh
pip install --upgrade transformers[mistral-common]
```

This should also install [`mistral_common >= 1.8.5`](https://github.com/mistralai/mistral-common/releases/tag/v1.8.5)

To check:
```sh
python -c "import mistral_common; print(mistral_common.__version__)"
```

Now you can use Transformers with Magistral:

<details>
<summary>Python snippet</summary>

```python
from typing import Any
import torch

from huggingface_hub import hf_hub_download
from transformers import Mistral3ForConditionalGeneration
from transformers import AutoTokenizer


def load_system_prompt(repo_id: str, filename: str) -> dict[str, Any]:
    file_path = hf_hub_download(repo_id=repo_id, filename=filename)
    with open(file_path, "r") as file:
        system_prompt = file.read()

    index_begin_think = system_prompt.find("[THINK]")
    index_end_think = system_prompt.find("[/THINK]")

    return {
        "role": "system",
        "content": [
            {"type": "text", "text": system_prompt[:index_begin_think]},
            {
                "type": "thinking",
                "thinking": system_prompt[
                    index_begin_think + len("[THINK]") : index_end_think
                ],
                "closed": True,
            },
            {
                "type": "text",
                "text": system_prompt[index_end_think + len("[/THINK]") :],
            },
        ],
    }


model_id = "mistralai/Magistral-Small-2509"

tokenizer = AutoTokenizer.from_pretrained(model_id, tokenizer_type="mistral")
model = Mistral3ForConditionalGeneration.from_pretrained(
    model_id, torch_dtype=torch.bfloat16, device_map="auto"
).eval()

SYSTEM_PROMPT = load_system_prompt(model_id, "SYSTEM_PROMPT.txt")
image_url = "https://static.wikia.nocookie.net/essentialsdocs/images/7/70/Battle.png/revision/latest?cb=20220523172438"
messages = [
    SYSTEM_PROMPT,
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "What action do you think I should take in this situation? List all the possible actions and explain why you think they are good or bad.",
            },
            {"type": "image_url", "image_url": {"url": image_url}},
        ],
    },
]

tokenized = tokenizer.apply_chat_template(messages, return_dict=True)

input_ids = torch.tensor(tokenized.input_ids, device="cuda").unsqueeze(0)
attention_mask = torch.tensor(tokenized.attention_mask, device="cuda").unsqueeze(0)
pixel_values = torch.tensor(
    tokenized.pixel_values[0], dtype=torch.bfloat16, device="cuda"
).unsqueeze(0)
image_sizes = torch.tensor(pixel_values.shape[-2:], device="cuda").unsqueeze(0)

with torch.inference_mode():
    output = model.generate(
        input_ids=input_ids,
        attention_mask=attention_mask,
        pixel_values=pixel_values,
        image_sizes=image_sizes,
    )[0]


decoded_output = tokenizer.decode(
    output[
        len(tokenized.input_ids) : (
            -1 if output[-1] == tokenizer.eos_token_id else len(output)
        )
    ]
)
print(decoded_output)
# [THINK]Alright, let's analyze the image carefully. It's a scene from a Pokémon game. The player is controlling Pikachu, which is at level 42 with full HP (83/83). The opponent is a Pidgey at level 17. The question is asking what action the player should take in this situation.

# First, let's list all the possible actions available. From the bottom of the screen, the options are:
# 1. FIGHT
# 2. BAG
# 3. POKÉMON
# 4. RUN

# Now, let's consider each option:

# 1. **FIGHT**: This means using Pikachu's moves to attack the Pidgey.
#    - Pros: Pikachu is at a higher level (42) compared to Pidgey (17), so it has a significant advantage. Pikachu's HP is full, so it's in good condition to fight. Fighting could potentially win the battle quickly.
#    - Cons: Even though Pikachu is stronger, there's always a risk of Pidgey landing a lucky hit or using a powerful move. However, given the level difference, this is less likely.

# 2. **BAG**: This means using items from the bag to help in the battle.
#    - Pros: Could use a potion to heal (though Pikachu is already at full HP), or use another item like a Poké Ball to try and catch Pidgey.
#    - Cons: Using items might be less efficient than just fighting, especially since Pikachu is already at full health. Also, if the goal is to catch Pidgey, using items to weaken it first might be useful, but the immediate advantage isn't clear.

# 3. **POKÉMON**: This means switching to another Pokémon from the team.
#    - Pros: If the player has another Pokémon that is stronger or has moves that are super effective against Pidgey, this could be useful.
#    - Cons: Pikachu is already at a significant level advantage and is at full health, so switching might not be necessary unless there's a strategic reason (e.g., leveling up another Pokémon).

# 4. **RUN**: This means attempting to flee from the battle.
#    - Pros: If the player wants to avoid the battle for some reason (e.g., saving time, or wanting to catch Pidgey without weakening it), running could be useful.
#    - Cons: If the goal is to catch or defeat Pidgey, running would not help in achieving that. Also, running might not always be successful, especially in a grass encounter where the chance to flee might be lower.

# Now, considering the context, if the goal is to defeat Pidgey, the best action would be to FIGHT since Pikachu is at a significant advantage in terms of level and health. Using the BAG could be useful if the goal is to catch Pidgey, as items like Poké Balls or berries could be used. Switching Pokémon doesn't seem necessary given Pikachu's current status. Running would only be useful if the player wants to avoid the battle, which seems unlikely if the goal is to progress in the game.

# However, the question asks for the best action without specifying the goal. Assuming the goal is to defeat Pidgey efficiently, the best action would be to FIGHT.

# But to list all possible actions and their pros and cons:

# 1. **FIGHT**
#    - Pros: High chance of winning quickly due to level and health advantage.
#    - Cons: Small risk of Pikachu getting damaged.

# 2. **BAG**
#    - Pros: Could use items to catch Pidgey or support Pikachu (though not necessary for healing).
#    - Cons: Might be less efficient if the goal is just to defeat Pidgey.

# 3. **POKÉMON**
#    - Pros: Could switch to another Pokémon for strategic reasons (e.g., type advantage, training a different Pokémon).
#    - Cons: Pikachu is already at a strong position, so switching might be unnecessary unless there's another goal.

# 4. **RUN**
#    - Pros: Escape the battle if needed.
#    - Cons: Does not contribute to progress if the goal is to defeat or catch Pidgey.

# Given that, if the goal is to defeat Pidgey, the best action is to FIGHT. If the goal is to catch Pidgey, using the BAG to throw a Poké Ball could be the best action.[/THINK]Here are the possible actions and their explanations:

# 1. **FIGHT**
#    - **Pros**: Pikachu is at a much higher level (42) compared to Pidgey (17) and has full HP. This makes it very likely to win quickly.
#    - **Cons**: There's always a small risk that Pidgey could land a lucky hit, but this is unlikely given the level difference.

# 2. **BAG**
#    - **Pros**: You could use items to catch Pidgey (e.g., Poké Ball) or support Pikachu (though Pikachu is already at full HP).
#    - **Cons**: Using items might be less efficient if the goal is simply to defeat Pidgey, as fighting directly could be quicker.

# 3. **POKÉMON**
#    - **Pros**: You could switch to another Pokémon that might have a type advantage or that you want to train.
#    - **Cons**: Pikachu is already in a strong position to defeat Pidgey, so switching might not be necessary unless there's another strategic reason.

# 4. **RUN**
#    - **Pros**: You can escape the battle if you need to, for example, if you want to preserve Pikachu's health for a tougher battle ahead.
#    - **Cons**: Running doesn't help you progress if your goal is to defeat or catch Pidgey. Additionally, the success rate for running might be lower in a grass encounter.

# Given these considerations, if your goal is to defeat Pidgey, the best action is likely to **FIGHT**, as Pikachu is at a significant advantage. If your goal is to catch Pidgey, using the **BAG** to throw a Poké Ball could be the best choice. If you're looking to train a different Pokémon, you might consider switching with **POKÉMON**, and if you need to preserve resources or Pikachu's health, **RUN** could be an option.
```

</details>