'use client'

import React from 'react'
import * as hookForm from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// Yup validation schema
const schema = yup.object().shape({
  businessname: yup.string().required('Business name is required'),
  category: yup.string().required('Category is required'),
  location: yup.string().required('Location is required')
})

// Business Name, Category, Location
//form data interface
interface IFormInput {
  businessname: string
  category: string
  location: string
}

export const Form: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = hookForm.useForm<IFormInput>({
    resolver: yupResolver(schema),
    mode: 'onChange'
  })

  const onSubmit = (data: IFormInput) => {
    console.log(data)
    //have to do step 2
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label> Business Name</label>
      <input {...register('businessname')} />
      {errors.businessname && <p>{errors.businessname.message}</p>}

      <label>Category</label>
      <input {...register('category')} />
      {errors.category && <p>{errors.category.message}</p>}

      <label>Location</label>
      <input {...register('location')} />
      {errors.location && <p>{errors.location.message}</p>}

      <button type="submit" disabled={!isValid}>
        Next
      </button>
    </form>
  )
}
