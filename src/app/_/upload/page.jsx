"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [upload, { loading: uploading }] = useUpload();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = useCallback((file) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const validExtensions = [".xls", ".xlsx"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (
      !validTypes.includes(file.type) &&
      !validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    ) {
      return "Please select a valid Excel file (.xls or .xlsx)";
    }

    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    return null;
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setError(null);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const droppedFile = e.dataTransfer.files[0];
        const validationError = validateFile(droppedFile);

        if (validationError) {
          setError(validationError);
          return;
        }

        setFile(droppedFile);
      }
    },
    [validateFile]
  );

  const handleFileSelect = useCallback(
    (e) => {
      setError(null);

      if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        const validationError = validateFile(selectedFile);

        if (validationError) {
          setError(validationError);
          return;
        }

        setFile(selectedFile);
      }
    },
    [validateFile]
  );

  const handleUpload = useCallback(async () => {
    if (!file || !user) return;

    setError(null);
    setUploadProgress(0);
    setIsProcessing(true);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { url, error: uploadError } = await upload({ file });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        throw new Error(uploadError);
      }

      // Save upload record to database
      const response = await fetch("/api/save-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          filename: `${Date.now()}_${file.name}`,
          originalFilename: file.name,
          fileUrl: url,
          fileSize: file.size,
          status: "uploaded",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save upload record");
      }

      const data = await response.json();

      // Redirect to analysis page
      setTimeout(() => {
        window.location.href = `/analyze/${data.uploadId}`;
      }, 1000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
      setUploadProgress(0);
      setIsProcessing(false);
    }
  }, [file, user, upload]);

  const removeFile = useCallback(() => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setIsProcessing(false);
  }, []);

  // Show loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#357AFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-upload text-6xl text-[#357AFF] mb-4"></i>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Upload Excel Files
            </h1>
            <p className="text-gray-600">
              Sign in to upload and analyze your Excel data
            </p>
          </div>
          <div className="space-y-4">
            <a
              href="/account/signin?callbackUrl=/upload"
              className="block w-full bg-[#357AFF] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2E69DE] transition-colors"
            >
              Sign In
            </a>
            <a
              href="/account/signup?callbackUrl=/upload"
              className="block w-full border-2 border-[#357AFF] text-[#357AFF] py-3 px-6 rounded-lg font-medium hover:bg-[#357AFF] hover:text-white transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="flex items-center">
                <i className="fas fa-chart-line text-2xl text-[#357AFF] mr-3"></i>
                <h1 className="text-xl font-bold text-gray-800">
                  Excel Analytics
                </h1>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <a
                href="/account/logout"
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <a href="/dashboard" className="hover:text-[#357AFF]">
              Dashboard
            </a>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-gray-800">Upload Excel File</span>
          </div>
        </nav>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <i className="fas fa-file-excel text-5xl text-green-600 mb-4"></i>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Upload Excel File
            </h1>
            <p className="text-gray-600">
              Upload your Excel file to start analyzing your data
            </p>
          </div>

          {!file ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragActive
                  ? "border-[#357AFF] bg-blue-50"
                  : "border-gray-300 hover:border-[#357AFF] hover:bg-blue-50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="space-y-4">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                <div>
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drag and drop your Excel file here
                  </p>
                  <p className="text-gray-500 mb-4">or click to browse files</p>
                  <div className="inline-flex items-center px-4 py-2 bg-[#357AFF] text-white rounded-lg hover:bg-[#2E69DE] transition-colors">
                    <i className="fas fa-folder-open mr-2"></i>
                    Choose File
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Supported formats: .xls, .xlsx (max 10MB)
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Preview */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <i className="fas fa-file-excel text-3xl text-green-600 mr-4"></i>
                    <div>
                      <h3 className="font-medium text-gray-800">{file.name}</h3>
                      <p className="text-sm text-gray-500">
                        {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={removeFile}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-times text-xl"></i>
                    </button>
                  )}
                </div>

                {/* Upload Progress */}
                {isProcessing && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {uploadProgress < 100
                          ? "Uploading..."
                          : "Processing..."}
                      </span>
                      <span className="text-sm text-gray-500">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#357AFF] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {!isProcessing && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full bg-[#357AFF] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2E69DE] transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Upload and Analyze
                  </button>
                )}

                {/* Success Message */}
                {uploadProgress === 100 && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle mr-2"></i>
                      Upload successful! Redirecting to analysis...
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {error}
              </div>
            </div>
          )}

          {/* File Requirements */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-800 mb-3">
              File Requirements
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Excel files only (.xls, .xlsx)
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Maximum file size: 10MB
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Data should be in tabular format
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                First row should contain column headers
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;