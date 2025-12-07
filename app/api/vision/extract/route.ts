import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and extract the following information if present:
              1. Name (person's full name - can be in any language including Tamil, Telugu, Hindi, etc.)
              2. Phone number (mobile number - digits only)
              
              Please return the information in JSON format with keys "name" and "phone".
              If any information is not found, return null for that field.
              Only extract clear, readable text. If handwriting is unclear, return null.
              
              For names: Extract exactly as written, preserving original language and script.
              For phone: Extract only the numeric digits (10-12 digits for Indian numbers).
              
              Example response:
              {
                "name": "இயல்புடைய குப்பத்தமான்",
                "phone": "9788552279"
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: image
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    try {
      // Try to parse the JSON response
      const extractedData = JSON.parse(content);
      
      return NextResponse.json({
        success: true,
        data: {
          name: extractedData.name || null,
          phone: extractedData.phone || null
        }
      });
    } catch (parseError) {
      // If JSON parsing fails, try to extract manually
      const nameMatch = content.match(/"name":\s*"([^"]+)"/);
      const phoneMatch = content.match(/"phone":\s*"([^"]+)"/);
      
      return NextResponse.json({
        success: true,
        data: {
          name: nameMatch ? nameMatch[1] : null,
          phone: phoneMatch ? phoneMatch[1] : null
        }
      });
    }

  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
