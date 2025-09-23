---
license: mit
task_categories:
- conversational
- text-generation
language:
- en
size_categories:
- 1M<n<10M
pretty_name: UltraChat
---

# Dataset Card for Dataset Name

## Dataset Description

An open-source, large-scale, and multi-round dialogue data powered by Turbo APIs. In consideration of factors such as safeguarding privacy, **we do not directly use any data available on the Internet as prompts**.
To ensure generation quality, two separate ChatGPT Turbo APIs are adopted in generation, where one plays the role of the user to generate queries and the other generates the response. 
We instruct the user model with carefully designed prompts to mimic human user behavior and call the two APIs iteratively. The generated dialogues undergo further post-processing and filtering.
ULtraChat is composed of three sectors:

- 🌏 **Questions about the World**: The dialogue data in this sector is derived from a wide range of inquiries related to concepts, entities, and objects from the real world. The topics covered are extensive, spanning areas such as technology, art, and entrepreneurship.
- ✍🏻 **Writing and Creation**: The dialogue data in this sector is driven by the demands for writing/creation from scratch, and encompasses any tasks that an AI assistant may aid within the creative process, spanning from email composition to crafting narratives and plays, and beyond.
- 📋 **Assistance on Existent Materials**: The dialogue data in this sector is generated based on existing materials, including but not limited to rewriting, continuation, summarization, and inference, covering a diverse range of topics.

- Repository: [UltraChat](https://github.com/thunlp/UltraChat)
- Explorer: [plain-explorer](http://39.101.77.220/), [Nomic-AI-Atlas-Explorer](https://atlas.nomic.ai/map/0ce65783-c3a9-40b5-895d-384933f50081/a7b46301-022f-45d8-bbf4-98107eabdbac)

## Dataset Structure

Each line in the downloaded data file is a json dict containing the data id and dialogue data in a list format. Below is an example line.

```
{
  "id": "0", 
  "data": [
    "How can cross training benefit groups like runners, swimmers, or weightlifters?", 
    "Cross training can benefit groups like runners, swimmers, or weightlifters in the following ways: ...", 
    "That makes sense. I've been wanting to improve my running time, but I never thought about incorporating strength training. Do you have any recommendations for specific exercises?", 
    "Sure, here are some strength training exercises that can benefit runners: ...", 
    "Hmm, I'm not really a fan of weightlifting though. Can I incorporate other forms of exercise into my routine to improve my running time?", 
    "Yes, absolutely! ...",
    "..."
    ]
}
```


### Citation Information

```bibtex
@article{ding2023enhancing,
  title={Enhancing Chat Language Models by Scaling High-quality Instructional Conversations},
  author={Ding, Ning and Chen, Yulin and Xu, Bokai and Qin, Yujia and Zheng, Zhi and Hu, Shengding and Liu, Zhiyuan and Sun, Maosong and Zhou, Bowen},
  journal={arXiv preprint arXiv:2305.14233},
  year={2023}
}
```