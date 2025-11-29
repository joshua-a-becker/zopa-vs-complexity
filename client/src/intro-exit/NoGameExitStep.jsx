import React from "react";
import { Button } from "../components/Button";

export function NoGameExitStep({ next }) {
  return (
    <div className="mt-3 sm:mt-5 p-20">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Unable to Assign You to a Game
      </h3>
      <div className="mt-2 mb-6">
        <p className="text-sm text-gray-500">
          We're sorry, we could not assign you to a game and didn't want to keep you waiting.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Please provide the code <strong className="text-lg font-bold">NOGAME25</strong> to receive a reduced payment.
        </p>
      </div>
    </div>
  );
}
