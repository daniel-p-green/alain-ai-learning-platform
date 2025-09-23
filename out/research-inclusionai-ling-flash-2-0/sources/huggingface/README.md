---
license: mit
base_model:
  - inclusionAI/Ling-flash-base-2.0
pipeline_tag: text-generation
library_name: transformers
---

<p align="center">
    <img src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*4QxcQrBlTiAAAAAAQXAAAAgAemJ7AQ/original" width="100"/>
<p>

<p align="center">🤗 <a href="https://huggingface.co/inclusionAI">Hugging Face</a>&nbsp&nbsp | &nbsp&nbsp🤖 <a href="https://modelscope.cn/organization/inclusionAI">ModelScope</a>&nbsp&nbsp | &nbsp&nbsp🐙 <a href="https://zenmux.ai/inclusionai/ling-flash-2.0">ChatNow</a></p>

## Introduction

Today, **Ling-flash-2.0** is officially open-sourced! 🚀
Following the release of the **language model [Ling-mini-2.0](https://huggingface.co/inclusionAI/Ling-mini-2.0)** and the **thinking model [Ring-mini-2.0](https://huggingface.co/inclusionAI/Ring-mini-2.0)**, we are now open-sourcing the third MoE LLM under the **Ling 2.0 architecture: Ling-flash-2.0**, a language model with **100B total parameters** and **6.1B activated parameters (4.8B non-embedding)**.
Trained on **20T+ tokens of high-quality data**, together with **supervised fine-tuning** and **multi-stage reinforcement learning**, Ling-flash-2.0 achieves **SOTA performance among dense models under 40B parameters**, despite activating only ~6B parameters. Compared to MoE models with larger activation/total parameters, it also demonstrates strong competitiveness. Notably, it delivers outstanding performance in **complex reasoning, code generation, and frontend development**.

### Powerful Complex Reasoning Abilities

We conducted a comprehensive evaluation of Ling-flash-2.0’s reasoning capabilities, reporting strong results on representative benchmarks:

- **Multi-disciplinary knowledge reasoning**: GPQA-Diamond, MMLU-Pro
- **Advanced mathematical reasoning**: AIME 2025, Omni-MATH, OptMATH (advanced mathematical optimization tasks)
- **Challenging code generation**: LiveCodeBench v6, CodeForces-Elo
- **Logical reasoning**: KOR-Bench, ARC-Prize
- **Key regulated industries (Finance, Healthcare)**: FinanceReasoning, HealthBench

Compared with **dense models under 40B** (e.g., Qwen3-32B-Non-Thinking, Seed-OSS-36B-Instruct (think budget=0)) and **larger-activation/total-parameter MoE models** (e.g., Hunyuan-A13B-Instruct, GPT-OSS-120B/low), **Ling-flash-2.0** demonstrates stronger complex reasoning power. Moreover, it shows high competitiveness on **creative tasks** (Creative Writing v3).

<p align="center">
    <img src="https://mdn.alipayobjects.com/huamei_fi95qp/afts/img/zxAvQ7QtrAwAAAAAQqAAAAgADkZ7AQFr/fmt.webp"/>
<p>

<p align="center">
    <img src="https://mdn.alipayobjects.com/huamei_fi95qp/afts/img/qQ_sTqrxiesAAAAAQuAAAAgADkZ7AQFr/original"/>
<p>

### Efficient Architecture, High-Speed Inference

<p align="center">
    <img src="https://mdn.alipayobjects.com/huamei_fi95qp/afts/img/fMdiQZqYKSAAAAAAVdAAAAgADkZ7AQFr/fmt.avif"/>
<p>

Guided by [Ling Scaling Laws](https://arxiv.org/abs/2507.17702), Ling 2.0 adopts a **1/32 activation-ratio MoE architecture**, optimized across multiple design choices: expert granularity, shared-expert ratio, attention balance, **aux-loss-free + sigmoid routing strategy**, MTP layers, QK-Norm, Partial-RoPE, and more. These refinements enable **small-activation MoE** models to achieve **7× efficiency gains** over equivalent dense architectures.
In other words, with just **6.1B activated parameters (4.8B non-embedding)**, **Ling-flash-2.0** can match the performance of ~40B dense models. Thanks to its small activation size, it also delivers major inference speed advantages:

- On **H20 hardware**, Ling-flash-2.0 achieves **200+ tokens/s**, offering **3× speedups** compared to 36B dense models in everyday use.
- With **YaRN extrapolation**, it supports **128K context length**, and as output length grows, its relative speedup can reach **7× or more**.

<p align="center">
    <img src="https://mdn.alipayobjects.com/huamei_fi95qp/afts/img/oR9UTY7S0QgAAAAAgKAAAAgADkZ7AQFr/original"/>
<p>

<p align="center">
    <img src="https://mdn.alipayobjects.com/huamei_fi95qp/afts/img/Hid1RrgsCUAAAAAAQYAAAAgADkZ7AQFr/fmt.webp"/>
<p>

## Model Downloads

You can download the following table to see the various stage of Ling-flash-2.0 models. If you are located in mainland China, we also provide the model on ModelScope.cn to speed up the download process.

<center>

|      **Model**      | **Context Length** |                                                                          **Download**                                                                          |
| :-----------------: | :----------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| Ling-flash-base-2.0 | 32K -> 128K (YaRN) | [🤗 HuggingFace](https://huggingface.co/inclusionAI/Ling-flash-base-2.0) <br>[🤖 ModelScope](https://www.modelscope.cn/models/inclusionAI/Ling-flash-base-2.0) |
|   Ling-flash-2.0    | 32K -> 128K (YaRN) |      [🤗 HuggingFace](https://huggingface.co/inclusionAI/Ling-flash-2.0) <br>[🤖 ModelScope](https://www.modelscope.cn/models/inclusionAI/Ling-flash-2.0)      |

</center>

Note: If you are interested in previous version, please visit the past model collections in [Huggingface](https://huggingface.co/inclusionAI) or [ModelScope](https://modelscope.cn/organization/inclusionAI).

## Quickstart

### 🚀 Try Online

You can experience Ling-flash-2.0 online at: [ZenMux](https://zenmux.ai/inclusionai/ling-flash-2.0)

### 🔌 API Usage

You can also use Ling-flash-2.0 through API calls:

```python
from openai import OpenAI

# 1. Initialize the OpenAI client
client = OpenAI(
    # 2. Point the base URL to the ZenMux endpoint
    base_url="https://zenmux.ai/api/v1",
    # 3. Replace with the API Key from your ZenMux user console
    api_key="<your ZENMUX_API_KEY>",
)

# 4. Make a request
completion = client.chat.completions.create(
    # 5. Specify the model to use in the format "provider/model-name"
    model="inclusionai/ling-flash-2.0",
    messages=[
        {
            "role": "user",
            "content": "What is the meaning of life?"
        }
    ]
)

print(completion.choices[0].message.content)
```

### 🤗 Hugging Face Transformers

Here is a code snippet to show you how to use the chat model with `transformers`:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "inclusionAI/Ling-flash-2.0"

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    dtype="auto",
    device_map="auto",
    trust_remote_code=True,
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

prompt = "Give me a short introduction to large language models."
messages = [
    {"role": "system", "content": "You are Ling, an assistant created by inclusionAI"},
    {"role": "user", "content": prompt}
]
text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True
)
model_inputs = tokenizer([text], return_tensors="pt", return_token_type_ids=False).to(model.device)

generated_ids = model.generate(
    **model_inputs,
    max_new_tokens=512
)
generated_ids = [
    output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
]

response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
```

### 🤖 ModelScope

If you're in mainland China, we strongly recommend you to use our model from 🤖 <a href="https://modelscope.cn/organization/inclusionAI">ModelScope</a>.

## Deployment

### vLLM

vLLM supports offline batched inference or launching an OpenAI-Compatible API Service for online inference.

#### Environment Preparation

Since the Pull Request (PR) has not been submitted to the vLLM community at this stage, please prepare the environment by following the steps below:

```bash
git clone -b v0.10.0 https://github.com/vllm-project/vllm.git
cd vllm
wget https://raw.githubusercontent.com/inclusionAI/Ling-V2/refs/heads/main/inference/vllm/bailing_moe_v2.patch
git apply bailing_moe_v2.patch
pip install -e .
```

#### Offline Inference:

```python
from transformers import AutoTokenizer
from vllm import LLM, SamplingParams

tokenizer = AutoTokenizer.from_pretrained("inclusionAI/Ling-flash-2.0")

sampling_params = SamplingParams(temperature=0.7, top_p=0.8, repetition_penalty=1.05, max_tokens=16384)

llm = LLM(model="inclusionAI/Ling-flash-2.0", dtype='bfloat16')
prompt = "Give me a short introduction to large language models."
messages = [
    {"role": "system", "content": "You are Ling, an assistant created by inclusionAI"},
    {"role": "user", "content": prompt}
]

text = tokenizer.apply_chat_template(
    messages,
    tokenize=False,
    add_generation_prompt=True
)
outputs = llm.generate([text], sampling_params)

```

#### Online Inference:

```bash
vllm serve inclusionAI/Ling-flash-2.0 \
              --tensor-parallel-size 2 \
              --pipeline-parallel-size 1 \
              --use-v2-block-manager \
              --gpu-memory-utilization 0.90
```

To handle long context in vLLM using YaRN, we need to follow these two steps:

1. Add a `rope_scaling` field to the model's `config.json` file, for example:

```json
{
  ...,
  "rope_scaling": {
    "factor": 4.0,
    "original_max_position_embeddings": 32768,
    "type": "yarn"
  }
}
```

2. Use an additional parameter `--max-model-len` to specify the desired maximum context length when starting the vLLM service.

For detailed guidance, please refer to the vLLM [`instructions`](https://docs.vllm.ai/en/latest/).

### SGLang

#### Environment Preparation

We will later submit our model to SGLang official release, now we can prepare the environment following steps:

```shell
pip3 install sglang==0.5.2rc0 sgl-kernel==0.3.7.post1
```

You can use docker image as well:

```shell
docker pull lmsysorg/sglang:v0.5.2rc0-cu126
```

Then you should apply patch to sglang installation:

```shell
# patch command is needed, run `yum install -y patch` if needed
patch -d `python -c 'import sglang;import os; print(os.path.dirname(sglang.__file__))'` -p3 < inference/sglang/bailing_moe_v2.patch
```

#### Run Inference

BF16 and FP8 models are supported by SGLang now, it depends on the dtype of the model in ${MODEL_PATH}. They both share the same command in the following:

- Start server:

```shell
python -m sglang.launch_server \
    --model-path $MODLE_PATH \
    --host 0.0.0.0 --port $PORT \
    --trust-remote-code \
    --attention-backend fa3
```

MTP is supported for base model, and not yet for chat model. You can add parameter `--speculative-algorithm NEXTN`
to start command.

- Client:

```shell
curl -s http://localhost:${PORT}/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "auto", "messages": [{"role": "user", "content": "What is the capital of France?"}]}'
```

More usage can be found [here](https://docs.sglang.ai/basic_usage/send_request.html)

### Finetuning

We recommend you to use [Llama-Factory](https://github.com/hiyouga/LLaMA-Factory) to [finetune Ling](https://github.com/inclusionAI/Ling-V2/blob/main/docs/llamafactory_finetuning.md).

## License

This code repository is licensed under [the MIT License](https://github.com/inclusionAI/Ling-V2/blob/master/LICENCE).
