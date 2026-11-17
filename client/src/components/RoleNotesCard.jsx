import React, { useState } from "react";
import Markdown from "react-markdown";
import { NotesBox } from "./NotesBox";

// Left column of the negotiation screen (layout ported from creative-negotiation):
// a white card with Role / Notes / Instructions tabs. The card grows with its
// content and scrolls with the page (no inner scroll box).
//   roleNarrative   Markdown role text
//   instructions    content for the Instructions tab (omit to hide the tab)
//   notesAttribute  player key the notes are saved under (see NotesBox)
//   onQuit          when given, a Quit button sits after the tabs
export function RoleNotesCard({ roleNarrative, instructions, notesAttribute = "notes", onQuit }) {
  const [roleTab, setRoleTab] = useState("narrative"); // "narrative" | "notes" | "instructions"

  const tabs = [
    ["narrative", "Role", "Your Role"],
    ["notes", "Notes", "Your Notes"],
    ...(instructions ? [["instructions", "Instructions", "Instructions"]] : []),
  ];
  const title = tabs.find(([tab]) => tab === roleTab)?.[2];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 bg-gray-200 rounded-lg">
            {tabs.map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setRoleTab(tab)}
                className={`px-4 py-2 rounded-md text-base font-bold transition-all ${
                  roleTab === tab
                    ? "bg-blue-600 text-white shadow"
                    : "text-gray-700 hover:bg-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {onQuit && (
            <button
              onClick={onQuit}
              className="px-4 py-2 rounded-lg text-base font-bold transition-all border border-gray-300 bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              Quit
            </button>
          )}
        </div>
      </div>
      {roleTab === "notes" ? (
        <NotesBox className="h-[60vh]" attribute={notesAttribute} />
      ) : roleTab === "instructions" ? (
        instructions
      ) : (
        <div className="prose prose-gray max-w-none text-gray-700 leading-snug prose-p:my-2 prose-li:my-0.5 prose-headings:my-3">
          <Markdown>{roleNarrative}</Markdown>
        </div>
      )}
    </div>
  );
}
