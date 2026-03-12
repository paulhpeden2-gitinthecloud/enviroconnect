"use client";
import { useEffect } from "react";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-light rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-dark dark:border-navy">
          <h3 className="text-sm font-semibold text-navy dark:text-cream truncate">
            {fileName}
          </h3>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={url}
              download={fileName}
              className="text-xs text-green font-medium hover:underline"
            >
              Download
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-navy dark:hover:text-cream transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            src={url}
            className="w-full h-full rounded-b-xl"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
}
