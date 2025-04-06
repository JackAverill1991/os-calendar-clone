import { getDatesBetween, highlightMatchingDate, synchronizeDateObjects, updateAllInputValues } from "./sharedDateChangeFunctions.js";
import { dynamicallyUpdateEventDates } from "../dynamicallyUpdateEventDates.js";
import { monthEventPositioning } from "../../monthEventPositioning.js";
import { navigateInputs } from "./timeInputFunctionality.js";
import { removeArrowElement } from "../../event-details-element/arrowElementFunctions.js";
import { updateEventInLocalStorage } from "../userEventsLocalStorage.js";
import { updateSearchResults } from "../../../search-form/searchbarFunctionality.js";
import { getDayCountOfMonth, getDayCountOfPreviousMonth, getDayCountOfNextMonth } from "../../../utils.js";


// =============================================
//  Add Widget Calendar Key Events
// =============================================

// Attach input event listeners that update dateStrings and event elements (alternative to clicking calendar date buttons).

function addWidgetCalendarKeyEvents(eventElementsObject, userEventObject, widgetCalendarElements) {
  const { classElement, calendarEventDetails, widgetCalendarClasses } = eventElementsObject;
  const { dateString, dateStringInputs, calendarContainer } = widgetCalendarElements;

  // Date details elements
  const dateTimeDetails = calendarEventDetails.querySelector('.date-and-time-details');
  const allDateInputElements = dateTimeDetails.querySelectorAll('.date-string-input');

  // Combine necessary variables into new object to avoid mutating original
  const eventDetailsElements = {
    calendarEventDetails,
    dateString,
    dateStringInputs,
    allDateInputElements,
    calendarContainer,
    classElement,
  }

  // Attach key input event listeners
  dateStringInputs.forEach(inputElement => {
    attachKeyInputEventListeners(inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses);
  });
}



// =============================================
//  Attach Key Input Event Listeners
// =============================================

// Attaches event listeners 'input' & 'keydown' to the widget calendar input elements that allow user to type in date values or increment / decrement them with the arrow keys.
// Left and right arrows are also able to navigate left and right through the inputs for easy transitioning.
// Direction pointer arrows are removed from details pop-up element when date is changed.
// Timeouts are initiated on the inputElement.
// 'eventObjectTimeout' ensures the userEventObject is only updated after the user has finished typing.
// 'autoCompleteTimeout' allows a 1s pause before input feilds are autocompleted.

function attachKeyInputEventListeners(inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses) {
  // Deconstruct elements from eventDetailsElements
  const { allDateInputElements, calendarEventDetails } = eventDetailsElements;

  // Declare timeout variables
  inputElement.eventObjectTimeout = null;
  inputElement.autoCompleteTimeout = null;

  // Separate inputElements by class for targeted keyboard functionality
  if (inputElement.classList.contains('date-input')) {
    dateInputKeyFunctionality(inputElement, userEventObject);
  }
  else if (inputElement.classList.contains('month-input')) {
    monthInputKeyFunctionality(inputElement, inputElement.eventObjectTimeout);
  }
  else if (inputElement.classList.contains('year-input')) {
    yearInputKeyFunctionality(inputElement);
  }

  inputElement.addEventListener('input', () => {
    // Remove arrow when date changes
    handleArrowRemoval(calendarEventDetails, eventDetailsElements);
  
    // Handle object update input event listeners
    handleInputObjectUpdate(inputElement, eventDetailsElements, widgetCalendarClasses, userEventObject);
  });

  inputElement.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Remove arrow when date changes
      handleArrowRemoval(calendarEventDetails);

      // Handle object update event listeners for up/down arrow keys
      handleKeydownObjectUpdate(e, inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses);
    }

    // Allow input navigation with left/right arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dateContainer = inputElement.parentElement; // Select parent container of inputElement
      navigateInputs(e, inputElement, dateContainer, allDateInputElements, null);
    }
  });
}


