import { globalDate, countryIsoCode } from "../index.js";
import { YearCalendar } from "./year-calendar.js";
import { MonthCalendar } from "./month-calendar.js";
import { checkInLocalStorage, showLoading, hideLoading } from "../utils.js";


// =============================================
//  Classes
// =============================================

const subHeader = document.querySelector('.sub-header');

// Header contenr
const monthHeaderContent = document.querySelector('.month-header-content');
const yearHeaderContent = document.querySelector('.year-header-content');

// Calendar content
const content = document.querySelector('.calendar-class-content');
const monthClassElement = document.querySelector('.month-calendar');
const yearClassElement = document.querySelector('.year-calendar');

let monthCalendar;
let yearCalendar;


// Assign API data to classes and hide the loading screen
const initClasses = (currentYearData, prevYearData, nextYearData) => {
  yearCalendar = new YearCalendar({ 
    element: yearClassElement, 
    prevYearData, 
    currentYearData, 
    nextYearData 
  });

  monthCalendar = new MonthCalendar({ 
    element: monthClassElement, 
    prevYearData, 
    currentYearData, 
    nextYearData 
  });

  hideLoading();
}



// =============================================
//  Update Classes
// =============================================

// Called in month and year classes when calendar dates are changed with the 'prev' and 'next' buttons.
// Loading screen is initiated at first and later removed when data is loaded.

// Update API data in classes
async function updateClasses(year) {
  let calendars = [monthCalendar, yearCalendar];
  const currentYear = year;
  const prevYear = year - 1;
  const nextYear = year + 1;

  showLoading(); // Show loading before async operations

  try {
    // Check local storage for data or make new API call
    const newCurrentYearData = await checkInLocalStorage(currentYear, countryIsoCode);
    const newPrevYearData = await checkInLocalStorage(prevYear, countryIsoCode);
    const newNextYearData = await checkInLocalStorage(nextYear, countryIsoCode);

    // Replace data in calendars
    calendars.forEach(calendar => {
      calendar.currentYearData = newCurrentYearData;
      calendar.prevYearData = newPrevYearData;
      calendar.nextYearData = newNextYearData;
    });

  } catch (error) {
    console.error("Error updating classes:", error);
  } finally {
    hideLoading(); // Ensure loading is hidden even if an error occurs
  }
}



// =============================================
//  Calendar View Functions
// =============================================

// Called when calendar class is called, on initial load or with header buttons.
// Replaces header content to specific calendar and calls calendar class.

function showCalendar(headerContent, classElement, calendarInstance, globalDate) {
  const { year, month, date } = globalDate;

  // Clear before render
  subHeader.innerHTML = '';
  content.innerHTML = '';

  // Append header and calendar content
  subHeader.appendChild(headerContent);
  content.appendChild(classElement);

  // Pass global date into calendar class
  calendarInstance.init(year, month, date);
}


function showYearCalendar() {
  showCalendar(yearHeaderContent, yearClassElement, yearCalendar, globalDate);
}

function showMonthCalendar() {
  showCalendar(monthHeaderContent, monthClassElement, monthCalendar, globalDate);
}




export {
  initClasses,
  updateClasses,
  showYearCalendar,
  showMonthCalendar,
  monthCalendar
}