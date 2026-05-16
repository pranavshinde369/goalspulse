import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()  # load .env

api_key = os.getenv("GEMINI_API_KEY")
print("API KEY:", api_key)  # 🔥 debug line

genai.configure(api_key=api_key)

models = genai.list_models()
for m in models:
    print(m.name)