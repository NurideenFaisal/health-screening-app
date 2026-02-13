// Form.jsx
import React from 'react'
import { useParams } from 'react-router-dom'

export default function Form() {
  const { id } = useParams() // get patient ID from URL

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">This is the form</h2>
      <p>Patient ID: {id}</p>
    </div>
  )
}
