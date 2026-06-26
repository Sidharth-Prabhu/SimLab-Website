const crypto = require('crypto');
const https = require('https');

// Helper to query Razorpay API directly
function verifyWithRazorpay(paymentId, keyId, keySecret) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path: `/v1/payments/${paymentId}`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

// Helper to make HTTPS POST requests (e.g. to Web3Forms)
function postRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyString = JSON.stringify(payload);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString),
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(bodyString);
    req.end();
  });
}

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const rawBody = event.body || '';
    const body = JSON.parse(rawBody);
    
    // 1. Check signature if secret is configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = event.headers['x-razorpay-signature'] || event.headers['X-Razorpay-Signature'];
    
    if (webhookSecret && signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(rawBody);
      const digest = shasum.digest('hex');
      if (digest !== signature) {
        console.warn('Webhook signature verification failed.');
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, error: 'Invalid webhook signature' })
        };
      }
    }

    // 2. Extract payment id from webhook body
    // Razorpay webhook payloads nested structure: payload.payment.entity.id
    let paymentId = '';
    if (body.payload && body.payload.payment && body.payload.payment.entity) {
      paymentId = body.payload.payment.entity.id;
    } else if (body.payment_id) {
      paymentId = body.payment_id;
    }

    if (!paymentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Payment ID not found in webhook payload' })
      };
    }

    // 3. Verify payment details against Razorpay API directly (Double-Verification with fallback)
    const keyId = process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let payment = null;
    const keyIdConfigured = keyId && !keyId.includes('your_razorpay_key_id_here');
    const keySecretConfigured = keySecret && !keySecret.includes('your_razorpay_key_secret_here');

    if (keyIdConfigured && keySecretConfigured) {
      try {
        const verification = await verifyWithRazorpay(paymentId, keyId, keySecret);
        if (verification.statusCode === 200) {
          payment = verification.data;
        } else {
          console.warn(`Razorpay API verification returned status code ${verification.statusCode}. Falling back to payload.`);
        }
      } catch (err) {
        console.error('Razorpay API request error. Falling back to payload:', err);
      }
    } else {
      console.warn('Razorpay API keys are not configured. Using payment payload from webhook directly.');
    }

    // Fallback to payload entity if API verification didn't succeed
    if (!payment) {
      if (body.payload && body.payload.payment && body.payload.payment.entity) {
        payment = body.payload.payment.entity;
      } else {
        payment = {
          id: paymentId,
          status: 'captured', // Default fallback status
          email: body.email || 'N/A',
          contact: body.contact || 'N/A',
          amount: body.amount || 0,
          currency: body.currency || 'INR',
          notes: body.notes || {}
        };
      }
    }

    // Check payment status - must be captured or authorized
    const isPaid = payment.status === 'captured' || payment.status === 'authorized';
    if (!isPaid) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: `Payment ${paymentId} status is ${payment.status}, no action taken.` })
      };
    }

    // 4. Retrieve buyer info
    const email = payment.email || 'unknown@example.com';
    const contact = payment.contact || 'N/A';
    const name = (payment.notes && (payment.notes.name || payment.notes.buyerName)) || 'Valued Customer';
    const amount = payment.amount ? (payment.amount / 100).toFixed(2) : '0.00';
    const currency = payment.currency || 'INR';

    // 5. Send notification to owner via Web3Forms
    const web3FormsKey = 'ecdab183-c7d4-4321-bd74-bb6a1a240387';
    const web3formsPayload = {
      access_key: web3FormsKey,
      subject: `[SimLab Paid] Payment Received - ID: ${paymentId}`,
      from_name: 'Frissco SimLab Webhook',
      name: name,
      email: email,
      message: `Hello! A new payment has been successfully verified for Frissco SimLab.

Customer Name: ${name}
Customer Email: ${email}
Customer Phone: ${contact}

Payment Details:
- Payment ID: ${paymentId}
- Amount: ${amount} ${currency}
- Gateway: Razorpay
- Status: ${payment.status}

API Verification Response:
${JSON.stringify(payment, null, 2)}`
    };

    const web3formsRes = await postRequest('https://api.web3forms.com/submit', web3formsPayload);

    console.log(`Web3Forms Submission Status: ${web3formsRes.statusCode}`, web3formsRes.data);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Payment verified and notification dispatched successfully.',
        paymentId,
        web3formsStatus: web3formsRes.statusCode
      })
    };

  } catch (err) {
    console.error('Error processing payment webhook:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error processing webhook' })
    };
  }
};
