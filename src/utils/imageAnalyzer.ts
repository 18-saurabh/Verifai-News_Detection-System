import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisResult } from './types';
import i18n from '../i18n';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const analyzeImage = async (imageData: string): Promise<AnalysisResult> => {
  try {
    // Convert base64 to Uint8Array
    const base64Data = imageData.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare the image data
    const imageBlob = new Blob([bytes], { type: 'image/jpeg' });
    const imageFile = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg'
      }
    };

    // First, extract text from the image with improved formatting
    const extractionPrompt = `Extract all readable text from this image. Format the text with these rules:
    1. Preserve all paragraphs and line breaks
    2. Maintain proper spacing between sections
    3. Keep any headings or titles on separate lines
    4. Preserve any lists or bullet points
    5. Keep numbers, dates, and special characters intact
    6. Only include the actual text content, no descriptions or explanations
    7. Use proper punctuation and formatting`;
    
    const extractionResult = await model.generateContent([extractionPrompt, imageFile]);
    let extractedText = extractionResult.response.text();

    // If language is Hindi, translate the extracted text
    if (i18n.language === 'hi') {
      const translationPrompt = `Translate the following English text to Hindi. Follow these rules:
      1. Maintain all paragraph breaks and formatting
      2. Keep numbers, dates, and proper nouns as is
      3. Use proper Hindi punctuation (like । for full stops)
      4. Preserve any headings or section breaks
      5. Keep the same text structure and layout
      
Here's the text to translate:

${extractedText}`;

      const translationResult = await model.generateContent(translationPrompt);
      extractedText = translationResult.response.text();
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double line breaks
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace

    // Now analyze the text in the selected language
    const analysisPrompt = `Analyze this article text in ${i18n.language === 'hi' ? 'Hindi' : 'English'} language. ${i18n.language === 'hi' ? 'Provide all analysis output in Hindi.' : ''} Provide a detailed analysis including credibility assessment, fact-checking, and content evaluation.

Your response must be a valid JSON object with this exact structure:
{
  "credibilityScore": number between 0 and 100,
  "isFactual": boolean,
  "explanation": string explaining the factual assessment,
  "warnings": string[] of potential issues,
  "suggestions": string[] of improvements,
  "sentiment": {
    "score": number between -1 and 1,
    "label": "negative" | "neutral" | "positive"
  },
  "readability": {
    "score": number between 0 and 100,
    "level": "Easy" | "Medium" | "Hard",
    "suggestions": string[]
  },
  "bias": {
    "score": number between 0 and 100,
    "type": string,
    "explanation": string
  }
}

Text to analyze: "${extractedText}"`;

    const analysisResult = await model.generateContent(analysisPrompt);
    const analysisText = analysisResult.response.text();
    
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : analysisText;
      const analysis = JSON.parse(jsonString);

      // Calculate basic statistics
      const words = extractedText.trim().split(/\s+/);
      const sentences = extractedText.split(/[.!?।]+/).filter(Boolean); // Added Devanagari danda for Hindi
      const paragraphs = extractedText.split(/\n\s*\n/).filter(Boolean);
      
      const statistics = {
        wordCount: words.length,
        averageSentenceLength: Math.round(words.length / sentences.length),
        paragraphCount: paragraphs.length,
        complexWords: words.filter(word => word.length > 6).length,
        readingTimeMinutes: Math.ceil(words.length / 200),
        topKeywords: extractKeywords(extractedText),
        emotionalTone: {
          positive: countEmotionalWords(extractedText, 'positive'),
          negative: countEmotionalWords(extractedText, 'negative'),
          urgent: countEmotionalWords(extractedText, 'urgent')
        },
        uniqueWords: new Set(words.map(w => w.toLowerCase())).size,
        averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length
      };

      return {
        credibilityScore: analysis.credibilityScore,
        warnings: analysis.warnings,
        suggestions: analysis.suggestions,
        factCheck: {
          isFactual: analysis.isFactual,
          explanation: analysis.explanation
        },
        sentiment: analysis.sentiment,
        readability: analysis.readability,
        bias: analysis.bias,
        statistics,
        extractedText
      };
    } catch (parseError) {
      console.error('Failed to parse analysis:', parseError);
      throw new Error('Failed to parse analysis results');
    }
  } catch (error) {
    console.error('Image analysis failed:', error);
    throw error;
  }
};

// Helper function to extract keywords - Updated for Hindi support
function extractKeywords(text: string): string[] {
  const isHindi = i18n.language === 'hi';
  
  // Hindi stop words
  const hindiStopWords = new Set([
    'का', 'की', 'के', 'एक', 'में', 'है', 'हैं', 'को', 'पर', 'इस', 'से', 'और',
    'या', 'हो', 'था', 'थी', 'थे', 'कि', 'जो', 'कर', 'यह', 'वह', 'ने', 'बहुत',
    'सभी', 'कुछ', 'अब', 'जब', 'तक', 'तब', 'या', 'एवं', 'यदि', 'भी'
  ]);

  // English stop words
  const englishStopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
    'will', 'with'
  ]);

  const stopWords = isHindi ? hindiStopWords : englishStopWords;
  
  // Split text into words - handle both scripts
  const words = text.split(/[\s,।]+/);
  const wordFreq: Record<string, number> = {};
  
  words.forEach(word => {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length > 1 && !stopWords.has(cleanWord)) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
    }
  });
  
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

// Helper function to count emotional words - Updated for Hindi support
function countEmotionalWords(text: string, type: 'positive' | 'negative' | 'urgent'): number {
  const isHindi = i18n.language === 'hi';
  
  const emotionalWords = {
    positive: isHindi ? 
      ['अच्छा', 'बेहतर', 'उत्कृष्ट', 'अद्भुत', 'शानदार', 'सकारात्मक', 'सफलता', 'प्रगति'] :
      ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive', 'success', 'breakthrough'],
    negative: isHindi ?
      ['बुरा', 'खराब', 'भयानक', 'घटिया', 'नकारात्मक', 'असफलता', 'संकट', 'समस्या'] :
      ['bad', 'terrible', 'awful', 'horrible', 'poor', 'negative', 'failure', 'crisis'],
    urgent: isHindi ?
      ['तत्काल', 'जरूरी', 'आपातकालीन', 'संकट', 'तुरंत', 'महत्वपूर्ण', 'आवश्यक', 'गंभीर'] :
      ['breaking', 'urgent', 'emergency', 'crisis', 'immediately', 'critical', 'vital', 'crucial']
  };
  
  const words = text.toLowerCase().split(/[\s,।]+/);
  return words.filter(word => emotionalWords[type].includes(word)).length;
}