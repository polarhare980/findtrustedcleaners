import Tesseract from 'tesseract.js';

export async function detectTextFromBuffer(buffer) {
  try {
    const result = await Tesseract.recognize(buffer, 'eng');
    const text = result?.data?.text || '';
    return text.trim().length > 0;
  } catch (error) {
    console.error('🧠 Tesseract error:', error.message);
    return false;
  }
}
