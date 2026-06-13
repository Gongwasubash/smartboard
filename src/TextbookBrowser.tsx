import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronDown, ChevronRight, GraduationCap, BookText, FileText, ListCollapse } from "lucide-react";
import { getTextbooksByClass, getTextbookPdfUrl } from "./textbookMap";
import chapterMap, { ChapterEntry, SectionEntry } from "./chapterMap";

export interface SubjectSelection {
  className: string;
  filename: string;
}

export interface ChapterSelection {
  title: string;
  page: number;
  sectionTitle?: string;
}

// Sidebar component: class/subject/chapter tree for the left panel
export function TextbookSidebar({
  expandedClass,
  onToggleClass,
  selectedSubject,
  onSelectSubject,
  selectedChapter,
  onSelectChapter,
}: {
  expandedClass: string | null;
  onToggleClass: (name: string | null) => void;
  selectedSubject: SubjectSelection | null;
  onSelectSubject: (sub: SubjectSelection) => void;
  selectedChapter: ChapterSelection | null;
  onSelectChapter: (ch: ChapterSelection | null) => void;
}) {
  const classes = getTextbooksByClass();

  function getChapters(className: string, subjectTitle: string): ChapterEntry[] {
    const key = `${className}|${subjectTitle}`;
    return chapterMap[key] || [];
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <BookOpen className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold text-xs tracking-wide text-slate-800 uppercase font-display">Textbooks</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {classes.map((cls) => (
          <div key={cls.className}>
            <button
              onClick={() => onToggleClass(expandedClass === cls.className ? null : cls.className)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                {cls.className}
                <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full">{cls.subjects.length}</span>
              </div>
              {expandedClass === cls.className ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            <AnimatePresence>
              {expandedClass === cls.className && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-slate-50/50 pb-1">
                    {cls.subjects.map((sub) => {
                      const isSelected = selectedSubject?.className === cls.className && selectedSubject?.filename === sub.filename;
                      const chapters = getChapters(cls.className, sub.title);
                      return (
                        <div key={sub.title}>
                          <button
                            onClick={() => {
                              onSelectSubject({ className: cls.className, filename: sub.filename });
                              onSelectChapter(null);
                            }}
                            className={`w-full flex items-center gap-2.5 px-6 py-2 text-xs text-left transition-colors ${
                              isSelected
                                ? "bg-indigo-100 text-indigo-700 font-semibold"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <BookText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{sub.title}</span>
                            {chapters.length > 0 && (
                              <span className="ml-auto text-[10px] text-slate-400">{chapters.length}</span>
                            )}
                          </button>
                          {isSelected && chapters.length > 0 && (
                            <div className="border-l-2 border-indigo-200 ml-8 mb-1">
                              {chapters.map((ch) => {
                                const isChSelected = selectedChapter?.page === ch.page && !selectedChapter?.sectionTitle;
                                return (
                                  <div key={ch.title}>
                                    <button
                                      onClick={() => onSelectChapter({ title: ch.title, page: ch.page })}
                                      className={`w-full flex items-center gap-2 pl-3 pr-4 py-1.5 text-[11px] text-left transition-colors ${
                                        isChSelected
                                          ? "text-indigo-700 font-semibold bg-indigo-50/50"
                                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      <FileText className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{ch.title}</span>
                                      {ch.sections.length > 0 && (
                                        <span className="ml-auto text-[9px] text-slate-400">{ch.sections.length}</span>
                                      )}
                                    </button>
                                    {ch.sections.length > 0 && (
                                      <div className="border-l border-slate-200 ml-3 mb-0.5">
                                        {ch.sections.map((sec) => {
                                          const isSecSelected = selectedChapter?.page === sec.page && selectedChapter?.sectionTitle === sec.title;
                                          return (
                                            <button
                                              key={sec.title}
                                              onClick={() => onSelectChapter({ title: ch.title, page: sec.page, sectionTitle: sec.title })}
                                              className={`w-full flex items-center gap-1.5 pl-3 pr-3 py-1 text-[10px] text-left transition-colors ${
                                                isSecSelected
                                                  ? "text-indigo-600 font-semibold bg-indigo-50/30"
                                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                              }`}
                                            >
                                              <ListCollapse className="h-2.5 w-2.5 shrink-0" />
                                              <span className="truncate">{sec.title}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// Content component: textbook PDF display for the main area
export function TextbookView({
  selectedSubject,
  selectedChapter,
  onBack,
}: {
  selectedSubject: SubjectSelection | null;
  selectedChapter: ChapterSelection | null;
  onBack?: () => void;
}) {
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    setPdfError(false);
  }, [selectedSubject?.className, selectedSubject?.filename]);

  function getPdfUrl() {
    if (!selectedSubject) return "";
    let url = getTextbookPdfUrl(selectedSubject.className, selectedSubject.filename);
    if (selectedChapter) {
      url += `#page=${selectedChapter.page}`;
    }
    return url;
  }

  if (!selectedSubject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-8">
        <BookOpen className="h-12 w-12 text-slate-300" />
        <p className="text-sm font-medium">Select a class and subject</p>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Expand a class in the left sidebar, then click a subject to view its textbook.
        </p>
      </div>
    );
  }

  if (pdfError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-8">
        <BookOpen className="h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium">PDF not available</p>
        <p className="text-xs text-slate-400 text-center">The PDF for this subject could not be loaded.</p>
      </div>
    );
  }

  const subjectName = selectedSubject.filename
    .replace(".md", "")
    .replace(".pdf", "")
    .replace(selectedSubject.className, "")
    .replace(/^\s+/, "");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <BookText className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{subjectName}</h3>
            <p className="text-[11px] text-slate-500">{selectedSubject.className}</p>
            {selectedChapter && (
              <p className="text-[10px] text-indigo-500 font-medium">
                {selectedChapter.sectionTitle ? `${selectedChapter.title} › ${selectedChapter.sectionTitle}` : selectedChapter.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedChapter && (
            <button
              onClick={() => window.open(getPdfUrl().replace(/#page=\d+$/, ""), "_blank")}
              className="text-xs text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
              title="Open PDF in new tab"
            >
              Open PDF
            </button>
          )}
          {onBack && (
            <button onClick={onBack} className="text-xs text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
              Back
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 bg-slate-100">
        <iframe
          key={selectedChapter ? `ch-${selectedChapter.page}${selectedChapter.sectionTitle ? '-' + selectedChapter.sectionTitle : ''}` : 'base'}
          src={getPdfUrl()}
          className="w-full h-full border-none"
          title={subjectName}
        />
      </div>
      <div className="px-6 py-2 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 text-center shrink-0">
        Nepal Government Textbook &middot; Curriculum Development Centre
      </div>
    </div>
  );
}

// Original full-page browser kept for backward compatibility
export default function TextbookBrowser({
  sidebarExpandedClass,
  onSidebarToggleClass,
  selectedSubject,
  onSelectSubject,
  selectedChapter,
  onSelectChapter,
}: {
  sidebarExpandedClass: string | null;
  onSidebarToggleClass: (name: string | null) => void;
  selectedSubject: SubjectSelection | null;
  onSelectSubject: (sub: SubjectSelection) => void;
  selectedChapter: ChapterSelection | null;
  onSelectChapter: (ch: ChapterSelection | null) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-h-[80vh]">
        <TextbookSidebar
          expandedClass={sidebarExpandedClass}
          onToggleClass={onSidebarToggleClass}
          selectedSubject={selectedSubject}
          onSelectSubject={onSelectSubject}
          selectedChapter={selectedChapter}
          onSelectChapter={onSelectChapter}
        />
      </div>
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[80vh] overflow-hidden">
        <TextbookView selectedSubject={selectedSubject} selectedChapter={selectedChapter} />
      </div>
    </div>
  );
}
