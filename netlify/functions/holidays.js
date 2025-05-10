exports.handler = async function(event) {
  // Get country and year data
  const { country, year } = JSON.parse(event.body);

  // Get API key from .env file
  const calendarKey = process.env.CALENDARIFIC_API_KEY;

  // Pass country, year and API key into Google URL 
  const url = `https://calendarific.com/api/v2/holidays?&api_key=${calendarKey}&country=${country}&year=${year}`;

  try {
    const response = await fetch(url);
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
