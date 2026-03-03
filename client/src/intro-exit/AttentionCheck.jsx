import React, { useState } from "react";
import { Button } from "../components/Button.jsx";

const questions = [
  {
    prompt: "How many proposals can you make during the activity?",
    options: [
      { label: "One", value: "a" },
      { label: "Up to 10", value: "b" },
      { label: "As many as you need to reach agreement", value: "c" },
    ],
    correct: "c",
  },
  {
    prompt: "In this activity you can\u2026",
    options: [
      { label: "Make proposals", value: "a" },
      { label: "Vote on others' proposals", value: "b" },
      { label: "Modify proposals", value: "c" },
      { label: "All of the above", value: "d" },
    ],
    correct: "d",
  },
];

export function AttentionCheck({ next }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // "correct" | "incorrect"

  const q = questions[questionIndex];

  function handleSubmit() {
    if (selected === null) return;

    if (selected === q.correct) {
      setFeedback("correct");
    } else {
      setFeedback("incorrect");
    }
  }

  function handleNext() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelected(null);
      setFeedback(null);
    } else {
      next();
    }
  }

  function handleRetry() {
    setSelected(null);
    setFeedback(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-wide uppercase">
            Comprehension Check
          </h1>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="p-2" style={{ minHeight: "18rem" }}>
          <p className="text-lg font-bold text-gray-900 mb-6">
            {q.prompt}
          </p>

          <ul className="space-y-3">
            {q.options.map((opt) => {
              let classes =
                "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors";

              if (feedback === "correct" && opt.value === q.correct) {
                classes += " border-green-500 bg-green-50";
              } else if (feedback === "incorrect" && opt.value === selected) {
                classes += " border-red-500 bg-red-50";
              } else if (selected === opt.value && !feedback) {
                classes += " border-indigo-500 bg-indigo-50";
              } else {
                classes += " border-gray-200 hover:border-gray-300";
              }

              if (feedback) {
                classes += " pointer-events-none";
              }

              return (
                <li
                  key={opt.value}
                  className={classes}
                  onClick={() => setSelected(opt.value)}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selected === opt.value
                        ? "border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {selected === opt.value && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    )}
                  </span>
                  <span className="text-lg text-gray-800">{opt.label}</span>
                </li>
              );
            })}
          </ul>

        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Question {questionIndex + 1} of {questions.length}
          </span>

          {!feedback && (
            <Button handleClick={handleSubmit} autoFocus>
              <span className="text-lg px-4">Submit</span>
            </Button>
          )}
          {feedback === "incorrect" && (
            <Button handleClick={handleRetry} autoFocus>
              <span className="text-lg px-4">Try Again</span>
            </Button>
          )}
        </div>

        {feedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
              {feedback === "correct" ? (
                <>
                  <p className="text-2xl font-bold text-green-600 mb-6">Correct!</p>
                  <button
                    onClick={handleNext}
                    autoFocus
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-bold text-lg"
                  >
                    {questionIndex < questions.length - 1 ? "Next Question" : "Continue"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-red-600 mb-2">Incorrect</p>
                  <p className="text-gray-600 mb-6">Please try again.</p>
                  <button
                    onClick={handleRetry}
                    autoFocus
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 font-bold text-lg"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
