'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

// Yup validation for step 1
const step1Rules = yup.object({
  businessName: yup
    .string()
    .required('Business name is required')
    .min(2, 'Business name must be at least 2 characters'),
  category: yup.string().required('Please select a category'),
  location: yup
    .string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
})

export default function OnboardingWizard() {
  const [completedSteps, setCompletedSteps] = useState({
    step1: false,
    step2: false,
    step3: false
  })

  const {
    register,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    resolver: yupResolver(step1Rules),
    defaultValues: {
      businessName: '',
      category: '',
      location: ''
    }
  })

  const watchedValues = watch()

  // Check if step 1 is complete whenever anything changes
  useEffect(() => {
    const isStep1Complete =
      !!watchedValues.businessName?.trim() && // Has business name?
      !!watchedValues.category && // Has category?
      !!watchedValues.location?.trim() && // Has location?
      isValid // Passes all Yup rules?

    // Update our completion tracking
    // Only update if the completion status actually changed
    setCompletedSteps((prev) => {
      if (prev.step1 !== isStep1Complete) {
        return {
          ...prev,
          step1: isStep1Complete
        }
      }
      return prev // Don't update if nothing changed
    })
  }, [
    watchedValues.businessName,
    watchedValues.category,
    watchedValues.location,
    isValid
  ])

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
                  className="w-full p-2 border rounded text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter your business name"
                />
                {errors.businessName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.businessName.message}
                  </p>
                )}
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
                  className="w-full p-2 border rounded text-gray-900"
                >
                  <option value="" className="text-gray-400">
                    Select a category
                  </option>
                  <option value="restaurant">Restaurant</option>
                  <option value="retail">Retail</option>
                  <option value="services">Services</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.category.message}
                  </p>
                )}
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
                  className="w-full p-2 border rounded text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g., New York, NY"
                />
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.location.message}
                  </p>
                )}
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
