import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import './Form.css'

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
    handleSubmit
    // formState: { errors, isValid },
  } = useForm<IFormInput>({
    resolver: yupResolver(schema),
    mode: 'onChange'
  })

  const onSubmit = (data: IFormInput) => {
    console.log(data)
    //have to do step 2
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>Name</label>
      <input {...register('businessname')} />

      <label>Address</label>
      <input {...register('category')} />

      <label>Address</label>
      <input {...register('location')} />
      <input type="submit" />
    </form>
  )
}
