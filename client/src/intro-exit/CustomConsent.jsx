import React, { useEffect } from "react";
import { Button } from "../components/Button.jsx";

export default function CustomConsent({ next }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-10 md:p-14 border border-gray-200">
        {/* Header Section */}
        <div className="border-b-2 border-gray-300 pb-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 text-center mb-2">
            Research Consent Form
          </h1>
          <p className="text-center text-gray-600 font-medium">
            University College London
          </p>
        </div>

        {/* Document Content */}
        <div className="space-y-6 text-gray-800 leading-relaxed">
          {/* Introduction */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-5">
            <p className="text-base">
              By participating in this activity, you are agreeing to the use of your data for research on negotiation and decision making.
            </p>
            <p className="text-base mt-3">
              We will be recording the video and chat data in this activity. You can disable your video and sound at any point during the activity.
            </p>
          </div>

          {/* Purpose */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 font-serif border-l-4 border-indigo-600 pl-4">
              Purpose of the Research
            </h2>
            <p className="text-base ml-5">
              We are trying to understand how people seek agreement in classroom negotiation exercises. This research seeks to improve negotiation education and identify methods for improving outcomes by practicing negotiators.
            </p>
          </section>

          {/* Procedures */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 font-serif border-l-4 border-indigo-600 pl-4">
              Procedures
            </h2>
            <p className="text-base ml-5">
              You will be provided with a role narrative and a scoresheet. You will be placed into a video chat with two other participants. Your goal in the activity is to maximize the number of points obtained for your role by reaching the best possible agreement, or earning the points of your no-agreement alternative.
            </p>
          </section>

          {/* Safety Statement */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 font-serif border-l-4 border-amber-600 pl-4">
              Safety Statement
            </h2>
            <p className="text-base ml-5">
              This session poses the same discomforts you may expect to encounter in a typical classroom setting. You will be negotiating live with other participants and we cannot control your experience. Negotiation exercises can be challenging, and you may encounter rude or argumentative behavior.
            </p>
          </section>

          {/* Benefits */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 font-serif border-l-4 border-green-600 pl-4">
              Benefits
            </h2>
            <p className="text-base ml-5">
              By participating, you will receive practice negotiating comparable to university classroom exercises.  After the task is completed, we will provide you a link to free resources to improve your negotiation skills.
            </p>
          </section>

          {/* Anonymity */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 font-serif border-l-4 border-indigo-600 pl-4">
              Anonymity
            </h2>
            <p className="text-base ml-5">
              All data will be anonymized prior to analysis. No identifying information will shared outside this research team. All personal data will be stored securely within a UCL research data environment.
            </p>
          </section>
        </div>

        {/* Consent Statement */}
        <div className="mt-10 pt-6 border-t-2 border-gray-300">
          <div className="bg-indigo-50 border-2 border-indigo-300 rounded-md p-6">
            <p className="text-base font-semibold text-gray-900 text-center">
              By clicking "I Consent" below, you acknowledge that you have read and understood this consent form and agree to participate in this research study.
            </p>
          </div>
        </div>

        {/* Button */}
        <div className="mt-8 flex justify-center">
          <Button handleClick={next} autoFocus>
            <span className="text-lg px-8 py-1">I Consent</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
