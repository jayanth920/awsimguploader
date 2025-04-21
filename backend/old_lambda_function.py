import json
import boto3
import base64
import io
from PIL import Image

s3 = boto3.client("s3")
glacier = boto3.client("s3")
textract = boto3.client("textract")  # Add Textract client

S3_BUCKET = "jay-img-bucket"
GLACIER_BUCKET = "jay-glacier-bucket"

def lambda_handler(event, context):
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        file_name = body.get("fileName")
        file_content = body.get("file")
        ocr_flag = body.get("ocr", False)  # Take in OCR flag (default to False)

        # Validate required fields
        if not file_name or not file_content:
            return response(400, {"error": "Missing file or fileName"})

        # Decode base64 content
        try:
            file_bytes = base64.b64decode(file_content)
        except Exception as e:
            return response(400, {"error": f"Failed to decode file content: {str(e)}"})

        # Upload raw image to S3
        try:
            upload_to_s3(file_bytes, file_name)
        except Exception as e:
            return response(400, {"error": f"Failed to upload image to S3: {str(e)}"})

        extracted_text = None
        if ocr_flag:
            # Perform OCR using Textract
            try:
                extracted_text = perform_ocr(file_name)
            except Exception as e:
                return response(400, {"error": f"Failed to perform OCR: {str(e)}"})

        # Compress image
        try:
            compressed_image = compress_image(file_bytes)
        except Exception as e:
            return response(400, {"error": f"Failed to compress image: {str(e)}"})

        compressed_file_name = f"compressed-{file_name}"

        # Upload compressed image to Glacier
        try:
            upload_to_glacier(compressed_image, compressed_file_name)
        except Exception as e:
            return response(400, {"error": f"Failed to upload image to Glacier: {str(e)}"})

        # Delete original image from S3
        try:
            delete_from_s3(S3_BUCKET, file_name)
        except Exception as e:
            return response(400, {"error": f"Failed to delete original image from S3: {str(e)}"})

        return response(200, {
            "message": "Image uploaded, compressed, and archived successfully",
            "fileName": file_name,
            "ocr": ocr_flag,
            "extractedText": extracted_text  # Include OCR text in response
        })

    except Exception as e:
        return response(400, {"error": f"General error: {str(e)}"})

def upload_to_s3(image_data, file_name):
    s3.put_object(Bucket=S3_BUCKET, Key=file_name, Body=image_data)

def compress_image(image_data):
    img = Image.open(io.BytesIO(image_data))
    img = img.convert("RGB")
    img = img.resize((img.width // 2, img.height // 2))  # Reduce size by 50%
    
    compressed_byte_arr = io.BytesIO()
    img.save(compressed_byte_arr, format="JPEG", quality=75)  # Compress with quality 75%
    return compressed_byte_arr.getvalue()

def upload_to_glacier(image_data, file_name):
    glacier.put_object(Bucket=GLACIER_BUCKET, Key=file_name, Body=image_data)

def delete_from_s3(bucket_name, file_name):
    s3.delete_object(Bucket=bucket_name, Key=file_name)

def perform_ocr(file_name):
    """Extract text from an image in S3 using Textract"""
    response = textract.detect_document_text(
        Document={"S3Object": {"Bucket": S3_BUCKET, "Name": file_name}}
    )
    
    extracted_text = " ".join([block["Text"] for block in response.get("Blocks", []) if block["BlockType"] == "LINE"])
    return extracted_text if extracted_text else "No text detected"

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS, POST",
            "Access-Control-Allow-Headers": "Content-Type"
        },
        "body": json.dumps(body)
    }