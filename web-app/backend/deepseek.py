# Please install OpenAI SDK first: `pip3 install openai`
import requests
from dotenv import load_dotenv
import os

load_dotenv()

DEEPSEEK_API_KEY = os.environ["DEEPSEEK_API_KEY"]


def clean_html_with_deepseek(text):
    """Uses DeepSeek to reformat text by removing HTML tags"""
    api_url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = f"Here is a response with unnecessary HTML tags. Convert it into plain text with clean formatting:\n\n{text}"
    
    data = {
        "model": "deepseek-chat",  # Use "deepseek-chat" for free version
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7  # Adjust if needed
    }

    response = requests.post(api_url, headers=headers, json=data)
    result = response.json()
    
    print(response, result)
    
    if "choices" in result:
        return result["choices"][0]["message"]["content"]
    return None


response = clean_html_with_deepseek("<div>The issue is likely happening because of one of these reasons: <p>🔹 1. MongoDB Update IssueYour MongoDB update query </p> </div>")

print(response)