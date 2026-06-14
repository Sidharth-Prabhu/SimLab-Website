const crypto = require('crypto');
const https = require('https');

// RSA Constants (remains secure on the server, not exposed in browser bundle)
const RSA_N = 0x650ae787da5f5cc4da86753f88a1bfdb540c7e9abd0fb633149b75658e974e5cc2e2d49e5e6a1e5150c1f491882ba8b74857861e88199d66a6078380ee8eb240470cf8e624fc654584618d0bc1ffb4570e5521c6c8226246dc1d01eccaace4c5f187d9ec3bea9082e10e2e3f6385986953cb388ff5c5ff63a439164069571badn;
const RSA_D = 0x38308932ee484bd198e85ef976e4e4497702ffc0d3549270f38bc40c36f0837e684e3608dfde497fd4d617487b1e3453c06213ce94c711d60c8c6f1fdb09f5abc00c7beb9df1fa763d94bb702b9a8b2f7ea9c28b21639e64523db42f2b227aff00d8974c442dadfaeec5ac2d8845843fc05146dd251298cf8222cbdda75e47c1n;

function modPow(base, exponent, modulus) {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent / 2n;
    base = (base * base) % modulus;
  }
  return result;
}

function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

// Calls Razorpay API to fetch payment detail status
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
    };
  }

  try {
    const { paymentId, name, email } = JSON.parse(event.body);

    if (!paymentId || !name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing name, email, or paymentId parameters' })
      };
    }

    const keyId = process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing from env variables.');
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'Server missing Razorpay configuration' })
      };
    }

    // Call Razorpay API
    const response = await verifyWithRazorpay(paymentId, keyId, keySecret);

    if (response.statusCode !== 200) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Verification failed: invalid or unknown Payment ID' })
      };
    }

    const payment = response.data;

    // Check payment status - should be 'captured' or 'authorized'
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: `Payment status is ${payment.status}, but it must be fully captured.` })
      };
    }

    // Check payment amount (₹1843 = 184300 paise)
    const expectedAmount = 184300; 
    if (payment.amount < expectedAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: `Invalid payment amount. Paid amount does not cover the license cost.` })
      };
    }

    // Generate license key cryptographically
    const expiryDays = 365;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    const expiryStr = expiryDate.toISOString().split('T')[0];

    const data = {
      user: name,
      email: email,
      expiry: expiryStr,
      tier: 'Enterprise Pro'
    };

    // Construct JSON dump matching python logic
    const dataStr = `{"email": ${JSON.stringify(email)}, "expiry": ${JSON.stringify(expiryStr)}, "tier": "Enterprise Pro", "user": ${JSON.stringify(name)}}`;
    const hashHex = sha256(dataStr);
    const h = BigInt('0x' + hashHex);
    const sig = modPow(h, RSA_D, RSA_N);

    const licenseJsonStr = `{"data": {"user": ${JSON.stringify(name)}, "email": ${JSON.stringify(email)}, "expiry": ${JSON.stringify(expiryStr)}, "tier": "Enterprise Pro"}, "signature": ${JSON.stringify('0x' + sig.toString(16))}}`;
    
    const bytes = Buffer.from(licenseJsonStr, 'utf-8');
    const encoded = bytes.toString('base64');

    const licenseKey = [
      "---BEGIN ACTIVATION KEY---",
      encoded,
      "---END ACTIVATION KEY---"
    ].join("\n");

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        licenseKey,
        data
      })
    };

  } catch (err) {
    console.error('Error verifying payment:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error during verification' })
    };
  }
};
