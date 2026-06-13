import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, X, Loader2, FileText } from "lucide-react";
import { getTextbookInfo, getTextbookUrl } from "./textbookMap";

interface TextbookViewerProps {
  classId: string;
  subjectTitle: string;
  subjectTitleNepali?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TextbookViewer({ classId, subjectTitle, subjectTitleNepali, isOpen, onClose }: TextbookViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadTextbook();
  }, [classId, subjectTitle, isOpen]);

  async function loadTextbook() {
    const info = getTextbookInfo(classId, subjectTitle);
    if (!info) {
      setError("No textbook available for this subject.");
      setContent("");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = getTextbookUrl(info.className, info.filename);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setContent(text);
    } catch (e) {
      setError("Failed to load textbook content.");
      setContent("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 md:p-6`}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden ${
              fullscreen ? "w-full h-full" : "w-full max-w-5xl sm:h-[85vh] h-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Textbook: {subjectTitleNepali || subjectTitle}
                  </h2>
                  <p className="text-[11px] text-slate-500">{classId.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors text-xs"
                  title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  <FileText className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-white">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Loading textbook...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                  <BookOpen className="h-10 w-10 text-slate-300" />
                  <p className="text-sm font-medium">{error}</p>
                  <p className="text-xs text-slate-400">No digital textbook mapped for this subject yet.</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:font-bold prose-p:text-slate-700 prose-p:leading-relaxed prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded prose-img:rounded-xl prose-table:text-sm">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 text-center shrink-0">
              Nepal Government Textbook &middot; Curriculum Development Centre
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
