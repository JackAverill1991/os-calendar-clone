import { initClasses, showMonthCalendar} from "./calendar-classes/loadAndDisplayClasses.js";
import { sidebarWidgetCalendar } from "./sidebar.js";
import { addCalendarCategories } from "./calendar-categories/addNewCalendarCategory.js";
import { loadCalendarCategories } from "./calendar-categories/loadCalendarCategories.js";
import { editCalendarCategories } from "./calendar-categories/editCalendarCategory.js";
import { deleteCalendarCategory } from "./calendar-categories/deleteCalendarCategory.js";
import { addApiCategory } from "./calendar-categories/addApiCategory.js";
import { configureHeaderContent } from "./headerContent.js";
import { searchbarFunctionality } from "./search-form/searchbarFunctionality.js";
import { checkInLocalStorage } from "./utils.js";
import { getGeoLocation } from "./fetch-data.js"; 
import { addSvgIcon } from "./icons/icons.js";



// =============================================
//  Dates And Country ISO Code
// =============================================

// Defines global date-related variables and a function to get a range of years for API data. 
// Sets a default date, tracks a global date object, and stores a country ISO code for accurate calendar data. 
// 'getYearRange' function returns the current, previous, and next year.

// Country ISO code for accurate calendar API data
let countryIsoCode;

// Default date
const defaultDate = new Date();

// Global date that classes interact with
let globalDate = {
  year: defaultDate.getFullYear(),
  month: defaultDate.getMonth() + 1,
  date: defaultDate.getDate(),
}

// Get range of years to find API data
function getYearRange() {
  return {
    defaultYear: defaultDate.getFullYear(),
    defaultPrevYear: defaultDate.getFullYear() - 1,
    defaultNextYear: defaultDate.getFullYear() + 1,
  }
}



// =============================================
//  Initial Document Load
// =============================================

// Removes the 'hide' class from the body to prevent a flash of unstyled content.
// Creates a sidebar widget calendar.
// Configures header buttons by adding event listeners, classes, and styles.
// Loads user categories and enables adding / editing / deleting categories.
// Adds an API category.
// Enables search functionality for user-added events.
// Gets geolocation and API data, then loads the calendar.

document.addEventListener('DOMContentLoaded', async () => {
  // Remove 'hide' class from body to revent flash of unstyled content
  document.body.classList.remove("hide");

  // Add spinning loading icon
  addLoadingIcon();
  
  // Create sidebar widget calendar
  sidebarWidgetCalendar();

  // Add event listeners, classes and styling to header buttons
  configureHeaderContent();

  // Sidebar calendar category functions
  callCategoryFunctions()

  // Add search functionality for user-added events
  searchbarFunctionality();

  // Get geolocation and API data, and load calendar
  await getDataAndLoadCalendar();
});


function addLoadingIcon() {
  const loadingIcon = document.querySelector('.loading-icon');
  // Create SVG and add to the button (Parameters are icon, container, strokeColor, fillColor)
  addSvgIcon('loadingIcon', loadingIcon, 'none', '#f0f0f0');
}


function callCategoryFunctions() {
  loadCalendarCategories();
  addCalendarCategories();
  editCalendarCategories();
  deleteCalendarCategory();
  addApiCategory();
}



// Gets the user's geolocation and assigns it to global 'countryIsoCode' variable.
// Retrieves a range of years for API data.
// Checks local storage for calendar data or fetches new data via an API call.
// Initializes calendar classes with the retrieved data.
// Displays the month calendar on load.

async function getDataAndLoadCalendar() {
  // Get geolocation and assign to global variable above
  countryIsoCode = await getGeoLocation();

  // Get range of years to find API data
  const yearRange = getYearRange();

  // Check local storage for data or make new API call
  const {
    currentYearData,
    previousYearData,
    nextYearData
  } = await checkDataOrCallAPI(yearRange);

  // Assign data to calendar classes
  initClasses(currentYearData, previousYearData, nextYearData);

  // Show month calendar on load
  showMonthCalendar();
}



// Checks local storage for calendar data for the current, previous, and next years. 
// If the data is not found, it fetches it from the API and returns an object containing the retrieved data.

async function checkDataOrCallAPI(yearRange) {
  const { defaultYear, defaultPrevYear, defaultNextYear } = yearRange;
  return {
    currentYearData: await checkInLocalStorage(defaultYear, countryIsoCode),
    previousYearData: await checkInLocalStorage(defaultPrevYear, countryIsoCode),
    nextYearData: await checkInLocalStorage(defaultNextYear, countryIsoCode)
  }
}



export {
  globalDate,
  countryIsoCode
}