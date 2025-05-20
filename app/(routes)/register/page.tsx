"use client"

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Camera, Check, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MetaMaskConnector } from "@/components/metamask-connector"
import { Steps } from "@/components/steps"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Web3 from "web3"

type FaceStatus = 'no_face' | 'face_turned' | 'eyes_closed' | 'correct';

export default function RegisterPage() {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  //const [faceScan, setFaceScan] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: ""
  })
  
  const webcamRef = useRef<Webcam>(null)


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<string>('Loading face detection...');
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success'>('info');
  const [currentStatus, setCurrentStatus] = useState<FaceStatus | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);
  const [capturedImage, setCapturedImage ] = useState<any | null>(null);
  
 
  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed")
      }

      const web3 = new Web3(window.ethereum)

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const accounts = await web3.eth.getAccounts()

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

  const retakeImage = () => {
    setCapturedImage(null)
    setHasCaptured(false)
  }

  const handleRegister = async () => {
   
    if (!account || !capturedImage) {
      setError("Missing required data")
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      // Convert base64 image to blob with compression
      const base64Data = capturedImage.split(',')[1]
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

      sessionStorage.setItem("wallet_address", account)
      sessionStorage.setItem("user_firstname", userDetails.firstName)
      sessionStorage.setItem("user_lastname", userDetails.lastName)
      sessionStorage.setItem("user_email", userDetails.email)

      router.push("/campaigns")

    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setIsRegistering(false)
    }
  }

  useEffect(() => {
      const loadModels = async () => {
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
            faceapi.nets.faceExpressionNet.loadFromUri('/models'),
          ]);
          setIsModelLoading(false);
          setMessage('Please position your face in front of the camera');
          setMessageType('info');
        } catch (error) {
          console.error('Error loading models:', error);
          setMessage('Error loading face detection models');
          setMessageType('warning');
        }
      };
  
      loadModels();
    }, []);
  
    useEffect(() => {

      if (isModelLoading) return;
      const detectFace = async () => {
        if (hasCaptured) return;
        if (!webcamRef.current || !canvasRef.current) return;
  
        const video = webcamRef.current.video;
        if (!video) return;
  
        const canvas = canvasRef.current;
        const displaySize = { width: video.width, height: video.height };
        if (!video || video.readyState < 2 || video.width === 0 || video.height === 0) return;
        faceapi.matchDimensions(canvas, displaySize);
        
  
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
  
        if (detections.length === 0) {
          if (currentStatus !== 'no_face') {
            setCurrentStatus('no_face');
            setMessage('No face detected');
            setMessageType('warning');
          }
          return;
        }
  
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  
        const landmarks = detections[0].landmarks;
        
        // Get eye landmarks using the exact indices from the provided code
        const leftTop = landmarks.getLeftEye()[1];    // 159
        const leftBottom = landmarks.getLeftEye()[5]; // 145
        const rightTop = landmarks.getRightEye()[1];  // 386
        const rightBottom = landmarks.getRightEye()[5]; // 374
  
        // Calculate eye openness using the exact formula
        const leftEyeOpen = Math.abs(leftTop.y - leftBottom.y);
        const rightEyeOpen = Math.abs(rightTop.y - rightBottom.y);
        const eyesClosed = (leftEyeOpen + rightEyeOpen) / 2 < 6;
        
  
        // Face alignment check using the exact indices
        const leftEye = landmarks.getLeftEye()[0];    // 33
        const rightEye = landmarks.getRightEye()[3];  // 263
        const noseTip = landmarks.getNose()[6];       // 1
  
        const faceCenterX = (leftEye.x + rightEye.x) / 2;
        const deviation = Math.abs(noseTip.x - faceCenterX);
        
  
        let newStatus: FaceStatus;
        // Match the exact order of checks from the provided code
        if (eyesClosed) {
          newStatus = 'eyes_closed';
        } else if (deviation > 0.8) {
          newStatus = 'face_turned';
        } else {
          newStatus = 'correct';
        }

        if (newStatus !== currentStatus) {
          setCurrentStatus(newStatus);
          switch (newStatus) {
            case 'face_turned':
              setMessage('Please center your face');
              setMessageType('warning');
              break;
            case 'eyes_closed':
              setMessage('Please open your eyes');
              setMessageType('warning');
              break;
            case 'correct':
              setMessage('Face is aligned correctly');
              setMessageType('success');
              // Only capture if we haven't captured before
              if (!hasCaptured && webcamRef.current) {
                const imageSrc = webcamRef.current.getScreenshot();
                if (imageSrc) {
                  setCapturedImage(imageSrc);
                  setHasCaptured(true);
                  setMessage('Image captured successfully!');
                }
              }
              break;
          }
        }
      };
      const interval = setInterval(detectFace, 100);
      return () => clearInterval(interval);
    }, [isModelLoading, currentStatus,hasCaptured]);
  
    const getMessageStyle = () => {
      switch (messageType) {
        case 'warning':
          return 'bg-yellow-100 border-yellow-400 text-yellow-800';
        case 'success':
          return 'bg-green-100 border-green-400 text-green-800';
        default:
          return 'bg-blue-100 border-blue-400 text-blue-800';
      }
    };

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
              <div className={`relative mb-8 shadow-lg rounded-lg overflow-hidden bg-slate-800 ${hasCaptured ? 'hidden' : ''}`}>
                <Webcam
                  ref={webcamRef}
                  className="rounded-lg"
                  width={640}
                  height={480}
                  videoConstraints={{
                    facingMode: 'user',
                  }}
                  screenshotFormat="image/jpeg"
                  onUserMedia={() => {
                    if (webcamRef.current && canvasRef.current) {
                      const video = webcamRef.current.video;
                      const canvas = canvasRef.current;
                      if (video && canvas) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                      }
                    }
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>

              <div className={`relative ${!hasCaptured ? 'hidden' : ''}`}>
                {capturedImage && (
                  <img src={capturedImage} alt="Captured face" className="w-full" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                  <Check className="h-16 w-16 text-green-500" />
                </div>
              </div>

                </div>
                <div className={`p-4 rounded-lg border ${getMessageStyle()} text-center`}>
                  <p className="text-sm">{message}</p>
                </div>
                {hasCaptured ? (
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
                ) : null}
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
