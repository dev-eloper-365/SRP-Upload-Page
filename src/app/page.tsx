'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const API_KEY = "851ee2036557883b14a629aa78894331bd1db831"
const API_URL = "https://api.platerecognizer.com/v1/plate-reader/"

export default function Home() {
  const [dragActive, setDragActive] = useState(false)
  const [recognizedPlate, setRecognizedPlate] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [arrivalTime, setArrivalTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const processImage = async (file: File) => {
    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('upload', file)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${API_KEY}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to recognize license plate')
      }

      const data = await response.json()
      if (data.results && data.results.length > 0) {
        const plate = data.results[0].plate.toUpperCase()
        setRecognizedPlate(plate)
        await sendToMongoDB(plate)
      } else {
        setError('No license plate detected')
      }
    } catch (err) {
      setError('Error processing image')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const sendToMongoDB = async (plate: string) => {
    console.log(new Date().toLocaleTimeString);
    
    try {
      const response = await fetch('/api/parkingData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          no: Date.now(),
          type: 'Car',
          noPlate: plate,
          timeIn: new Date().toLocaleTimeString(),
          timeOut: '-',
          duration: '-',
          blockId: '0x' + Math.random().toString(16).slice(2, 10),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save parking data')
      }
    } catch (err) {
      console.error('Error saving to MongoDB:', err)
    }
  }

  const handleImageUpload = async (file: File) => {
    setUploadedImage(URL.createObjectURL(file))
    setArrivalTime(new Date().toLocaleTimeString())
    await processImage(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleImageUpload(e.target.files[0])
    }
  }

  const resetForm = () => {
    setUploadedImage(null)
    setRecognizedPlate(null)
    setArrivalTime(null)
    setError(null)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <h1 className="mb-8 text-3xl font-bold text-center">
        Automatic License No. Plate Recognition using AI and BlockChain
      </h1>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div
            className={`relative flex h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              dragActive ? 'border-primary bg-secondary/50' : 'border-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploadedImage ? (
              <img
                src={uploadedImage}
                alt="Uploaded license plate"
                className="h-full w-full object-cover rounded-lg"
              />
            ) : (
              <>
                <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-center text-muted-foreground">
                  Drag and drop license plate image or click to upload
                </p>
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileInput}
                  accept="image/*"
                />
              </>
            )}
          </div>
          {isLoading && (
            <div className="mt-4 text-center">
              <p>Processing image...</p>
            </div>
          )}
          {error && (
            <div className="mt-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          )}
          {recognizedPlate && (
            <div className="mt-4 text-center">
              <p className="font-medium">Recognized Plate:</p>
              <p className="text-xl font-bold">{recognizedPlate}</p>
            </div>
          )}
          {arrivalTime && (
            <div className="mt-4 text-center">
              <p className="font-medium">Arrival Time:</p>
              <p className="text-xl font-bold">{arrivalTime}</p>
            </div>
          )}
          {uploadedImage && (
            <div className="mt-4 flex justify-center">
              <Button onClick={resetForm}>
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
