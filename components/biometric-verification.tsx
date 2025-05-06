"use client"

import React, { useState, useRef } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, Check, X, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Checkbox } from "./ui/checkbox"

interface BiometricVerificationProps {
  verified: boolean
  setVerified: React.Dispatch<React.SetStateAction<boolean>>
}

export function BiometricVerification({verified, setVerified}: BiometricVerificationProps) {
  const [isCaptured, setIsCaptured] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [faceScan, setFaceScan] = useState<string | null>(null)
  const webcamRef = useRef<Webcam>(null)
  const [showpopup, setShowPopup] = useState(false)


  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      setFaceScan(imageSrc)
      setIsCaptured(true)
    }
  }

  const retakeImage = () => {
    setFaceScan(null)
    setIsCaptured(false)
  }

  const verifyBiometric = async () => {
    setIsVerifying(true)

    try {
      // Simulate biometric verification process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In a real app, you would send the face scan to your biometric verification service
      // and get a response indicating whether the verification was successful
      setVerified(true)
      // For this demo, we'll simulate a successful verification
    } catch (error) {

    } finally {
      setIsVerifying(false)
    }
  }

  const cancelVerification = () => {
    setShowPopup(false)
  }

  return (
    <>
    <div className="flex flex-col space-y-4">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="recaptcha"
          checked={verified}
          onCheckedChange={()=> {setShowPopup(showpopup => !showpopup); }}
          className="mt-1"
        />
        <div className="space-y-1">
          <label
            htmlFor="recaptcha"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white cursor-pointer"
          >
            I am the rightful owner.
          </label>
            <p className="text-xs text-slate-400">
            This helps us prevent fraud voting and ensures the integrity of the election.
            </p>
        </div>
      </div>
      <div className="flex items-center justify-center text-xs text-slate-500">   
            <Shield className="h-3 w-3 mr-1" />
        <span>Protected by Biometric Auth</span>
        </div>
    </div>

     {showpopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="border-slate-700 bg-slate-800/95 backdrop-blur-sm w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Biometric Verification</CardTitle>
              <CardDescription className="text-slate-400">
                Please complete the face scan to verify your identity before voting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border border-slate-700">
                  {!isCaptured ? (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 320,
                        height: 240,
                        facingMode: "user",
                      }}
                      className="w-full"
                    />
                  ) : (
                    <div className="relative">
                      <img src={faceScan || ""} alt="Captured face" className="w-full" />
                      {isVerifying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isCaptured ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={cancelVerification}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={captureImage}>
                      <Camera className="mr-2 h-4 w-4" />
                      Capture Face
                    </Button>
                  </div>
                ) : !isVerifying ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={retakeImage}
                    >
                      Retake
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={verifyBiometric}>
                      <Check className="mr-2 h-4 w-4" />
                      Verify Identity
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-slate-300">
                    <p>Verifying your identity...</p>
                  </div>
                )}
              </div>
              </CardContent>
            </Card>
        </div>)}
    </>
  )
}
