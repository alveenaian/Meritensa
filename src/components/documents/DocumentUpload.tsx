import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import { Button } from "~/components/ui/Button";
import { Upload, X, File, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const DOCUMENT_CATEGORIES = [
  { value: "CONTRACT", label: "Contract" },
  { value: "EMAIL", label: "Email" },
  { value: "TEXT_MESSAGE", label: "Text Message" },
  { value: "FINANCIAL", label: "Financial Document" },
  { value: "PHOTO_VIDEO", label: "Photo/Video" },
  { value: "LEGAL_DOCUMENT", label: "Legal Document" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "EVIDENCE_OTHER", label: "Other Evidence" },
  { value: "IDENTIFICATION", label: "Identification" },
  { value: "OTHER", label: "Other" },
] as const;

type DocumentCategory = typeof DOCUMENT_CATEGORIES[number]["value"];

interface DocumentUploadProps {
  caseId: string;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  category: DocumentCategory;
}

export function DocumentUpload({ caseId, onUploadComplete }: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'presigned' | 'proxy' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);

  const getPresignedUrlMutation = useMutation(
    trpc.getPresignedUploadUrl.mutationOptions()
  );

  const uploadProxyMutation = useMutation(
    trpc.uploadDocumentProxy.mutationOptions()
  );

  const checkAccessQuery = useQuery(
    trpc.checkMinioPublicAccess.queryOptions()
  );

  // Determine upload method on mount
  useEffect(() => {
    if (checkAccessQuery.data) {
      setUploadMethod(checkAccessQuery.data.useProxyUpload ? 'proxy' : 'presigned');
      console.log(`Upload method: ${checkAccessQuery.data.useProxyUpload ? 'proxy' : 'presigned'}`);
    }
  }, [checkAccessQuery.data]);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (uploadingFile: UploadingFile, index: number) => {
    if (!uploadMethod) {
      toast.error("Upload system is initializing, please wait...");
      return;
    }

    try {
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "uploading" as const, progress: 0 } : f
        )
      );

      console.log(`Starting upload for: ${uploadingFile.file.name} using ${uploadMethod} method`);

      if (uploadMethod === 'proxy') {
        // Use proxy upload method
        console.log(`Reading file as base64: ${uploadingFile.file.name}`);
        const fileData = await readFileAsBase64(uploadingFile.file);
        
        console.log(`Uploading via proxy: ${uploadingFile.file.name} (${fileData.length} chars)`);
        
        await uploadProxyMutation.mutateAsync({
          token: token!,
          caseId,
          filename: uploadingFile.file.name,
          mimeType: uploadingFile.file.type,
          fileData,
          category: uploadingFile.category,
        });

        console.log(`Proxy upload successful for: ${uploadingFile.file.name}`);

        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "success" as const, progress: 100 } : f
          )
        );

        toast.success(`${uploadingFile.file.name} uploaded successfully`);
        onUploadComplete?.();
      } else {
        // Use presigned URL method (original code)
        const result = await getPresignedUrlMutation.mutateAsync({
          token: token!,
          caseId,
          filename: uploadingFile.file.name,
          mimeType: uploadingFile.file.type,
          size: uploadingFile.file.size,
          category: uploadingFile.category,
        });

        console.log(`Received presigned URL for: ${uploadingFile.file.name}`);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadingFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, progress } : f))
            );
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.addEventListener("load", () => {
            console.log(`Upload completed with status: ${xhr.status}`);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              console.error(`Upload failed with status ${xhr.status}`);
              console.error(`Response: ${xhr.responseText}`);
              reject(new Error(`Upload failed with status ${xhr.status}. The file storage service may not be properly configured.`));
            }
          });

          xhr.addEventListener("error", () => {
            console.error("Upload network error");
            reject(new Error("Network error during upload. Please check your connection and try again."));
          });

          xhr.addEventListener("abort", () => {
            console.error("Upload aborted");
            reject(new Error("Upload was cancelled"));
          });

          xhr.open("PUT", result.uploadUrl);
          xhr.setRequestHeader("Content-Type", uploadingFile.file.type);
          console.log(`Sending file: ${uploadingFile.file.name} (${uploadingFile.file.size} bytes)`);
          xhr.send(uploadingFile.file);
        });

        console.log(`Upload successful for: ${uploadingFile.file.name}`);

        setUploadingFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "success" as const, progress: 100 } : f
          )
        );

        toast.success(`${uploadingFile.file.name} uploaded successfully`);
        onUploadComplete?.();
      }
    } catch (error) {
      console.error(`Upload error for ${uploadingFile.file.name}:`, error);
      
      let errorMessage = "Upload failed";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as any).message);
      }
      
      // Check for specific error types
      if (errorMessage.includes("SERVICE_UNAVAILABLE") || errorMessage.includes("not available")) {
        errorMessage = "File storage is currently unavailable. Please try again later.";
      } else if (errorMessage.includes("Network error")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes("status")) {
        errorMessage = "Upload failed. The file storage service may not be properly configured.";
      }
      
      setUploadingFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: "error" as const, error: errorMessage } : f
        )
      );
      
      toast.error(`Failed to upload ${uploadingFile.file.name}: ${errorMessage}`);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const newFiles: UploadingFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return;
      }

      newFiles.push({
        file,
        progress: 0,
        status: "pending",
        category: "OTHER",
      });
    });

    setUploadingFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleCategoryChange = (index: number, category: DocumentCategory) => {
    setUploadingFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, category } : f))
    );
  };

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllPending = () => {
    uploadingFiles.forEach((file, index) => {
      if (file.status === "pending") {
        uploadFile(file, index);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept="*/*"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or{" "}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-gray-500">Maximum file size: 50MB</p>
      </div>

      {/* Uploading files list */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Files ({uploadingFiles.length})
            </h4>
            {uploadingFiles.some((f) => f.status === "pending") && (
              <Button size="sm" onClick={uploadAllPending}>
                Upload All
              </Button>
            )}
          </div>

          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <File className="h-5 w-5 flex-shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uploadingFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {uploadingFile.status === "success" && (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                    )}
                    {uploadingFile.status === "error" && (
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                    )}
                    {uploadingFile.status === "pending" && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Category selector */}
                  {uploadingFile.status === "pending" && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={uploadingFile.category}
                        onChange={(e) =>
                          handleCategoryChange(
                            index,
                            e.target.value as DocumentCategory
                          )
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        {DOCUMENT_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Progress bar */}
                  {uploadingFile.status === "uploading" && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Uploading...</span>
                        <span>{uploadingFile.progress}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{ width: `${uploadingFile.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {uploadingFile.status === "error" && (
                    <p className="mt-2 text-xs text-red-600">
                      {uploadingFile.error}
                    </p>
                  )}

                  {/* Upload button for individual file */}
                  {uploadingFile.status === "pending" && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => uploadFile(uploadingFile, index)}
                    >
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
