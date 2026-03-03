"use client";
import { useRef, useState, useCallback } from "react";

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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              ? "border-green bg-green/5"
              : "border-cream-dark hover:border-green/50 dark:border-navy dark:hover:border-green/50"
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drop PDFs here or <span className="text-green font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
              className="flex items-center gap-2 bg-cream dark:bg-navy rounded-lg px-3 py-2 text-sm border border-cream-dark dark:border-navy-light"
            >
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H4zm7 1.5L16.5 9H12a1 1 0 01-1-1V3.5zM7 11h6a1 1 0 110 2H7a1 1 0 110-2zm0 3h4a1 1 0 110 2H7a1 1 0 110-2z" />
              </svg>
              <span className="text-navy dark:text-cream truncate max-w-[150px]">
                {f.file.name}
              </span>
              <span className="text-gray-400 text-xs shrink-0">{formatSize(f.file.size)}</span>
              {f.uploading && (
                <span className="text-xs text-green animate-pulse">Uploading...</span>
              )}
              {f.error && (
                <span className="text-xs text-red-500">{f.error}</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
