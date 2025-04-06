import { dynamicallyUpdateEventDates } from "../dynamicallyUpdateEventDates.js";
import { monthEventPositioning } from "../../monthEventPositioning.js";
import { setSummaryDateString } from "../handleEventObjectValues.js";
import { updateEventInLocalStorage } from "../userEventsLocalStorage.js";


// =============================================
//  Date Object Values And Date Strings
// =============================================

// This function uses the data attributes from the widget calendar buttons to update the startDate and endDate properties in userEventObject when clicked.
// It also calculates the dates between the startDate and endDate and adds in a separate array of objects to allow for multiple date events.

function handleDateValues(dateButton, dateDataAttributes, eventDetailsElements, userEventObject) {
  // Destructure variables from objects
  const { dates: { startDate, endDate } } = userEventObject;
  const { dataYear, dataMonth, dataDate } = dateDataAttributes;
  const { classElement } = eventDetailsElements;

  // Select calendar container of date button clicked
  const calendarContainer = dateButton.closest('.widget-calendar').parentElement;

  // Update object date properties
  if (calendarContainer.classList.contains('start-date-calendar-container')) {
    updateUserEventObject(startDate, dataYear, dataMonth, dataDate);

  } else if (calendarContainer.classList.contains('end-date-calendar-container')) {
    updateUserEventObject(endDate, dataYear, dataMonth, dataDate);
  }

  // Match start / end date object times if selected start date is after end date or vice-versa
  synchronizeDateObjects(startDate, endDate, calendarContainer);

  // Get array of all dates spanning from the startDate to the endDate and add to userEventObject
  const betweenDates = getDatesBetween(startDate, endDate);
  userEventObject.dates.datesArray = betweenDates;

  // Updated object dates
  const startDateArray = [startDate.date, startDate.month, startDate.year];
  const endDateArray = [endDate.date, endDate.month, endDate.year];

  // Select furthest common ancestor and use to select both dateStrings and inputs
  const { startDateStringInputs, endDateStringInputs } = getDateStringInputs(dateButton);

  // Update date strings
  updateBothDateStrings(startDateStringInputs, startDateArray, endDateArray);
  updateBothDateStrings(endDateStringInputs, endDateArray, endDateArray);

  // Update date summary string
  setSummaryDateString(eventDetailsElements, userEventObject);

  // Created an updated array of event elements and append to correct date elements when widget date button is clicked
  dynamicallyUpdateEventDates(userEventObject, eventDetailsElements);

  // Organize events according to length and position in a grid format in month calendar view
  monthEventPositioning(classElement, null);

  // Add new or update existing item in localStorage when widget date button is clicked
  updateEventInLocalStorage(userEventObject);
}


// Helper function to update object date properties
function updateUserEventObject(dateObject, year, month, date) {
  dateObject.year = year;
  dateObject.month = month;
  dateObject.date = date;
}


function synchronizeDateObjects(startDate, endDate, calendarContainer) {
  // New date objects created from updated start and end dates
  // (Used to calculate whether startDate or endDate are earlier or later than each other)
  const startDateObj = new Date(startDate.year, startDate.month - 1, startDate.date);
  const endDateObj = new Date(endDate.year, endDate.month - 1, endDate.date);

  // If user selects start date that is later than end date, update end date to match 
  if (calendarContainer.classList.contains('start-date-calendar-container') && (startDateObj.getTime() > endDateObj.getTime())) {
    updateUserEventObject(endDate, startDate.year, startDate.month, startDate.date);
  }

  // If user selects end date that is earlier than start date, update start date to match 
  if (calendarContainer.classList.contains('end-date-calendar-container') && (endDateObj.getTime() < startDateObj.getTime())) {
    updateUserEventObject(startDate, endDate.year, endDate.month, endDate.date);
  }
}


function getDateStringInputs(dateButton) {
  const dateAndTime = dateButton.closest('.date-and-time-details-container');
  const startDateString = dateAndTime.querySelector('.start-date-string');
  const endDateString = dateAndTime.querySelector('.end-date-string');

  return {
    startDateStringInputs: startDateString.querySelectorAll('input'),
    endDateStringInputs: endDateString.querySelectorAll('input')
  }
}


// Updates both the start and end dates on the date summary section located in the calendarEventDetails pop-up.
// Matches both dateStrings if the selected startDate is later than the endDate and vice-versa.

function updateBothDateStrings(dateStringInputs, startDateArray, endDateArray) {
  // Update values in date attribute inputs, adding a '0' to single digit values
  dateStringInputs.forEach((element, index) => {

    // Update start date string value
    if (element.parentElement.classList.contains('start-date-string')) {
      element.value = startDateArray[index] < 10 ? `0${startDateArray[index]}` : startDateArray[index];

      // Update end date string value
    } else if (element.parentElement.classList.contains('end-date-string')) {
      element.value = endDateArray[index] < 10 ? `0${endDateArray[index]}` : endDateArray[index];
    }
  });
}



