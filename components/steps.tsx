interface Step {
  id: number
  name: string
}

interface StepsProps {
  steps: Step[]
  currentStep: number
}

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700">
        <div
          className="absolute top-0 left-0 h-0.5 bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
      <ol className="relative flex justify-between">
        {steps.map((step) => (
          <li key={step.id} className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                step.id < currentStep
                  ? "border-orange-500 bg-orange-500 text-white"
                  : step.id === currentStep
                    ? "border-orange-500 bg-slate-900 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-500"
              }`}
            >
              {step.id}
            </div>
            <span className={`mt-2 text-xs ${step.id <= currentStep ? "text-white" : "text-slate-500"}`}>
              {step.name}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
