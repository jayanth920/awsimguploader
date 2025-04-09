import json
import base64
import requests

# Path to your image files
image_paths = ['background3.jpg', 'ocrtext.png']

# Function to convert an image to a base64 string
def image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Prepare the batch with the base64 encoded images
def prepare_batch(image_paths):
    batch = []
    for image_path in image_paths:
        file_name = image_path.split('/')[-1]
        base64_string = image_to_base64(image_path)
        
        # Add file data to the batch
        file_data = {
            "fileName": file_name,
            "file": base64_string,
            "ocr": True  # Set to True to perform OCR
        }
        batch.append(file_data)
    return batch

# Prepare your batch with images
batch = prepare_batch(image_paths)

# Prepare the payload for the POST request
payload = {
    "batch": batch
}

# The URL of your Lambda function (change this to the actual endpoint)
lambda_url = ""

# Send the POST request to the Lambda function
headers = {
    "Content-Type": "application/json"
}

response = requests.post(lambda_url, json=payload, headers=headers)

# Check if the request was successful
if response.status_code == 200:
    print("Successfully uploaded batch!")
    print("Response:", response.json())
else:
    print(f"Failed to upload batch. Status code: {response.status_code}")
    print("Response:", response.text)
