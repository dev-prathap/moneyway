'use client';

import React, { useRef, useState } from 'react';
import { Camera, X, Upload, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export function CameraCapture({ onCapture, onClose, isProcessing = false }: CameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  React.useEffect(() => {
    // Auto-start camera when component mounts
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('Requesting camera access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }
        }
      });
      
      console.log('Camera stream obtained:', mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Stream set to video element');
        
        // Wait for video to be ready
        await new Promise(resolve => {
          videoRef.current!.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            resolve(null);
          };
        });
        
        await videoRef.current.play();
        console.log('Video playing');
      }
      
      setStream(mediaStream);
      setCameraActive(true);
      console.log('Camera active');
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Unable to access camera: ' + err.message);
        }
      } else {
        setError('Unable to access camera. Please check permissions.');
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Auto-process the captured image immediately
    onCapture(imageData);
    
    // Close the camera modal
    onClose();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Capture Document
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Image Display */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              {error && (
                <div className="aspect-video flex flex-col items-center justify-center p-8">
                  <p className="text-red-600 text-center">{error}</p>
                </div>
              )}

              {!capturedImage && !error && cameraActive && (
                <div className="relative bg-black">
                  <video
                    ref={videoRef}
                    className="w-full aspect-video object-cover bg-black"
                    autoPlay
                    playsInline
                    muted
                    style={{ transform: 'scaleX(-1)', WebkitTransform: 'scaleX(-1)' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-white border-dashed rounded-lg w-3/4 h-3/4 flex items-center justify-center">
                      <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                        Position document within frame
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!capturedImage && !error && !cameraActive && (
                <div className="aspect-video flex flex-col items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mb-4"></div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Starting Camera...</h4>
                  <p className="text-sm text-gray-500 text-center">
                    Please allow camera permissions when prompted
                  </p>
                </div>
              )}

              {capturedImage && (
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured document"
                    className="w-full aspect-video object-cover"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm">Processing image...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-2 justify-center">
              {cameraActive && !capturedImage && (
                <Button onClick={capturePhoto} size="lg" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Capture Photo
                </Button>
              )}

              {capturedImage && !isProcessing && (
                <>
                  <Button variant="outline" onClick={retakePhoto} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </Button>
                  <Button onClick={confirmPhoto} className="gap-2">
                    <Check className="h-4 w-4" />
                    Process Image
                  </Button>
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center space-y-1">
              <div>📄 Select a clear photo of the document</div>
              <div>🤖 AI will extract name and phone number automatically</div>
              <div>📱 Works with photos from camera or gallery</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for capturing video frame */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
