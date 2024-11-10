import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const MONGODB_URI = "mongodb+srv://user1:12345678SRP@cluster0.9egnm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

export async function POST(req) {
    try {
      const client = await MongoClient.connect(MONGODB_URI)
      const db = client.db('MainDB')
      const collection = db.collection('parkingdatas')
      const parsedResponse = await req.json();
      const result = await collection.insertOne(parsedResponse)
      client.close()
      return NextResponse.json({
        message: "Data saved successfully",
        id: result.insertedId,
        status: 200
      })

    } catch (error) {
      return NextResponse.json({
        message: "Error saving data to MongoDB",
        error: error.message,
        status: 404
      })
    }
  } 

