import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI;
let client;

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

export async function GET() {
  try {
    const client = await connectToDatabase();
    const database = client.db('handprintdb');
    const handprints = database.collection('handprints');
    const result = await handprints.find({}).toArray();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch handprints:', error);
    return NextResponse.json({ error: 'Failed to fetch handprints' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await connectToDatabase();
    const database = client.db('handprintdb');
    const handprints = database.collection('handprints');
    const result = await handprints.insertOne(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to add handprint:', error);
    return NextResponse.json({ error: 'Failed to add handprint' }, { status: 500 });
  }
}