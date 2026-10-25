const QRCode = require('qrcode');
const crypto = require('crypto');

const generateQRId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrDataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

const validateQRExpiry = (qrValidityStart, qrValidityEnd) => {
  if (!qrValidityStart || !qrValidityEnd) return true;
  const now = new Date();
  return now >= new Date(qrValidityStart) && now <= new Date(qrValidityEnd);
};

module.exports = {
  generateQRId,
  generateQRCode,
  validateQRExpiry,
};
