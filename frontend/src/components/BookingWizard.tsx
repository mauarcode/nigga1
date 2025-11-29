'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

interface BookingStep {
  id: number
  title: string
  description: string
}

interface BookingWizardProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  canProceed: boolean
}

const steps: BookingStep[] = [
  {
    id: 1,
    title: 'Servicio',
    description: 'Elige tu servicio'
  },
  {
    id: 2,
    title: 'Barbero',
    description: 'Selecciona profesional'
  },
  {
    id: 3,
    title: 'Fecha y Hora',
    description: 'Elige cuándo venir'
  },
  {
    id: 4,
    title: 'Confirmación',
    description: 'Revisa tu cita'
  }
]

export default function BookingWizard({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canProceed
}: BookingWizardProps) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-8">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.id < currentStep ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>

                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className={`text-xs ${
                    step.id <= currentStep ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </div>
                </div>

                {step.id < totalSteps && (
                  <div className={`w-16 h-1 mx-4 ${
                    step.id < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
