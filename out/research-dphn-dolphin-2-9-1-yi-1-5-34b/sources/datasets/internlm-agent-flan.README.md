---
configs:
- config_name: default
  data_files:
  - split: agent_instruct_react
    path: data/agent_instruct_react.jsonl
  - split: agent_instruct_tflan
    path: data/agent_instruct_tflan.jsonl
  - split: toolbench_instruct_j1s1_3k
    path: data/toolbench_instruct_j1s1_3k.jsonl
  - split: toolbench_negative
    path: data/toolbench_negative.jsonl
  - split: toolbench_react_10p
    path: data/toolbench_react_10p.jsonl
  - split: toolbench_tflan_60p_r10r5u7
    path: data/toolbench_tflan_60p_r10r5u7.jsonl
  - split: toolbench_tflan_cot_30p
    path: data/toolbench_tflan_cot_30p.jsonl
dataset_info:
  features:
  - name: conversation
    list:
    - name: role
      dtype: string
    - name: content
      dtype: string
    - name: loss
      dtype: bool
  - name: id
    dtype: string
license: apache-2.0
tags:
- agent
pretty_name: AgentFLAN
---

# Agent-FLAN: Designing Data and Methods of Effective Agent Tuning for Large Language Models

This page holds the dataset proposed in Agent-FLAN, which consists of AgentInstruct, Toolbench, and customized negative agent samples as its source datasets.

## ✨ Introduction  

[[🤗 HuggingFace](https://huggingface.co/internlm/Agent-FLAN-7b)]
[[📃 Paper](https://arxiv.org/abs/2403.12881)]
[[🌐 Project Page](https://internlm.github.io/Agent-FLAN/)]

> Open-sourced Large Language Models (LLMs) have achieved great success in various NLP tasks, however, they are still far inferior to API-based models when acting as agents. How to integrate agent ability into general LLMs becomes a crucial and urgent problem. This paper first delivers three key observations: (1) the current agent training corpus is entangled with both formats following and agent reasoning, which significantly shifts from the distribution of its pre-training data; (2) LLMs exhibit different learning speeds on the capabilities required by agent tasks; and (3) current approaches have side-effects when improving agent abilities by introducing hallucinations. Based on the above findings, we propose Agent-FLAN to effectively Fine-tune LANguage models for Agents. Through careful decomposition and redesign of the training corpus, Agent-FLAN enables Llama2-7B to outperform prior best works by 3.5% across various agent evaluation datasets. With comprehensively constructed negative samples, Agent-FLAN greatly alleviates the hallucination issues based on our established evaluation benchmark. Besides, it consistently improves the agent capability of LLMs when scaling model sizes while slightly enhancing the general capability of LLMs.

## ♟️ Agent-FLAN

Agent-FLAN series are finetuned on AgentInstruct and Toolbench by applying the data generation pipeline proposed in Agent-FLAN paper, which holds strong abilities on various agent tasks and tool utilization~

### 🤗 HuggingFace Dataset

Agent-FLAN is produced by mixed training on AgentInstruct, ToolBench, and ShareGPT datasets from the Llama2-chat series.

The models follow the conversation format of Llama-2-chat, with the template protocol as:
```python
dict(role='user', begin='<|Human|>െ', end='\n '),
dict(role='system', begin='<|Human|>െ', end='\n '),
dict(role='assistant', begin='<|Assistant|>െ', end='ി\n '),
```

## ❤️ Acknowledgements

Agent-FLAN is built with [Lagent](https://github.com/InternLM/lagent) and [T-Eval](https://github.com/open-compass/t-eval). Thanks for their awesome work!

## 🖊️ Citation

If you find this project useful in your research, please consider citing:
```
@article{chen2024agent,
  title={Agent-FLAN: Designing Data and Methods of Effective Agent Tuning for Large Language Models},
  author={Chen, Zehui and Liu, Kuikun and Wang, Qiuchen and Liu, Jiangning and Zhang, Wenwei and Lin, Dahua and Chen, Kai and Zhao, Feng},
  journal={arXiv preprint arXiv:2403.12881},
  year={2024}
}
```

## 💳 License

This project is released under the Apache 2.0 [license](./LICENSE).