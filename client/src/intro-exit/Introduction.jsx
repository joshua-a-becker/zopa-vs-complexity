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
              You will be assigned a fictional role as a member of a group planning a vacation.  
            </p>
            <br/>
            <p className="text-base leading-relaxed">
            You will have <span className="font-semibold">5 minutes to read and prepare</span>. After 5 minutes, you will be automatically placed into a <span className="font-semibold">video chat</span> with your negotiation group.
          </p>
          <br/>
            <p className="text-base leading-relaxed">
              You will have <span className="font-semibold">20 minutes</span> to try to reach a satisfactory agreement. Your goal is to get as many points as possible.  
            </p>
            <br/><p className="text-base leading-relaxed">
              Points determine your bonus on Prolific. 1 point = $1 dollar.
            </p>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
            
          

          <p className="text-base leading-relaxed">
            If you are not comfortable being on video, please close this page and return the task on Prolific.
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
