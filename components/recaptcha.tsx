"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Check } from "lucide-react"

interface ReCaptchaProps {
  onVerify: () => void
}

export function ReCaptcha({ onVerify }: ReCaptchaProps) {
  const [isChecked, setIsChecked] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handleVerify = () => {
    if (!isChecked) return

    setIsVerifying(true)

    // Simulate verification process
    setTimeout(() => {
      setIsVerifying(false)
      setIsVerified(true)
      onVerify()
    }, 1500)
  }

  if (isVerified) {
    return (
      <div className="flex items-center justify-center p-4 bg-green-900/20 border border-green-800 rounded-md">
        <Check className="h-5 w-5 text-green-500 mr-2" />
        <span className="text-green-400">Verification complete</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="recaptcha"
          checked={isChecked}
          onCheckedChange={(checked) => setIsChecked(checked as boolean)}
          className="mt-1"
        />
        <div className="space-y-1">
          <label
            htmlFor="recaptcha"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
          >
            I'm not a robot
          </label>
          <p className="text-xs text-slate-400">
            This helps us prevent automated voting and ensures the integrity of the election.
          </p>
        </div>
      </div>

      {isChecked && !isVerified && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-slate-700 rounded-md flex items-center justify-center">
                <img
                  src={`/placeholder.svg?height=60&width=60&text=${i + 1}`}
                  alt={`Verification image ${i + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            ))}
          </div>

          <Button className="w-full bg-slate-700 hover:bg-slate-600" onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-center text-xs text-slate-500">
        <Shield className="h-3 w-3 mr-1" />
        <span>Protected by reCAPTCHA</span>
      </div>
    </div>
  )
}