function handleArrowRemoval(calendarEventDetails) {
  if (calendarEventDetails.dataset.dateChanged !== 'true') {
    // Remove arrow when date changes
    removeArrowElement(calendarEventDetails);
  }
}



// =============================================
//  Handle Individual Input Functionality
// =============================================

// Separate logic for each date input is handled individually.
// Numbers are autocorrected immediately or autocompleted with a time delay based on the possible dates that could be accepted.

function dateInputKeyFunctionality(inputElement, userEventObject) {
  inputElement.addEventListener('keydown', (e) => {
    addSharedKeydownFunctions(e, inputElement); // Add shared functions to all three inputs
    preventDateExceedingMonthTotal(inputElement, userEventObject, e); // Prevent date input number exceeding dates in month
    preventDoubleZero(inputElement, e); // Prevent user from typing in two '0's (defaults to '01' instead)
  });

  inputElement.addEventListener('input', (e) => {
    // Clear previous timeout if still running
    clearTimeout(inputElement.autoCompleteTimeout);

    // Set a new timeout for the completeDates function (timeout allows pause to complete double digit numbers befire auto-complete)
    inputElement.autoCompleteTimeout = setTimeout(() => autoCompleteNumbers(inputElement, '1', '3', true), 1000);

    // Automatically add '0' to numbers four to nine 
    autoCompleteNumbers(inputElement, '4', '9', false);
  });
}


function monthInputKeyFunctionality(inputElement) {
  inputElement.addEventListener('keydown', (e) => {
    addSharedKeydownFunctions(e, inputElement); // Add shared functions to all three inputs
    preventMonthsOverTwelve(inputElement, e); // Prevent user typing in month value over 12
    preventDoubleZero(inputElement, e); // Prevent user from typing in two '0's (defaults to '01' instead)
  });

  inputElement.addEventListener('input', () => {
    // Clear previous timeout if still running
    clearTimeout(inputElement.autoCompleteTimeout);

    // Set a new timeout for the completeDates function
    inputElement.autoCompleteTimeout = setTimeout(() => autoCompleteNumbers(inputElement, '1', '1', true), 1000);

    // Automatically add '0' to numbers two to nine 
    autoCompleteNumbers(inputElement, '2', '9', false); 
  });
}


function yearInputKeyFunctionality(inputElement) {
  inputElement.addEventListener('keydown', (e) => {
    addSharedKeydownFunctions(e, inputElement); // Add shared functions to all three inputs
  });
}


function addSharedKeydownFunctions(e, inputElement) {
  allowControlKeys(e); // Allow control keys (e.g., backspace, delete, arrow keys)
  positionCursorAtEnd(inputElement); // Keep cursor at the end of input  
  clearInputOnKeyPress(inputElement, e); // Overwrite existing input value when input is full and key is pressed
}



// =============================================
//  Handle Input Object Update
// =============================================

// 'handleInputObjectUpdate' uses timeout to ensure input entry has been fully completed before dates are updated in userEventObject.
// 'handleKeydownObjectUpdate' uses the increment / decrement date value from arrows to update userEventObject.

function handleInputObjectUpdate(inputElement, eventDetailsElements, widgetCalendarClasses, userEventObject) {
  // Clear any existing timeout
  clearTimeout(inputElement.eventObjectTimeout);

  // Select max length data attribute
  const maxLength = Number(inputElement.getAttribute('maxlength'));

  // Set timeout function to account for auto-complete if user types one character and then leaves the other blank (excludes year input)
  if (!inputElement.matches('.year-input') && inputElement.value.length === 1) {
    inputElement.eventObjectTimeout = setTimeout(() => {
      // If date value has been typed by user, update userEventObject with input values
      updateObjectsFromInputs(inputElement, userEventObject);

      // Select widget calendar adjacent to clicked dateString and matching date object
      handleDateUpdate(inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses);
    }, 1000);

  } else if (inputElement.value.length === maxLength) {
    // If date value has been typed by user, update userEventObject with input values
    updateObjectsFromInputs(inputElement, userEventObject);

    // Select widget calendar adjacent to clicked dateString and matching date object
    handleDateUpdate(inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses);
  }
}


