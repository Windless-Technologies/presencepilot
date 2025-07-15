'use client'

import React, { useState } from 'react'

export default function OnboardingWizard() {
  // Steps 1 -3 states on top

  const [completedSteps] = useState({
    step1: false,
    step2: false,
    step3: false
  })

  // if all steps aka 3 parts of form are done then next button activate!

  const allStepsComplete =
    completedSteps.step1 && completedSteps.step2 && completedSteps.step3

  return (
    <div className="min-h-screen bg-green-200 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-gray-500">Onboarding Wizard</h1>
        <p className="text-gray-500">
          Steps complete: {allStepsComplete ? 'All done!' : 'In progress'}
        </p>

        <div className="flex items-center">
          <div className="flex items-center space-x-8">
            {/* Step 1 */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${completedSteps.step1 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}
              >
                1
              </div>
              <span className="ml-2 text-sm text-gray-500">Business Info</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${completedSteps.step2 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}
              >
                2
              </div>
              <span className="ml-2 text-sm text-gray-500">Connect</span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${completedSteps.step3 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}
              >
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Preferences</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
