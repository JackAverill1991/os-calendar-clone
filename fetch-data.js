// ===============================================
//  Get Location Data
// ===============================================

// 'getCurrentPosition' requests the user's current location from the browser.
// If successful, 'positionSuccess' is called and receives the coordinates as an argument.
// The coordinates are then used to fetch address details via a reverse geolocation API.
// The Promise is resolved with the country's ISO code.
// If the location request fails, 'positionError' is called, displaying an error message and rejecting the Promise.

function getGeoLocation() {
  return new Promise((resolve, reject) => {
    async function positionSuccess({ coords }) {
      try {
        // Fetches address details using reverse geolocation API based on latitude and longitude
        const reverseLocation = await getReverseLocation(coords.latitude, coords.longitude);

        // Extracts country ISO code from the retrieved location data
        const countryIsoCode = getIsoCode(reverseLocation);

        // Resolves the Promise with the country ISO code
        resolve(countryIsoCode);

      } catch (error) {
        // Rejects the Promise if an error occurs during the reverse geolocation process
        reject("Error fetching reverse geolocation data:", error);
      }
    }

    // Callback function for geolocation retrieval failure
    function positionError() {
      alert("There was an error getting your location. Please update your location settings and refresh the page.");
      
      // Rejects the Promise if the user's location cannot be retrieved
      reject("Error: Unable to retrieve geolocation.");
    }

    // Requests location information from browser
    navigator.geolocation.getCurrentPosition(positionSuccess, positionError);
  });
}


function getIsoCode(reverseLocation) {
  // Find the first location result that contains an address component with type "country"
  const countryComponent = reverseLocation.results
    .map(location => location.address_components.find(component => component.types.includes("country")))
    .find(Boolean); // Ensures it only gets a valid object

  return countryComponent ? countryComponent.short_name : null;
}


// Uses Google reverse geocoding to get current address from longitude and latitude
const getReverseLocation = async (latitude, longitude) => {
  const response = await fetch('/.netlify/functions/reverse-geocode', {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });
  const data = await response.json();
  return data;
};


// ===============================================
//  Get Calendar URL
// ===============================================

// Gets API url and passes into fetchAPIData function.

async function getCalendarAPIData(country, year) {
  const response = await fetch('/.netlify/functions/holidays', {
    method: "POST",
    body: JSON.stringify({ country, year }),
  });
  const data = await response.json();
  return data;
}



export {
  getGeoLocation,
  getCalendarAPIData
}