import json
import boto3
import base64
import io
from PIL import Image
from datetime import datetime
import uuid

s3 = boto3.client("s3")
glacier = boto3.client("s3")
textract = boto3.client("textract")  # Add Textract client

S3_BUCKET = "jay-img-bucket"
GLACIER_BUCKET = "jay-glacier-bucket"


BATCH_SIZE = 2
DYNAMO_TABLE = "jay-batch-table"
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(DYNAMO_TABLE)

def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        files = body.get("batch", [])

        if not isinstance(files, list) or len(files) == 0:
            return response(400, {"error": "No files provided."})

        if len(files) > BATCH_SIZE:
            return response(400, {"error": f"Max batch size is {BATCH_SIZE}."})

        # Generate batch name
        now = datetime.utcnow()
        timestamp = now.strftime("%m/%d/%y-%H-%M-%S")
        batch_id = str(uuid.uuid4())[:8]  # Short unique id
        batch_name = f"Batch {batch_id} - {timestamp}"

        raw_folder = f"{batch_name}/raw/"
        compressed_folder = f"{batch_name}/compressed/"

        extracted_addresses = []

        for file in files:
            file_name = file.get("fileName")
            file_content = file.get("file")
            ocr_flag = file.get("ocr", False)

            if not file_name or not file_content:
                extracted_addresses.append("null")
                continue

            try:
                file_bytes = base64.b64decode(file_content)
                s3_key = raw_folder + file_name
                upload_to_s3(file_bytes, s3_key)
            except:
                extracted_addresses.append("null")
                continue

            extracted_text = "null"
            if ocr_flag:
                try:
                    extracted_text = perform_ocr(s3_key)
                except:
                    extracted_text = "null"

            extracted_addresses.append(extracted_text)

            # Compress and store in Glacier
            try:
                compressed = compress_image(file_bytes)
                glacier_key = compressed_folder + file_name
                upload_to_glacier(compressed, glacier_key)
            except:
                pass

        # Store batch record in DynamoDB
        item = {
            "batch_name": batch_name,
            "addresses": extracted_addresses
        }
        table.put_item(Item=item)

        # Clean up raw folder
        delete_prefix(S3_BUCKET, raw_folder)

        return response(200, item)

    except Exception as e:
        return response(400, {"error": f"General error: {str(e)}"})


def upload_to_s3(image_data, s3_key):
    s3.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=image_data)

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

def perform_ocr(s3_key):
    response = textract.detect_document_text(
        Document={"S3Object": {"Bucket": S3_BUCKET, "Name": s3_key}}
    )
    extracted_text = " ".join([block["Text"] for block in response.get("Blocks", []) if block["BlockType"] == "LINE"])
    return extracted_text if extracted_text else "null"

def delete_prefix(bucket, prefix):
    objects = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    if "Contents" in objects:
        for obj in objects["Contents"]:
            s3.delete_object(Bucket=bucket, Key=obj["Key"])


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

