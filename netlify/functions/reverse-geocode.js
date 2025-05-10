exports.handler = async function(event) {  
  // Get latitude and longitude
  const { latitude, longitude } = JSON.parse(event.body);

  // Get API key from .env file
  const apiKey = process.env.GOOGLE_API_KEY;

  // Pass latitude, longitude and API key into Google URL 
  const reverseUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(reverseUrl);
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}