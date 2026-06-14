const querystring = require('querystring');

exports.handler = async (event) => {
  let paymentId = '';

  if (event.body) {
    // Parse the POST request body (typically application/x-www-form-urlencoded)
    const params = querystring.parse(event.body);
    paymentId = params.razorpay_payment_id || params.payment_id || '';
  }

  // Fallback to query parameters in case of a GET redirect
  if (!paymentId && event.queryStringParameters) {
    paymentId = event.queryStringParameters.razorpay_payment_id || event.queryStringParameters.payment_id || '';
  }

  // Redirect to the SPA success page hash route with the payment ID
  return {
    statusCode: 302,
    headers: {
      Location: `/#/purchase-success?razorpay_payment_id=${paymentId}`,
      'Cache-Control': 'no-cache',
    },
    body: 'Redirecting to your license...',
  };
};
