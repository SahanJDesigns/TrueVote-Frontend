"use client"

import React, { useState, useRef } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Loader2, Camera, Check, X, Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Checkbox } from "./ui/checkbox"
import { set } from "date-fns"

interface BiometricVerificationProps {
  account: string
  verified: boolean
  setVerified: React.Dispatch<React.SetStateAction<boolean>>
  attemptnumber: number
  setAttemptNumber: React.Dispatch<React.SetStateAction<number>>
  setSpoofingScore: React.Dispatch<React.SetStateAction<number>>
  setFaceMatchScore: React.Dispatch<React.SetStateAction<number>>
}

export function BiometricVerification({verified, setVerified,attemptnumber,setAttemptNumber,account,setSpoofingScore,setFaceMatchScore}: BiometricVerificationProps) {
  const [isCaptured, setIsCaptured] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [faceScan, setFaceScan] = useState<string | null>(null)
  const webcamRef = useRef<Webcam>(null)
  const [showpopup, setShowPopup] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const captureImage = () => {
    setError(null)
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
      setAttemptNumber(attemptnumber => attemptnumber + 1)
      if (!account) {
        console.error("Missing required field: wallet_address");
        setIsVerifying(false);
        return;
      }

      if (!faceScan) {
        console.error("Missing required field: biometric_image");
        setIsVerifying(false);
        return;
      }

      const formData = new FormData();
      formData.append("wallet_address", account);
      if (faceScan) {
        const blob = await (await fetch(faceScan)).blob(); // Convert base64 to Blob
        formData.append("biometric_image", blob, "face_scan.jpg"); // Append as file
      }

      const response = await fetch("http://localhost:8000/api/users/biometric_auth", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json()
  
      if (data.is_match) {
        setVerified(true)
        setSpoofingScore(data.spoofing_score)
        setFaceMatchScore(data.face_match_score)
        setShowPopup(false)
        setError(null)
      }
      else {
        throw new Error("Biometric verification failed. Please try again.")
      }

    } catch (error) {
      console.error("Error during biometric verification:", error)
      setError("Biometric verification failed. Please try again.")
      setVerified(false)
    } finally {
      setIsVerifying(false)
      setFaceScan(null)
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
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground cursor-pointer"
          >
            I am the rightful owner.
          </label>
            <p className="text-xs text-foreground">
            This helps us prevent fraud voting and ensures the integrity of the election.
            </p>
        </div>
      </div>
      <div className="flex items-center justify-center text-xs text-foreground">   
            <Shield className="h-3 w-3 mr-1" />
        <span>Protected by Biometric Auth</span>
        </div>
    </div>

     {showpopup && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4">
          <Card className="border-slate-700 bg-card backdrop-blur-sm w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">Biometric Verification</CardTitle>
              <CardDescription className="text-foreground">
                Please complete the face scan to verify your identity before voting
              </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-400 text-sm">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
                )}
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
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!isCaptured ? (
                  !error ? (
                  <div className="flex gap-2">
                    <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-foreground hover:bg-mute"
                    onClick={cancelVerification}
                    >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                    </Button>
                    <Button
                    className="flex-1 bg-destructive hover:bg-destructive-foreground"
                    onClick={captureImage}
                    >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Face
                    </Button>
                  </div>
                  ) : (
                  <div className="flex gap-2">
                    <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-foreground hover:bg-mute"
                    onClick={cancelVerification}
                    >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                    </Button>
                    <Button
                    className="flex-1 bg-destructive hover:bg-destructive-foreground"
                    onClick={captureImage}
                    >
                    <Camera className="mr-2 h-4 w-4" />
                    Retry
                    </Button>
                  </div>
                  )
                ) : !isVerifying ? (
                  <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-600 text-foreground hover:bg-mute"
                    onClick={retakeImage}
                  >
                    Retake
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={verifyBiometric}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Verify Identity
                  </Button>
                  </div>
                ) : (
                  <div className="text-center text-foreground">
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