// =============================================
//  Get Dates Between
// =============================================

// Creates date objects for both startDate and endDate, and any dates in between.
// Date objects are stored in an array in the dates section of userEventObject.
// The startDate and endDate months must be adjusted to minus-one to account for zero-indexed formatting.
// When creating date objects, months are increased by one to sync back with calendar.

function getDatesBetween(startDate, endDate) {
  const dates = [];

  // Create date objects from startDate and endDate (Adjust for zero-indexed months)
  startDate = new Date(startDate.year, startDate.month - 1, startDate.date);
  endDate = new Date(endDate.year, endDate.month - 1, endDate.date);

  // Initialize currentDate to startDate
  let currentDate = startDate;

  while (currentDate <= endDate) {
    // Create date object (Adjust for zero-indexed months)
    let currentDateObject = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
      date: currentDate.getDate()
    }

    // Push date object to array
    dates.push(currentDateObject);

    // Increase date by one with each iteration
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}



// =============================================
//  Highlight Selected Date
// =============================================

// Select and loop through all date elements from widget calendar and highlight.
// "eventDateObj" is used to differentiate between.

function highlightMatchingDate(calendarContainer, userEventObject) {
  // Select widget calendar date buttons
  const calendarDateButtons = calendarContainer.querySelectorAll('.widget-date-element');
  
  calendarDateButtons.forEach(dateButton => {
    // Create date object from either startDate or endDate, depending on which calendar clicked
    const eventDateObj = getEventDateObj(calendarContainer, userEventObject);

    // Get dataset attributes from date buttons and date properties from event date object
    const dateInformation = getDateInformation(dateButton, eventDateObj);

    // Highlight date button that matches startDate / endDate object
    addHighlightClass(dateButton, dateInformation);
  });
}


function getEventDateObj(calendarContainer, userEventObject) {
  const { dates: { startDate, endDate } } = userEventObject;

  // Define event date object
  let eventDateObj;

  // Create event date objects and adjust one-based index of userEventObject for default zero-based JS date object 
  if (calendarContainer.classList.contains('start-date-calendar-container')) {
    eventDateObj = new Date(startDate.year, startDate.month - 1, startDate.date);
  }
  else if (calendarContainer.classList.contains('end-date-calendar-container')) {
    eventDateObj = new Date(endDate.year, endDate.month - 1, endDate.date);
  }

  return eventDateObj;
}


function getDateInformation(dateButton, eventDateObj) {
  // Get data attributes
  const dateDatasetAttributes = {
    dataYear: Number(dateButton.dataset.year),
    dataMonth: Number(dateButton.dataset.month),
    dataDate: Number(dateButton.dataset.date)
  }

  // Get date properties from user event objects
  const eventDateObjProperties = {
    calendarYear: eventDateObj.getFullYear(),
    calendarMonth: eventDateObj.getMonth() + 1, // Adjust back to one-based month index to match with data-attributes
    calendarDate: eventDateObj.getDate()
  }
  
  return { dateDatasetAttributes, eventDateObjProperties }
}


function addHighlightClass(dateButton, dateInformation) {
  const {
    dateDatasetAttributes: { dataYear, dataMonth, dataDate },
    eventDateObjProperties: { calendarYear, calendarMonth, calendarDate }
  } = dateInformation;

  // Remove 'highlight' class from all date buttons (Works when typing into HTML inputs)
  dateButton.classList.remove('highlight');

  // Add highlight class to dateButton
  if (
    dataYear === calendarYear && 
    dataMonth === calendarMonth && 
    dataDate === calendarDate) {
      dateButton.classList.add('highlight');
  }
}



// =============================================
//  Update All Input Values
// =============================================

// Update all input values from startDate / endDate objects.

function updateAllInputValues(allInputs, userEventObject) {
  // Destructure start / end times and dates from userEventObject
  const { time: { startTime, endTime }, dates: { startDate, endDate } } = userEventObject;

  // Helper function to format time
  const formatTime = (time) => (time < 10 ? `0${time}` : time);

  const classMap = {
    'start-date date-input': startDate.date,
    'start-month month-input': startDate.month,
    'start-year year-input': startDate.year,
    'end-date date-input': endDate.date,
    'end-month month-input': endDate.month,
    'end-year year-input': endDate.year,
    'start-time hour-input': startTime.hours,
    'start-time minute-input': startTime.minutes,
    'end-time hour-input': endTime.hours,
    'end-time minute-input': endTime.minutes,
  };

  allInputs.forEach(inputElement => {
    for (let key in classMap) {
      const [firstClass, secondClass] = key.split(' ');
      if (inputElement.classList.contains(firstClass) && inputElement.classList.contains(secondClass)) {
        let value = classMap[key];
        inputElement.value = formatTime(value);
        break;
      }
    }
  });
}



export {
  getDatesBetween,
  handleDateValues,
  synchronizeDateObjects,
  highlightMatchingDate,
  updateAllInputValues
}