function handleKeydownObjectUpdate(e, inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses) {
  // Increment / Decrement input values using up and down arrow keys
  arrowIncrementAndDecrement(e, inputElement, userEventObject);

  // Select widget calendar adjacent to clicked dateString and matching date object
  handleDateUpdate(inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses);
}



// =============================================
//  Input Arrow Increment / Decrement Functions
// =============================================

// Determines the type of input (date, month, or year) based on its class and calls the appropriate function to increment or decrement date.
// Assigns the corresponding date object (either startDate or endDate).

function arrowIncrementAndDecrement(e, inputElement, userEventObject) {
  // De-structure start & end dates from userEventObject
  const { dates: { startDate, endDate } } = userEventObject;

  // Get determine input by class
  const isStartDate = inputElement.classList.contains('start-date');
  const isEndDate = inputElement.classList.contains('end-date');
  const isStartMonth = inputElement.classList.contains('start-month');
  const isEndMonth = inputElement.classList.contains('end-month');
  const isStartYear = inputElement.classList.contains('start-year');
  const isEndYear = inputElement.classList.contains('end-year');

  // Assign dateObject startDate / endDate based on input class
  let dateObject = null;
  if (isStartDate || isStartMonth || isStartYear) {
    dateObject = startDate;
  } else if (isEndDate || isEndMonth || isEndYear) {
    dateObject = endDate;
  }

  // Exit function if input class is not found
  if (!dateObject) return;

  // Get total days in month
  let dayCountOfMonth = getDayCountOfMonth(dateObject.year, dateObject.month);
  let dayCountOfPrevMonth = getDayCountOfPreviousMonth(dateObject.year, dateObject.month);
  let dayCountOfNextMonth = getDayCountOfNextMonth(dateObject.year, dateObject.month);

  // Handle date, month or year increment / decrement
  if (isStartDate || isEndDate) {
    dateInputIncrementAndDecrement(e, dateObject, dayCountOfMonth, dayCountOfPrevMonth);

  } else if (isStartMonth || isEndMonth) {
    monthInputIncrementAndDecrement(e, dateObject, dayCountOfPrevMonth, dayCountOfNextMonth);

  } else if (isStartYear || isEndYear) {
    yearInputIncrementAndDecrement(e, dateObject, dayCountOfPrevMonth, dayCountOfNextMonth);
  }
}


function dateInputIncrementAndDecrement(e, dateObject, dayCountOfMonth, dayCountOfPrevMonth) {
  // Save up and down key press as variables
  const isUp = e.key === 'ArrowUp';
  const isDown = e.key === 'ArrowDown';

  // Exit if key pressed is not up / down arrow
  if (!isUp && !isDown) return;

  // Check for cases where the beginning or end of the month is reached
  if ((isUp && dateObject.date === dayCountOfMonth) || (isDown && dateObject.date === 1)) {
    // For downward increment, set date to the last day of previous month, whilst for upward increment, set to '1'
    dateObject.date = isUp ? 1 : dayCountOfPrevMonth;
    dateObject.month += isUp ? 1 : -1;

    // Reset month to 1 and increment year
    if (dateObject.month === 13) dateObject.month = 1, dateObject.year++;

    // Reset month to 12 and decrement year
    if (dateObject.month === 0) dateObject.month = 12, dateObject.year--;
    
  } else {
    // Increment or decrement date
    dateObject.date += isUp ? 1 : -1;
  }
}


