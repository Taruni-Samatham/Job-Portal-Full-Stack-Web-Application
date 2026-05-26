/**
 * Twilio Verify Service Utility
 * Handles sending and checking OTP via Twilio Verify API
 */

const twilio = require('twilio');

const getClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
};

const getServiceSid = () => process.env.TWILIO_VERIFY_SERVICE_SID;

/**
 * Send a verification code to a phone number
 */
const sendVerificationToken = async (phone) => {
  const client = getClient();
  const serviceSid = getServiceSid();

  if (!client || !serviceSid) {
    console.warn('⚠️ Twilio credentials or Service SID missing.');
    return { success: false, message: 'Twilio configuration missing' };
  }

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phone, channel: 'sms' });

    console.log(`📱 Verification sent to ${phone}: ${verification.status}`);
    return { success: true, status: verification.status };
  } catch (error) {
    console.error('❌ Twilio Verify send failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Check a verification code
 */
const checkVerificationToken = async (phone, code) => {
  const client = getClient();
  const serviceSid = getServiceSid();

  if (!client || !serviceSid) {
    return { success: false, message: 'Twilio configuration missing' };
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phone, code });

    console.log(`📱 Verification check for ${phone}: ${verificationCheck.status}`);
    return { 
      success: verificationCheck.status === 'approved', 
      status: verificationCheck.status 
    };
  } catch (error) {
    console.error('❌ Twilio Verify check failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendVerificationToken, checkVerificationToken };
