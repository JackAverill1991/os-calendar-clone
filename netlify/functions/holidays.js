const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { country, year } = JSON.parse(event.body);
  const calendarKey = process.env.CALENDARIFIC_API_KEY;

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
