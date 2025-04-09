from PIL import Image
import os

def compress_image(input_file):
    # Open the image
    with Image.open(input_file) as img:
        # Convert to RGB (if needed) and compress by resizing
        img = img.convert("RGB")
        width, height = img.size
        new_width = width // 2  # 50% width
        new_height = height // 2  # 50% height
        img = img.resize((new_width, new_height))
        
        # Save the compressed image with '-compressed' suffix
        output_file = f"{os.path.splitext(input_file)[0]}-compressed.jpg"
        img.save(output_file, "JPEG", quality=75)  # 75% quality compression
        print(f"Image compressed and saved as {output_file}")

if __name__ == "__main__":
    # Assume the input file is a JPG in the same folder
    input_file = "background2.jpg"  # Replace with your filename if different
    compress_image(input_file)
