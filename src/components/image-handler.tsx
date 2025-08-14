'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X } from 'lucide-react';

interface ImageHandlerProps {
  onImageSelect: (image: string | null) => void;
}

export default function ImageHandler({ onImageSelect }: ImageHandlerProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        onImageSelect(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
      } catch (error) {
        console.error("Error accessing webcam:", error);
        alert("Could not access your webcam. Please check permissions and try again.");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };
  
  useEffect(() => {
    if (activeTab === 'webcam' && !isCameraOn) {
      startCamera();
    } else if (activeTab !== 'webcam' && isCameraOn) {
      stopCamera();
    }
    
    return () => {
      if (isCameraOn) {
        stopCamera();
      }
    };
  }, [activeTab]);


  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setImagePreview(dataUrl);
      onImageSelect(dataUrl);
      stopCamera();
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    onImageSelect(null);
    if (activeTab === 'webcam' && !isCameraOn) {
      startCamera();
    }
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="mr-2 h-4 w-4" /> Upload Photo
          </TabsTrigger>
          <TabsTrigger value="webcam">
            <Camera className="mr-2 h-4 w-4" /> Use Webcam
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <div className="mt-4 flex flex-col items-center gap-4">
            <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} className="max-w-sm" />
            <p className="text-xs text-muted-foreground">Upload a photo of yourself.</p>
          </div>
        </TabsContent>
        <TabsContent value="webcam">
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="relative w-full max-w-sm aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {isCameraOn ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                 <Camera className="h-16 w-16 text-muted-foreground" />
              )}
               <canvas ref={canvasRef} className="hidden" />
            </div>
            {isCameraOn ? (
              <Button onClick={capturePhoto}>
                <Camera className="mr-2 h-4 w-4" /> Capture Photo
              </Button>
            ) : (
                !imagePreview && <Button onClick={startCamera}>Start Camera</Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {imagePreview && (
        <div className="mt-4 text-center">
          <h3 className="font-semibold">Your Image:</h3>
          <div className="relative inline-block mt-2">
            <img src={imagePreview} alt="User preview" className="max-w-xs max-h-64 rounded-lg shadow-md" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 rounded-full h-7 w-7"
              onClick={clearImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
