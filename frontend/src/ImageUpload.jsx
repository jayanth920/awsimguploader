import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAuth } from "react-oidc-context";

const BATCH_SIZE = 2;

const ImageUpload = () => {
  const [files, setFiles] = useState([]);
  const [ocrFlags, setOcrFlags] = useState([]);
  const [responseJson, setResponseJson] = useState(null);
  const auth = useAuth(); // In case needed

  const onDrop = (acceptedFiles) => {
    if (files.length + acceptedFiles.length > BATCH_SIZE) {
      alert(`⚠️ You’ve reached the maximum batch size.`);
      return;
    }
  
    const newFiles = [...files];
    const newFlags = [...ocrFlags];
  
    for (let file of acceptedFiles) {
      if (newFiles.length >= BATCH_SIZE) break;
      newFiles.push(file);
      newFlags.push(true); // Default OCR flag is true
    }
  
    setFiles(newFiles);
    setOcrFlags(newFlags);
  };

  const toggleOcrFlag = (index) => {
    const updatedFlags = [...ocrFlags];
    updatedFlags[index] = !updatedFlags[index];
    setOcrFlags(updatedFlags);
  };

  const removeFile = (indexToRemove) => {
    const newFiles = files.filter((_, idx) => idx !== indexToRemove);
    const newFlags = ocrFlags.filter((_, idx) => idx !== indexToRemove);
    setFiles(newFiles);
    setOcrFlags(newFlags);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setOcrFlags([]);
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      alert("Please select up to 2 images.");
      return;
    }

    try {
      const filePromises = files.map((file, index) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const base64String = reader.result.split(",")[1];
            resolve({
              fileName: file.name,
              file: base64String,
              ocr: ocrFlags[index]
            });
          };
          reader.onerror = (error) => reject(error);
        });
      });

      const requestBody = await Promise.all(filePromises);
      console.log(JSON.stringify({ batch: requestBody }))

      const response = await fetch(
        "https://alpwtqzkd1.execute-api.us-east-2.amazonaws.com/default/imageprocess",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
          body: JSON.stringify({ batch: requestBody }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      setResponseJson(result);
      alert("Images uploaded successfully!");
      setFiles([]);
      setOcrFlags([]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload images.");
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    maxFiles: BATCH_SIZE,
    onDrop,
  });

  return (
    <div>
      <h2>Upload Images (Max 2)</h2>
      <div {...getRootProps()} style={styles.dropzone}>
        <input {...getInputProps()} />
        <p>Drag & drop images here, or click to select</p>
      </div>

      {files.length > 0 && (
        <div>
          <h3>Preview:</h3>
          {files.map((file, index) => (
            <div key={index} style={styles.previewContainer}>
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index}`}
                style={styles.imagePreview}
              />
              <label>
                <input
                  type="checkbox"
                  checked={ocrFlags[index]}
                  onChange={() => toggleOcrFlag(index)}
                />
                Perform OCR
              </label>
              <button
                onClick={() => removeFile(index)}
                style={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}

          <button onClick={clearAllFiles} style={styles.clearAllButton}>
            Clear All
          </button>
        </div>
      )}

      <button onClick={handleSubmit} style={styles.submitButton}>
        Submit
      </button>

      {responseJson && (
        <div style={styles.responseBox}>
          <h3>Response:</h3>
          <pre>{JSON.stringify(responseJson, null, 2)}</pre>
        </div>
      )}
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
  previewContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  imagePreview: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
  },
  responseBox: {
    backgroundColor: "#f5f5f5",
    padding: "10px",
    marginTop: "20px",
    borderRadius: "5px",
    whiteSpace: "pre-wrap",
  },
  removeButton: {
    marginLeft: "10px",
    padding: "4px 8px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  clearAllButton: {
    marginTop: "10px",
    padding: "6px 12px",
    backgroundColor: "#999",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default ImageUpload;
