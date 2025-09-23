---
dataset_info:
  features:
  - name: system_message
    dtype: string
  - name: function_description
    dtype: string
  - name: conversations
    list:
    - name: from
      dtype: string
    - name: value
      dtype: string
  splits:
  - name: train
    num_bytes: 311913135
    num_examples: 112960
  download_size: 107035875
  dataset_size: 311913135
configs:
- config_name: default
  data_files:
  - split: train
    path: data/train-*
license: apache-2.0
---
# Dataset Card for "function-calling-chatml"

Converted glaiveai/Glaive-function-calling-v2 to chatml format. 

## Example entry
```
[ { "from": "system", "value": "You are a helpful assistant with access to the following functions. Use them if required -{\n \"name\": \"create_contact\",\n \"description\": \"Create a new contact\",\n \"parameters\": {\n \"type\": \"object\",\n \"properties\": {\n \"name\": {\n \"type\": \"string\",\n \"description\": \"The name of the contact\"\n },\n \"email\": {\n \"type\": \"string\",\n \"description\": \"The email address of the contact\"\n }\n },\n \"required\": [\n \"name\",\n \"email\"\n ]\n }\n}" }, { "from": "human", "value": "I need to create a new contact for my friend John Doe. His email is johndoe@example.com." }, { "from": "function-call", "value": "{\"name\": \"create_contact\", \"arguments\": '{\"name\": \"John Doe\", \"email\": \"johndoe@example.com\"}'}" }, { "from": "function-response", "value": "{\"status\": \"success\", \"message\": \"Contact for John Doe with email johndoe@example.com has been created successfully.\"}" }, { "from": "gpt", "value": "I have successfully created a new contact for your friend John Doe with the email johndoe@example.com." } ]
```