function monthInputIncrementAndDecrement(e, dateObject, dayCountOfPrevMonth, dayCountOfNextMonth) {
  const isUp = e.key === 'ArrowUp';
  const isDown = e.key === 'ArrowDown';

  if (!isUp && !isDown) return;

  // Increment or decrement month
  dateObject.month += isUp ? 1 : -1;

  // Adjust year and reset month to beginning / end of year if necessary
  if (dateObject.month === 13) {
    dateObject.month = 1;
    dateObject.year++;
  } else if (dateObject.month === 0) {
    dateObject.month = 12;
    dateObject.year--;
  }

  // Adjust date if it exceeds the days in the new month
  const newDayCount = isUp ? dayCountOfNextMonth : dayCountOfPrevMonth;
  if (dateObject.date > newDayCount) {
    dateObject.date = newDayCount;
  }
}


function yearInputIncrementAndDecrement(e, dateObject) {
  const isUp = e.key === 'ArrowUp';
  const isDown = e.key === 'ArrowDown';

  if (!isUp && !isDown) return;

  // Increment or decrement year
  dateObject.year += isUp ? 1 : -1;

  // Get days in the current month of the updated year
  const dayCountOfMonth = getDayCountOfMonth(dateObject.year, dateObject.month);

  // Adjust the date if it exceeds the days in the new month
  if (dateObject.date > dayCountOfMonth) {
    dateObject.date = dayCountOfMonth;
  }
}



// =============================================
//  Handle Date Update
// =============================================

// Select widget calendar adjacent to clicked dateString and pass it to handleDateUpdate function along with the matching date object (startDate / endDate).

function handleDateUpdate(inputElement, eventDetailsElements, userEventObject, widgetCalendarClasses) {
  // Deconstruct variables from objects
  const { dates: { startDate, endDate } } = userEventObject;
  const { startDateWidgetCalendar, endDateWidgetCalendar } = widgetCalendarClasses;
  const { dateStringInputs, calendarContainer, classElement } = eventDetailsElements;

  // Match start / end date object times if selected start date is after end date or vice-versa
  synchronizeDateObjects(startDate, endDate, calendarContainer);

  // Get array of all dates spanning from the startDate to the endDate and add to userEventObject
  const betweenDates = getDatesBetween(startDate, endDate);
  userEventObject.dates.datesArray = betweenDates;

  const allInputs = inputElement.closest('.date-and-time-details').querySelectorAll('input');
  updateAllInputValues(allInputs, userEventObject);

  // Pass event object dates into calendars
  startDateWidgetCalendar.setClassDate(startDate.year, startDate.month, startDate.date);
  endDateWidgetCalendar.setClassDate(endDate.year, endDate.month, endDate.date);

  // Highlight selected date
  highlightMatchingDate(calendarContainer, userEventObject);

  // Created an updated array of event elements and append to correct date elements when widget date button is clicked
  dynamicallyUpdateEventDates(userEventObject, eventDetailsElements);

  // Organize events according to length and position in a grid format in month calendar view
  monthEventPositioning(classElement, null);

  // Add new or update existing item in localStorage when widget date button is clicked
  updateEventInLocalStorage(userEventObject);

  // Update search results element results if it is open
  updateSearchResults();
}



// =============================================
//  Update Objects From Inputs
// =============================================

// If time value has been typed by user, update start / end objects in userEventObject with input values.
// If date value has been selected by incrementing / decrementing with arrow keys, no need to update userEventObject as values are already there.

function updateObjectsFromInputs(inputElement, userEventObject) {
  // Deconstruct variables from objects
  const { dates: { startDate, endDate } } = userEventObject;

  // Select parent dateString from clicked input
  const dateString = inputElement.parentElement;

  // Select input values from relevant dateString
  const yearInputValue = Number(dateString.querySelector('.year-input').value);
  const monthInputValue = Number(dateString.querySelector('.month-input').value);
  const dateInputValue = Number(dateString.querySelector('.date-input').value);
  
  // Update either startTime / endTime object based on class of dateString clicked
  if (dateString.classList.contains('start-date-string')) {
    updateUserEventObject(startDate, yearInputValue, monthInputValue, dateInputValue);
  
  } else if (dateString.classList.contains('end-date-string')) {
    updateUserEventObject(endDate, yearInputValue, monthInputValue, dateInputValue);
  }
}


