// ===============================================
//  Add Event To Local Storage
// ===============================================

// Retrieves the stored events object using getLocalStorageEventObject().
// Extracts the event's start year from userEventObject and ensures an array exists for that year in the stored events object.
// Adds the new event to the relevant year’s array and saves the updated object back to localStorage using saveToLocalStorage().

function addEventToLocalStorage(userEventObject) {
  // Parse the JSON string into an object. If it does not exist, create an empty object
  const localStorageEventsObject = getLocalStorageEventObject();

  // Extract start date from userEventObject
  const eventYear = userEventObject.dates.startDate.year;

  // Ensure eventYear exists as an array in userEventsObject
  if (!localStorageEventsObject[eventYear]) {
    localStorageEventsObject[eventYear] = [];
  }

  // Push the userEventObject to the userEventYear array
  localStorageEventsObject[eventYear].push(userEventObject);

  // Store the updated user events back into localStorage
  saveToLocalStorage(localStorageEventsObject);
}



// ===============================================
//  Update Event In Local Storage
// ===============================================

// Loops through each key (year) value (events array) pair in local storage.
// Removes userEventObject from events array if the key (year) no longer matches the eventStartYear value from the userEventObject.
// If the eventStartYear still matches the year key, event is updated in the events array.
// If the years differed and event was removed and not updated, it is then added to the correct year in the object (year is created if it doesn't already exist).
// Any years in the object with empty arrays (no events) are deleted.

function updateEventInLocalStorage(userEventObject) {
  // Parse the JSON string into an object. If it does not exist, create an empty object
  const localStorageEventsObject = getLocalStorageEventObject();

  // Get event ID and start year from userEventObject
  const eventId = userEventObject.eventId;
  const eventStartYear = userEventObject.dates.startDate.year;

  let eventUpdated = false;

  // Process each year in localStorageEventsObject
  for (let [year, eventsArray] of Object.entries(localStorageEventsObject)) {
    if (parseInt(year) !== eventStartYear) {
      // Remove the event from the current year if the start year has changed
      removeEventFromYear(localStorageEventsObject, year, eventId);
    } else {
      // Update the event if found in the matching year
      eventUpdated = updateEventInYear(eventsArray, eventId, userEventObject);
    }
  }

  // If the event wasn't updated, add it to the correct year
  if (!eventUpdated) {
    addEventToYear(localStorageEventsObject, userEventObject, eventStartYear);
  }

  // Remove empty year arrays
  cleanUpEmptyYears(localStorageEventsObject);

  // Save the updated events back to localStorage
  saveToLocalStorage(localStorageEventsObject);
}


// Function to remove an event from a specific year's events array
function removeEventFromYear(eventsObject, year, eventId) {
  eventsObject[year] = eventsObject[year].filter(event => event.eventId !== eventId);
}


// Function to update an event within a specific year's events array
function updateEventInYear(events, eventId, userEventObject) {
  for (let event of events) {
    if (event.eventId === eventId) {
      Object.assign(event, userEventObject);
      return true; // Event found and updated
    }
  }
  return false; // Event not found
}


// Function to add an event to a specific year
function addEventToYear(eventsObject, userEventObject, eventStartYear) {
  if (!eventsObject[eventStartYear]) {
    eventsObject[eventStartYear] = [];
  }
  eventsObject[eventStartYear].push(userEventObject);
}


// Function to clean up any empty year arrays
function cleanUpEmptyYears(eventsObject) {
  for (let year in eventsObject) {
    if (eventsObject[year].length === 0) {
      delete eventsObject[year];
    }
  }
}



// ===============================================
//  Get Events From Local Storage
// ===============================================

// Takes parameter for an array of years, for example if there are dates spanning two different years on the calender.
// Both years will be accounted for and any events falling on those years will be included.
// Array also takes single year when an event is selected and passed into the edit calendar event function.
// If no array is provided, all events will be returned.

function getEventsFromLocalStorage(calendarYearsArray) {
  try {
    let resultArray = [];

    if (calendarYearsArray) {
      // Push specific year event range into resultArray
      returnSpecificYearRange(calendarYearsArray, resultArray);
    } 
    else {
      // Push all events into resultArray
      returnAllEvents(resultArray);
    }

    return resultArray;
    
  } catch (error) {    
    console.error("Error accessing localStorage", error);
    
    // Return empty array if not found
    return [];
  }
}


function returnAllEvents(resultArray) {
  // Parse the JSON string into an object. If it does not exist, create an empty object
  const localStorageEventsObject = getLocalStorageEventObject();

  // Take event year arrays from each year key of local storage object, and flatten into single array
  const propertyValuesArray = Object.values(localStorageEventsObject).flat();

  propertyValuesArray.forEach(object => {
    if (object) resultArray.push(object);
  });
}


function returnSpecificYearRange(calendarYearsArray, resultArray) {
  // Parse the JSON string into an object. If it does not exist, create an empty object
  const localStorageEventsObject = getLocalStorageEventObject();

  // Check if localStorageEventsObject is not null
  if (localStorageEventsObject) {

    // Find keys from local storage object and push values to empty array
    const matchingYears = calendarYearsArray.map(year => localStorageEventsObject[year]);

    // If matching year exists, push its contents to resultArray. If it does not exist, return null
    matchingYears.forEach(array => {
      array ? array.forEach(item => resultArray.push(item)) : null;
    });
  }
}



// ===============================================
//  Remove Event From Local Storage
// ===============================================

// Retrieves the stored events object with getLocalStorageEventObject() and checks if the specified event year exists in the stored data.
// Removes the event with the matching eventId and deletes the year key if no events remain for that year.
// Saves the updated data back to localStorage using saveToLocalStorage().

function removeEventFromLocalStorage(eventIdToRemove, eventStartYear) {
  // Parse the JSON string into an object. If it does not exist, create an empty object
  const localStorageEventsObject = getLocalStorageEventObject();
  
  // Check if the year exists in the stored events
  if (localStorageEventsObject[eventStartYear]) {

    // Filter out the event with the matching eventId
    localStorageEventsObject[eventStartYear] = localStorageEventsObject[eventStartYear].filter(event => event.eventId !== eventIdToRemove);

    // If there are no more events for that year, delete the year from the object
    if (localStorageEventsObject[eventStartYear].length === 0) {
      delete localStorageEventsObject[eventStartYear];
    }

    // Store the updated user events back into localStorage
    saveToLocalStorage(localStorageEventsObject);
  }
}



// ===============================================
//  Get Local Storage Event Object
// ===============================================

// Helper function to get userAddedEvents object from local storage.

function getLocalStorageEventObject() {
  // Retrieve user events from localStorage
  const localStorageEventString = localStorage.getItem('userAddedEvents');

  // Parse the JSON string into an object. If it does not exist, create an empty object
  return localStorageEventString ? JSON.parse(localStorageEventString) : {};
}



// ===============================================
//  Save To Local Storage
// ===============================================

// Helper function to save the updated object back to localStorage.

function saveToLocalStorage(eventsObject) {
  localStorage.setItem('userAddedEvents', JSON.stringify(eventsObject));
}



export { 
  addEventToLocalStorage,
  updateEventInLocalStorage,
  getEventsFromLocalStorage,
  removeEventFromLocalStorage
}