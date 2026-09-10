import { NextRequest, NextResponse } from 'next/server';
import { getLocalFile } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const storageKey = params.key.join('/');
    const file = await getLocalFile(storageKey);

    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
