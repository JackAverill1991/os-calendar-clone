import { getCalendarAPIData } from "./fetch-data.js"; 


// =============================================
//  Month Name Array / Get Month Name
// =============================================

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Get first three letters of month name
function getShortMonthName(month) {
  const monthName = monthNames[month - 1];
  const shortMonthName = monthName.slice(0, 3);
  return shortMonthName;
}



// =============================================
//  Category Colors Object
// =============================================

// Object used to store color palette information for category elements.

const eventCategoryColorsObject = {
  cherryRed: { highlight: 'FF3366', pastel: 'f7ced9' },
  tangerine: { highlight: 'FF9933', pastel: 'FFE2CF' },
  mossGreen: { highlight: '66CC33', pastel: 'dff4d5' },
  sunflowerYellow: { highlight: 'FFCC33', pastel: 'fcf0d1' },
  skyBlue: { highlight: '40A6F5', pastel: 'd5ebfc' },
  deepPurple: { highlight: '9966CC', pastel: 'ecd9f4' }
}



// =============================================
//  Calendar Date Functions
// =============================================

// Creates and inserts a span element (current-date-circle) inside the element.

function highlightCurrentDate(year, month, date, element) {
  const currentDateString = new Date();
  const currentYear = currentDateString.getFullYear();
  const currentMonth = currentDateString.getMonth() + 1;
  const currentDate = currentDateString.getDate();

  if (year === currentYear && month === currentMonth && date === currentDate) {
    // Add class to date element
    element.classList.add('current-day');

    // Create and insert round span element into year calendar to keep consistent shape on page resize
    if (element.closest('.year-dates')) {
      const currentDateCircle = document.createElement('span');
      currentDateCircle.classList.add('current-date-circle');
      element.appendChild(currentDateCircle);
    }
  }
}


// Gets the day index of the first day of the given month and year
function getFirstDayIndex(year, month) {
  let day = new Date(year, month - 1, 1).getDay();
  // Returns 7 instead of 0 if the first day is Sunday, ensuring consistency in calculations
  return day === 0 ? 7 : day;
}


// Gets day count of current month
function getDayCountOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}


// Gets day count of previous month
function getDayCountOfPreviousMonth(year, month) {
  let lastMonth = month - 1;
  let yearOfLastMonth = year;
  if (lastMonth === 0) {
    lastMonth = 12;
    yearOfLastMonth -= 1;
  }
  const dayCountOfLastMonth = getDayCountOfMonth(yearOfLastMonth, lastMonth);
  return dayCountOfLastMonth;
}


// Gets day count of next month
function getDayCountOfNextMonth(year, month) {
  let nextMonth = month + 1;
  let yearOfNextMonth = year;
  if (nextMonth === 13) {
    nextMonth = 0;
    yearOfNextMonth += 1;
  }
  const dayCountOfNextMonth = getDayCountOfMonth(yearOfNextMonth, nextMonth);
  return dayCountOfNextMonth;
}



// =============================================
//  Local Storage Object Functions
// =============================================

// 'assignObjectID' generates a unique ID using crypto.randomUUID() if the target object does not already have one.
// Assigns the ID to the object's specified key (used in catgory and user event objects in local storage).
// Sets the same ID as a dataset attribute on the target HTML element for easy lookup.

function assignObjectID(targetElement, targetObject, objectKey) {
  // If target object does not already have an event ID, create one using crypto.randomUUID
  targetObject[objectKey] = targetObject[objectKey] || crypto.randomUUID();

  // Assign object key as dataset value to target HTML element
  targetElement.dataset[objectKey] = targetObject[objectKey];
}


// Sets pre-existing object values (objectProperty) to inputs on page load (used for category and user event inputs).
function setInputValues(inputElement, objectProperty, targetObject) {
  if (targetObject.hasOwnProperty(objectProperty)) {
    inputElement.value = targetObject[objectProperty];
  }
}


// Add new input values to object (used for category and user event objects being saved in local storage).
// 'objectProperty' parameter is used to name object property info is being stored under.

function setObjectValues(inputElement, objectProperty, targetObject) {
  inputElement.addEventListener('input', () => {
    let inputString = inputElement.value;
    // Save input string to object under objectProperty name
    targetObject[objectProperty] = inputString;
  });
}



