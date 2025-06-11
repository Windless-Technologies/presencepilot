import React from 'react'
import { useForm } from 'react-hook-form'
// import { yupResolver } from "@hookform/resolvers/yup";
// import * yup from "yup";
import './Form.css'

// Business Name, Category, Location
interface IformInput {
  businessname: string
  category: string
  location: string
}

export const Form: React.FC = () => {
  const { register, handleSubmit } = useForm<IformInput>()

  const onSubmit = (data: IformInput) => {
    console.log(data)
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
