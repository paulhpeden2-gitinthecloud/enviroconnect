"use client";
import { useEffect } from "react";
import { X, Download } from "lucide-react";

interface PdfPreviewModalProps {
  url: string;
  fileName: string;
  onClose: () => void;
}

export function PdfPreviewModal({ url, fileName, onClose }: PdfPreviewModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-mist rounded-lg shadow-lg w-full max-w-4xl h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-mist">
          <h3 className="text-sm font-semibold text-text-deep truncate">
            {fileName}
          </h3>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={url}
              download={fileName}
              className="inline-flex items-center gap-1.5 text-xs text-accent font-medium hover:text-accent-hover transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              aria-label="Close preview"
              className="text-slate-custom hover:text-text-deep transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            src={url}
            className="w-full h-full rounded-b-lg"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
}
