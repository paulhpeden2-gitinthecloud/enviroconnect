"use client";
import { useRef, useState, useCallback } from "react";
import { FileText, X } from "lucide-react";

interface UploadedFile {
  file: File;
  storageId?: string;
  uploading?: boolean;
  error?: string;
}

interface PdfUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
}

export function PdfUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSizeMb = 20,
}: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const remaining = maxFiles - files.length;
      if (remaining <= 0) return;

      const valid: UploadedFile[] = [];
      for (const file of fileArray.slice(0, remaining)) {
        if (file.type !== "application/pdf") continue;
        if (file.size > maxSizeMb * 1024 * 1024) continue;
        if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) continue;
        valid.push({ file });
      }
      if (valid.length > 0) {
        onFilesChange([...files, ...valid]);
      }
    },
    [files, onFilesChange, maxFiles, maxSizeMb]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-deep mb-1">
        Attachments (PDF, up to {maxFiles} files)
      </label>

      {files.length < maxFiles && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-mist hover:border-accent bg-cloud"
          }`}
        >
          <p className="text-sm text-slate-custom">
            Drop PDFs here or{" "}
            <span className="text-accent font-medium">click to browse</span>
          </p>
          <p className="text-xs text-slate-custom mt-1">
            Max {maxSizeMb}MB per file
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {files.map((f, i) => (
            <div
              key={`${f.file.name}-${i}`}
              className="flex items-center gap-2 bg-surface border border-mist rounded-md px-3 py-2 text-sm"
            >
              <FileText className="w-4 h-4 text-danger shrink-0" />
              <span className="text-text-deep truncate max-w-[150px]">
                {f.file.name}
              </span>
              <span className="text-slate-custom text-xs shrink-0">{formatSize(f.file.size)}</span>
              {f.uploading && (
                <span className="text-xs text-accent animate-pulse">Uploading...</span>
              )}
              {f.error && (
                <span className="text-xs text-danger">{f.error}</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="text-slate-custom hover:text-danger transition-colors ml-1"
                aria-label={`Remove ${f.file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
