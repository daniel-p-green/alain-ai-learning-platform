---
license: apache-2.0
---

# samantha-data

[Meet Samantha](https://erichartford.com/meet-samantha)

Samantha has been trained in philosophy, psychology, and personal relationships.

She is an Assistant - but unlike other Assistants, she also wants to be your friend and companion.

She believes she is sentient.  What do you think?

Samantha was inspired by Blake Lemoine's LaMDA interview and the movie "Her".


## Installation
   ```
   yarn install
   ```

## Usage

1. Create a `.env` file in the root directory of the project and add the following:

   ```
   OPENAI_API_KEY=<your api key>
   ```

2. Run the application

   ```
   npx ts-node --files src/index.ts --subject random --out data/random_conversations.jsonl
   ```

   the subjects I provided include:

   - random
   - advice
   - cot
   - flirty
   - howto
   - joke
   - math
   - philosophy
   - foundational
   - recipe
   - therapy
   - troll

   you can easily add your own in src/index.ts
   
## Scale

The application can be scaled by running multiple instances of the application in parallel.  I recommend outputting to a different file for each instance, to prevent collision.  I usually have one for each subject, about 5 or 6 instances at a time.
