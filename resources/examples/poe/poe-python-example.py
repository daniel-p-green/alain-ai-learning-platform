#!/usr/bin/env python3
"""
ALAIn Poe Integration Examples using different approaches
"""

import os
import asyncio
from typing import List, Dict, Any

# Example 1: Using fastapi-poe (Python SDK) - RECOMMENDED for Python
def poe_sdk_example():
    """Using the official fastapi-poe SDK"""
    import fastapi_poe as fp

    api_key = os.getenv("POE_API_KEY")
    if not api_key:
        raise ValueError("POE_API_KEY environment variable not set")

    # Create a message
    message = fp.ProtocolMessage(role="user", content="Hello! Can you explain what Poe is?")

    print("🔄 Getting response from Poe using Python SDK...")
    try:
        for partial in fp.get_bot_response_sync(
            messages=[message],
            bot_name="GPT-4o",  # or "Claude-3.5-Sonnet", "Gemini-1.5-Pro", etc.
            api_key=api_key
        ):
            print(partial, end="", flush=True)
        print("\n✅ Success!")
    except Exception as e:
        print(f"❌ Error: {e}")

# Example 2: Using OpenAI SDK with Poe endpoint
def poe_openai_sdk_example():
    """Using OpenAI SDK configured for Poe API"""
    from openai import OpenAI

    api_key = os.getenv("POE_API_KEY")
    if not api_key:
        raise ValueError("POE_API_KEY environment variable not set")

    # Configure OpenAI client for Poe
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.poe.com/v1"  # Poe's OpenAI-compatible endpoint
    )

    print("🔄 Getting response from Poe using OpenAI SDK...")
    try:
        response = client.chat.completions.create(
            model="GPT-4o",  # Poe model names
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": "Explain the difference between GPT and Claude models."}
            ],
            temperature=0.7,
            max_tokens=500,
            stream=False
        )

        print(response.choices[0].message.content)
        print("✅ Success!")

    except Exception as e:
        print(f"❌ Error: {e}")

# Example 3: cURL approach (for reference/testing)
def curl_example():
    """cURL command for testing Poe API"""
    api_key = os.getenv("POE_API_KEY")
    if not api_key:
        print("❌ POE_API_KEY environment variable not set")
        return

    curl_command = f'''
curl -X POST "https://api.poe.com/v1/chat/completions" \\
  -H "Authorization: Bearer {api_key}" \\
  -H "Content-Type: application/json" \\
  -d '{{
    "model": "GPT-4o",
    "messages": [
      {{
        "role": "user",
        "content": "Hello from ALAIn platform!"
      }}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }}'
'''

    print("📋 cURL command for testing:")
    print(curl_command)
    print("\n💡 Run this in your terminal to test the Poe API directly")

# Example 4: Streaming with fastapi-poe
async def poe_streaming_example():
    """Streaming example using fastapi-poe"""
    import fastapi_poe as fp

    api_key = os.getenv("POE_API_KEY")
    if not api_key:
        raise ValueError("POE_API_KEY environment variable not set")

    message = fp.ProtocolMessage(
        role="user",
        content="Write a short poem about AI learning platforms."
    )

    print("🔄 Streaming response from Poe...")
    try:
        async for partial in fp.get_bot_response(
            messages=[message],
            bot_name="Claude-3.5-Sonnet",
            api_key=api_key
        ):
            print(partial, end="", flush=True)
        print("\n✅ Streaming complete!")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all examples"""
    print("🤖 ALAIn Poe Integration Examples")
    print("=" * 50)

    # Check if API key is available
    if not os.getenv("POE_API_KEY"):
        print("⚠️  Please set POE_API_KEY environment variable first!")
        print("   Get your key from: https://poe.com/api_key")
        return

    print("\n1️⃣ Testing fastapi-poe SDK:")
    poe_sdk_example()

    print("\n2️⃣ Testing OpenAI SDK with Poe:")
    poe_openai_sdk_example()

    print("\n3️⃣ cURL command:")
    curl_example()

    print("\n4️⃣ Testing streaming with fastapi-poe:")
    asyncio.run(poe_streaming_example())

if __name__ == "__main__":
    main()
