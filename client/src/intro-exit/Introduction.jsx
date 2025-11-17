import React from "react";
import { Button } from "../components/Button";

export function Introduction({ next }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome to the Negotiation Club
          </h1>
          <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="space-y-6 text-gray-700">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What to Expect</h2>
            <p className="text-base leading-relaxed">
              This platform will match you with another participant, provide you with role materials for a negotiation, and then give you <span className="font-semibold">10 minutes to prepare</span>.
            </p>
          </div>

          <p className="text-base leading-relaxed">
            After 10 minutes, you will be automatically placed into a <span className="font-semibold">video chat</span> with your negotiation counterpart.
          </p>

          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-lg">
            <p className="text-base leading-relaxed">
              You will have <span className="font-semibold">30 minutes</span> to try to reach a satisfactory agreement. Your goal is to get as many points as possible.
            </p>
            <p className="text-base leading-relaxed mt-3">
              Your scoresheet will include a "no alternative" points value. <span className="font-semibold text-red-600">You must not accept any deal worth fewer points than this alternative.</span>
            </p>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
            <p className="text-base leading-relaxed font-semibold">
              This session is being conducted as part of research by University College London. We will be recording this session for use in our research.
            </p>
            <p className="text-base leading-relaxed mt-3">
              <span className="font-medium">Principal Investigator:</span> Joshua Becker
              <br/>
              <span className="font-medium">Contact:</span> <a href="mailto:joshua.becker@ucl.ac.uk" className="text-indigo-600 hover:text-indigo-800 underline">joshua.becker@ucl.ac.uk</a>
            </p>
          </div>

          <p className="text-base leading-relaxed text-center text-gray-600 pt-4">
            The next page will ask you to provide formal consent for your data to be used.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button handleClick={next} autoFocus>
            <span className="text-lg px-4">Continue to Consent Form</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