// Helper function to update object date properties
function updateUserEventObject(dateObject, year, month, date) {
  dateObject.year = year;
  dateObject.month = month;
  dateObject.date = date;
}



// =============================================
//  Functions For Individual Inputs
// =============================================

// Date input functions ========================

function preventDateExceedingMonthTotal(inputElement, userEventObject, e) {
  // Deconstruct dates from user event object
  const { dates: { startDate, endDate } } = userEventObject;

  let inputMonth, inputYear;
  let value = inputElement.value;

  // Calculate inputMonth & inputYear based on which input string is being used
  if (inputElement.classList.contains('start-date')) {
    inputMonth = startDate.month;
    inputYear = startDate.year;
  } else if (inputElement.classList.contains('end-date')) {
    inputMonth = endDate.month;
    inputYear = endDate.year;
  }

  // Get total days in month
  const dayCountOfMonth = getDayCountOfMonth(inputYear, inputMonth);

  // Calculate what the value would be after adding the new digit
  const newValue = value + e.key;

  // Prevent typing if the new value exceeds the days in the month
  if (Number(newValue) > dayCountOfMonth) {
    e.preventDefault();
  }
}


// Month input functions =======================

function preventMonthsOverTwelve(inputElement, e) {
  let value = inputElement.value;
  const blockedKeys = ['3', '4', '5', '6', '7', '8', '9'];

  // Block user from adding numbers 3-9 after number '1' to prevent incorrect month values
  if (value.length > 0 && value[0] === '1' && blockedKeys.includes(e.key)) {
    e.preventDefault();
  }
}


// Global input functions ======================

function preventNonNumbers(inputElement) {
  inputElement.value = inputElement.value.replace(/[^0-9]/g, '');
}


// Autocomplete numbers in date and month inputs when user types incorrect / impossible date entries
function autoCompleteNumbers(inputElement, startNum, endNum, delay) {
  let value = inputElement.value;

  // Automatically add zero as prefix to single-digit numbers within specified range (startNum - endNum)
  if (value.length === 1 && (value[0] >= startNum && value[0] <= endNum)) {
    value = '0' + value;
    inputElement.value = value;

  // Add a '1' to the end of a single '0' when entered
  } else if (value.length === 1 && value[0] === '0' && delay === true) {
    value = '0' + '1';
    inputElement.value = value;
  
  }
}


// If the first character of the input value is '0' prevent a second '0' from being typed,
function preventDoubleZero(inputElement, e) {
  let value = inputElement.value;
  if (value.length === 1 && value[0] === '0' && e.key === '0') {
    e.preventDefault();
  }
}


// Allow control keys (e.g., backspace, delete, arrow keys)
function allowControlKeys(e) {
  const controlKeys = ['Backspace', 'Delete'];
  if (controlKeys.includes(e.key)) {
    return;
  }
}


function clearInputOnKeyPress(inputElement, e) {
  // Select max length data attribute
  const maxLength = Number(inputElement.getAttribute('maxlength'));

  // Check if input is full and if the pressed key is a number
  if (inputElement.value.length === maxLength && e.key >= '0' && e.key <= '9') {
    // Clear the input value and allow the new number key to be added
    inputElement.value = '';
  }
}


// Keep cursor at the end of input
function positionCursorAtEnd(inputElement) {
  const length = inputElement.value.length;
  inputElement.setSelectionRange(length, length);
}


export {
  addWidgetCalendarKeyEvents,
  preventNonNumbers,
  allowControlKeys,
  clearInputOnKeyPress,
  positionCursorAtEnd,
  navigateInputs
}