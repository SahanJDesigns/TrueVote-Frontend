"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Camera, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MetaMaskConnector } from "@/components/metamask-connector"
import { Steps } from "@/components/steps"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCaptured, setIsCaptured] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [faceScan, setFaceScan] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: ""
  })
  const webcamRef = useRef<Webcam>(null)
  const router = useRouter()

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed")
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      setAccount(accounts[0])
      setStep(2)
    } catch (err: any) {
      setError(err.message || "Failed to connect to MetaMask")
    } finally {
      setIsConnecting(false)
    }
  }

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

  const handleRegister = async () => {
    if (!account || !faceScan) {
      setError("Missing required data")
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      // Convert base64 image to blob with compression
      const base64Data = faceScan.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteArrays = []
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)
        const byteNumbers = new Array(slice.length)
        
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      
      const blob = new Blob(byteArrays, { type: 'image/jpeg' })
      
      // Create a canvas to compress the image
      const img = new Image()
      img.src = URL.createObjectURL(blob)
      
      const compressedFile = await new Promise<File>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800
          const MAX_HEIGHT = 600
          let width = img.width
          let height = img.height
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          // Convert to blob with compression
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'face.jpg', { type: 'image/jpeg' })
              resolve(file)
            }
          }, 'image/jpeg', 0.7) // 0.7 is the compression quality (0.0 to 1.0)
        }
      })

      // Create form data
      const formData = new FormData()
      formData.append('wallet_address', account)
      formData.append('first_name', userDetails.firstName)
      formData.append('last_name', userDetails.lastName)
      formData.append('email', userDetails.email)
      formData.append('biometric_image', compressedFile)

      // Make API call
      const response = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Registration failed')
      }
      router.push("/campaigns")
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Register New Account</CardTitle>
            <CardDescription className="text-slate-300">
              Connect your wallet and set up biometric verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Steps
              steps={[
                { id: 1, name: "Connect Wallet" },
                { id: 2, name: "User Details" },
                { id: 3, name: "Biometric Scan" },
                { id: 4, name: "Complete" },
              ]}
              currentStep={step}
            />

            {error && (
              <Alert variant="destructive" className="bg-red-900/20 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <MetaMaskConnector />
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Wallet"
                  )}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-300">Connected as:</p>
                  <p className="text-sm font-mono text-orange-400 truncate">{account}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                    <Input
                      id="firstName"
                      value={userDetails.firstName}
                      onChange={(e) => setUserDetails(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userDetails.lastName}
                      onChange={(e) => setUserDetails(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userDetails.email}
                      onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter your email"
                    />
                  </div>

                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => setStep(3)}
                    disabled={!userDetails.firstName || !userDetails.lastName || !userDetails.email}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-300">Connected as:</p>
                  <p className="text-sm font-mono text-orange-400 truncate">{account}</p>
                </div>

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
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                        <Check className="h-16 w-16 text-green-500" />
                      </div>
                    </div>
                  )}
                </div>

                {!isCaptured ? (
                  <Button className="w-full" onClick={captureImage}>
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Face Image
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={retakeImage}
                    >
                      Retake
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => setStep(4)}>
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-center">
                <div className="rounded-full bg-green-500/20 p-3 w-16 h-16 mx-auto">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">Ready to Complete</h3>
                <p className="text-slate-300">
                  Your wallet is connected, details are saved, and biometric data has been captured. Click below to complete registration.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            {step === 4 && (
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={handleRegister}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
