'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'

export default function OnboardingWizard() {
  // Steps 1 -3 states on top

  const {
    register,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleSubmit
  } = useForm({
    defaultValues: {
      businessName: '',
      category: '',
      location: ''
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      businessName: '',
      category: '',
      location: ''
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [completedSteps, setCompletedSteps] = useState({
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

        {/*Business Content Card*/}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {/* step 1 for now */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Step 1: Business Info
            </h2>
            <div className="space-y-6">
              {/* Business Name Input */}
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Name
                </label>
                <input
                  {...register('businessName')}
                  type="text"
                  id="businessName"
                  className="w-full p-2 border rounded placeholder:text-gray-600"
                  placeholder="Enter your business name"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category
                </label>
                <select
                  {...register('category')}
                  id="category"
                  className="w-full p-2 border rounded placeholder:text-gray-600"
                >
                  <option value="">Select a category</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="retail">Retail</option>
                  <option value="services">Services</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Location Input */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Location
                </label>
                <input
                  {...register('location')}
                  type="text"
                  id="location"
                  className="w-full p-2 border rounded placeholder:text-gray-600"
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>
          </div>

          {/* step 2 for now */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Step 2: Connect Socials
            </h2>
            <div className="text-gray-500 p-4 bg-gray-50 rounded">
              Social Media Buttons later
            </div>
          </div>

          {/* step 3 for now */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Step 3: Preferences
            </h2>
            <div className="text-gray-500 p-4 bg-gray-50 rounded">
              Set Preferences
            </div>
          </div>

          <div className="flex justify-between">
            <button className="px-6 py-2 rounded-md font-medium transition-colors bg-gray-300 text-gray-500">
              Previous
            </button>
            <button
              disabled={!allStepsComplete}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                allStepsComplete
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}