// =============================================
//  Date / Time Inputs
// =============================================

// Preemptively remove highlight class from all inputs and add to whichever input clicked
function addHighlights(inputElement, allInputElements) {
  inputElement.addEventListener('click', () => {   
    allInputElements.forEach(inputElement => inputElement.classList.remove('highlight'));
    inputElement.classList.add('highlight');
  });
}

// Helper function to format time
const formatDateAndTime = (number) => (number < 10 ? `0${number}` : number);



// =============================================
//  Local Storage
// =============================================

// Checks if the specified key already exists in localStorage.
// Adds the value as a JSON string if the key is not found.
// Handles errors using try...catch and logs any issues to the console.

function addToLocalStorage(key, value)  {
  try {
    // Check if item already exists
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error adding value to localStorage: ${error}`);
  }
}


// Retrieves data from localStorage using the given key.
// Parses the data if it exists; otherwise, logs a message and returns null.
// Handles errors with try...catch and logs any issues to the console.

function getFromLocalStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data !== null
      ? JSON.parse(data)
      : (console.log(`No data found in localStorage with key: ${key}`), null);
  } catch (error) {
    console.error(`Error retrieving data from localStorage: ${error}`);
    return null;
  }
}



// Checks if data for the given year exists in localStorage.
// Retrieves it if found; otherwise, fetches it from API.
// Stores the retrieved data in localStorage.

async function checkInLocalStorage(year, countryCode) {
  console.log(year, countryCode);
  let data;
  // Check if data is in local storage
  localStorage.getItem(year)
    ? data = getFromLocalStorage(year)
    : data = await getCalendarAPIData(countryCode, year)
  addToLocalStorage(year, data);

  return data;
}

// ALTERNATIVE VERSION - CHECKS IF COUNTRY CODE MATCHES LOCAL STORAGE

// async function checkInLocalStorage(year, countryCode) {
//   let data;
//   const pendingData = await getCalendarUrl(countryCode, year);
//   const checkCurrentData = getFromLocalStorage(year);

//   if (checkCurrentData) {
//     const currentDataCountry = checkCurrentData.response.holidays[0].country.id.trim().toUpperCase();
//     const formattedCountryCode = countryCode.trim().toUpperCase();

//     if (currentDataCountry !== formattedCountryCode) {
//       // Remove outdated data and use the new data
//       removeFromLocalStorage(year);
//       data = pendingData;

//     } else {
//       // Use existing data if country codes match
//       data = checkCurrentData;
//     }

//   } else {
//     // Use new data if no existing data is found
//     data = pendingData;
//   }

//   // Add updated data to localStorage
//   addToLocalStorage(year, data);
//   return data;
// }



// Checks if data exists in localStorage for the given key.
// Retrieves it if found; otherwise, uses the provided array.
// Stores the data in localStorage.

async function checkUserEventsInLocalStorage(key, array) {
  let data;
  localStorage.getItem(key)
    ? data = getFromLocalStorage(key)
    : data = array;
    addToLocalStorage(key, data);
}



// =============================================
//  Hide / Show Loading
// =============================================

// Toggles loading screen on calendar load / during API requests.

const loading = document.querySelector('.loading-container');

function showLoading() {
  loading.classList.remove('hide-loading');
}
function hideLoading() {
  loading.classList.add('hide-loading');
}



export {
  // Month name functions
  monthNames,
  getShortMonthName,

  // Category colors object
  eventCategoryColorsObject,

  // Date / month functions
  highlightCurrentDate,
  getFirstDayIndex,
  getDayCountOfMonth,
  getDayCountOfPreviousMonth,
  getDayCountOfNextMonth,

  // Local storage object property / input functions
  assignObjectID,
  setInputValues,
  setObjectValues,

  // Date / time input functions
  addHighlights,
  formatDateAndTime,

  // Local storage functions
  addToLocalStorage,
  getFromLocalStorage,
  checkInLocalStorage,
  checkUserEventsInLocalStorage,

  // Hide and show loading
  showLoading,
  hideLoading
}