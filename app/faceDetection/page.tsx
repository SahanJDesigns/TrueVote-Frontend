'use client';

import { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { useFaceDetection } from '../context/FaceDetectionContext';

type FaceStatus = 'no_face' | 'face_turned' | 'eyes_closed' | 'correct';

export default function FaceDetection() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<string>('Loading face detection...');
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success'>('info');
  const [currentStatus, setCurrentStatus] = useState<FaceStatus | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);
  const { capturedImage, setCapturedImage } = useFaceDetection();

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
      if (!webcamRef.current || !canvasRef.current) return;

      const video = webcamRef.current.video;
      if (!video) return;

      const canvas = canvasRef.current;
      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

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
            if (!hasCaptured) {
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
  }, [isModelLoading, currentStatus, setCapturedImage, hasCaptured]);

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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Face Detection</h1>
      <div className="relative mb-8 shadow-lg rounded-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          className="rounded-lg"
          width={640}
          height={480}
          videoConstraints={{
            facingMode: 'user',
          }}
          screenshotFormat="image/jpeg"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          width={640}
          height={480}
        />
      </div>
      <div className={`w-full max-w-md p-4 rounded-lg border-2 ${getMessageStyle()} shadow-md`}>
        <div className="flex items-center">
          {messageType === 'warning' && (
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {messageType === 'success' && (
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {messageType === 'info' && (
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <p className="text-lg font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}
