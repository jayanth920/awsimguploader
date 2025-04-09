import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "react-oidc-context";

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [performOCR, setPerformOCR] = useState(false);
  const auth = useAuth(); // Get authentication details

  const onDrop = (acceptedFiles) => {
    setSelectedFile(acceptedFiles[0]);
  };

  const handleCheckboxChange = () => {
    setPerformOCR(!performOCR);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select an image.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const base64String = reader.result.split(",")[1]; // Extract base64 content

        const requestBody = {
          ocr: performOCR,
          file: base64String,
          fileName: selectedFile.name,
        };

        const response = await fetch(
          "https://2th5ie9oeb.execute-api.us-east-2.amazonaws.com/devrest/upload",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            mode: "cors",
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Success:", result);
        alert("Image uploaded successfully!");
        setSelectedFile(null); // Reset file
        setPerformOCR(false); // Reset OCR flag
      } catch (err) {
        console.error("Error uploading:", err);
        alert("Failed to upload image.");
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Error processing file.");
    };
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    maxFiles: 1,
    onDrop,
  });

  return (
    <div>
      <h2>Upload Image</h2>
      <div {...getRootProps()} style={styles.dropzone}>
        <input {...getInputProps()} />
        <p>Drag & drop an image here, or click to select one</p>
      </div>

      {selectedFile && (
        <div>
          <h3>Preview:</h3>
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Preview"
            style={styles.imagePreview}
          />
          <label>
            <input type="checkbox" checked={performOCR} onChange={handleCheckboxChange} />
            Perform OCR on this image
          </label>
        </div>
      )}

      <button onClick={handleSubmit} style={styles.submitButton}>Submit</button>
    </div>
  );
};

const styles = {
  dropzone: {
    border: "2px dashed #ccc",
    padding: "20px",
    textAlign: "center",
    marginBottom: "20px",
  },
  imagePreview: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    marginTop: "10px",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
};

export default ImageUpload;