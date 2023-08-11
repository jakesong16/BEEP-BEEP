import requests
import os
API_URL = "https://api-inference.huggingface.co/models/youngp5/skin-conditions"
headers = {"Authorization": "Bearer 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"}
'''
def query(filename):
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers=headers, data=data)
    return response.json()

output = query(input("Please upload a file:")) 
'''