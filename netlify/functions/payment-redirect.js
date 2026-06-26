const querystring = require('querystring');

exports.handler = async (event) => {
  let paymentId = '';

  try {
    let bodyText = event.body || '';
    if (event.isBase64Encoded && bodyText) {
      bodyText = Buffer.from(bodyText, 'base64').toString('utf8');
    }

    if (bodyText) {
      // Parse the POST request body (typically application/x-www-form-urlencoded)
      const params = querystring.parse(bodyText);
      paymentId = params.razorpay_payment_id || params.payment_id || params.razorpay_payment_link_id || '';
    }

    // Fallback to query parameters in case of a GET redirect
    if (!paymentId && event.queryStringParameters) {
      paymentId = event.queryStringParameters.razorpay_payment_id || event.queryStringParameters.payment_id || event.queryStringParameters.razorpay_payment_link_id || '';
    }
  } catch (e) {
    console.error('Error parsing payment redirect body:', e);
  }

  // Clean fallback URL
  const redirectUrl = `/#/purchase-success${paymentId ? `?razorpay_payment_id=${paymentId}` : ''}`;

  // Return a 200 OK status code with HTML redirect. 
  // This satisfies Razorpay's requirement of receiving a 200 OK response from the redirect callback URL.
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    },
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    window.location.replace(${JSON.stringify(redirectUrl)});
  </script>
</head>
<body style="background: #11111b; color: #cdd6f4; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <p style="font-size: 1.1rem; margin-bottom: 8px;">Payment verified successfully.</p>
    <p style="font-size: 0.9rem; color: #a6adc8;">Redirecting you back to Frissco SimLab...</p>
  </div>
</body>
</html>`
  };
};
