import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const database = client.db('handprintdb');
    const handprints = database.collection('handprints');
    const result = await handprints.find({}).toArray();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch handprints' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await client.connect();
    const database = client.db('handprintdb');
    const handprints = database.collection('handprints');
    const result = await handprints.insertOne(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add handprint' }, { status: 500 });
  } finally {
    await client.close();
  }
}