const https = require('https');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = `https://api.groq.com/openai/v1/chat/completions`;

// Confidence thresholds
const THRESHOLD_VERIFIED = 80;
const THRESHOLD_REVIEW = 60;

/**
 * Sends a request to Gemini Vision API with structured crop grading prompt.
 * Never exposes API key to client.
 */
async function callGroqVision(crop, farmerGrade, imageBase64, mimeType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY || GROQ_API_KEY;
    if (!apiKey) {
      return reject(new Error('GROQ_API_KEY not configured'));
    }

    const prompt = `You are an agricultural quality expert. Analyze the uploaded crop image carefully.

Crop selected by farmer: ${crop}
Grade claimed by farmer: ${farmerGrade}

Instructions:
1. Identify what crop (if any) is visible in the image.
2. Determine if it matches the selected crop: ${crop}.
3. If the crop matches, analyze visible quality indicators including:
   - Color (appropriate for crop and ripeness stage)
   - Size uniformity
   - Shape regularity  
   - Ripeness level
   - Visible surface defects, bruising, or damage
   - Pest or disease symptoms
   - Cleanliness
   - Overall visual grade
4. Based on your analysis, assign an independent quality grade: A, A/B, or B.
   - Grade A: Premium quality, uniform, no visible defects, excellent color
   - Grade A/B: Good quality, minor inconsistencies, small defects acceptable
   - Grade B: Acceptable quality, noticeable defects, lower uniformity
5. Compare your AI grade with the farmer's claimed grade: ${farmerGrade}.
6. Provide a confidence percentage (0-100) for your assessment.

IMPORTANT: Base the grade ONLY on what you can see in the image. Do not default to any grade.
If image is too blurry, too dark, or crop is not clearly visible, set confidence below 40.

Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "cropDetected": "name of crop detected or null",
  "cropMatches": true or false,
  "aiGrade": "A" or "A/B" or "B" or null,
  "confidence": 0-100,
  "farmerGrade": "${farmerGrade}",
  "gradeMatches": true or false,
  "qualityIndicators": {
    "color": "description",
    "size": "description",
    "uniformity": "description",
    "damage": "description",
    "disease": "description",
    "ripeness": "description",
    "cleanliness": "description"
  },
  "reason": "brief explanation of grade decision based on visible features",
  "recommendation": "advice for the farmer",
  "imageQuality": "GOOD" or "POOR" or "UNREADABLE"
}`;

    const body = JSON.stringify({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const url = new URL(GROQ_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed.choices?.[0]?.message?.content || '';
          // Extract JSON from response (strip any markdown fences)
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) return reject(new Error('No JSON in Groq response'));
          resolve(JSON.parse(jsonMatch[0]));
        } catch (e) {
          reject(new Error('Failed to parse Groq response: ' + e.message));
        }
      });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Groq API timeout'));
    });
    request.write(body);
    request.end();
  });
}

/**
 * Determines verification status from confidence score.
 */
function getVerificationStatus(confidence, cropMatches, gradeMatches) {
  if (!cropMatches) return 'CROP_MISMATCH';
  if (confidence >= THRESHOLD_VERIFIED) return gradeMatches ? 'VERIFIED' : 'GRADE_MISMATCH';
  if (confidence >= THRESHOLD_REVIEW) return 'NEEDS_REVIEW';
  return 'UNVERIFIED';
}

// ─── POST /api/v1/ai/verify-crop-grade ──────────────────────────
exports.verifyCropGrade = async (req, res, next) => {
  try {
    const { crop, farmerGrade, imageBase64, mimeType, images } = req.body;

    if (!crop) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_CROP', message: 'Crop name is required' } });
    }
    if (!farmerGrade) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_GRADE', message: 'Farmer grade is required' } });
    }
    if (!imageBase64 && (!images || images.length === 0)) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_IMAGE', message: 'At least one crop image is required' } });
    }

    // Check image size (base64 ~1.37x actual size, cap at ~5MB raw)
    const imageData = imageBase64 || images[0];
    const approxSizeBytes = (imageData.length * 3) / 4;
    if (approxSizeBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: { code: 'IMAGE_TOO_LARGE', message: 'Image must be smaller than 5MB. Please compress or resize the image.' } });
    }

    // If multiple images provided, analyze each and average results
    const imagesToAnalyze = images && images.length > 1 ? images.slice(0, 3) : [imageData];
    const mimeTypeToUse = mimeType || 'image/jpeg';

    const results = [];
    let lastError = 'Unknown error';
    for (const img of imagesToAnalyze) {
      try {
        const result = await callGroqVision(crop, farmerGrade, img, mimeTypeToUse);
        results.push(result);
      } catch (e) {
        lastError = e.message;
        console.warn('Single image analysis failed:', e.message);
      }
    }

    if (results.length === 0) {
      return res.status(503).json({
        success: false,
        error: { code: 'AI_UNAVAILABLE', message: 'AI grade verification is temporarily unavailable. Please try again or proceed without verification. Error: ' + lastError }
      });
    }

    // Aggregate results from multiple images
    let finalResult;
    if (results.length === 1) {
      finalResult = results[0];
    } else {
      // Average confidence; use majority vote for grade
      const avgConfidence = Math.round(results.reduce((s, r) => s + (r.confidence || 0), 0) / results.length);
      const grades = results.map(r => r.aiGrade).filter(Boolean);
      const gradeCounts = grades.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
      const majorityGrade = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const allCropMatch = results.every(r => r.cropMatches);
      finalResult = {
        ...results[0],
        confidence: avgConfidence,
        aiGrade: majorityGrade || results[0].aiGrade,
        cropMatches: allCropMatch,
        gradeMatches: majorityGrade === farmerGrade,
        reason: `Based on ${results.length} images: ` + (results[0].reason || ''),
        imagesAnalyzed: results.length,
        perImageGrades: grades,
      };
    }

    const verificationStatus = getVerificationStatus(
      finalResult.confidence,
      finalResult.cropMatches,
      finalResult.gradeMatches
    );

    res.json({
      success: true,
      data: {
        ...finalResult,
        verificationStatus,
        confidenceThresholds: { verified: THRESHOLD_VERIFIED, review: THRESHOLD_REVIEW }
      },
      message: 'Grade verification complete'
    });

  } catch (error) {
    console.error('AI verification error:', error.message);
    if (error.message.includes('GROQ_API_KEY not configured')) {
      return res.status(503).json({
        success: false,
        error: { code: 'AI_NOT_CONFIGURED', message: 'AI grade verification is not configured. Contact administrator.' }
      });
    }
    res.status(503).json({
      success: false,
      error: { code: 'AI_ERROR', message: 'AI verification failed. Please try again or upload a clearer image.' }
    });
  }
};
