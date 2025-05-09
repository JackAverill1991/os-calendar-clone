exports.handler = async function(event) {
  console.log('handler function called 16:07');
  const fetch = (await import('node-fetch')).default;
  
  const { latitude, longitude } = JSON.parse(event.body);
  const apiKey = process.env.GOOGLE_API_KEY;

  const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(reverseUrl);
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};