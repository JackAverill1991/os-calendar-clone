import { preventNonNumbers, allowControlKeys, clearInputOnKeyPress, positionCursorAtEnd } from "./widgetCalendarKeyFunctionality.js";
import { updateAllInputValues } from "./sharedDateChangeFunctions.js";
import { setInitialDatasetValue, numberDateTimeHandling, arrowDateTimeHandling } from "./timeInputDateChanges.js";
import { monthEventPositioning } from "../../monthEventPositioning.js";
import { updateEventInLocalStorage } from "../userEventsLocalStorage.js";
import { addHighlights, formatDateAndTime } from "../../../utils.js";


// ===============================================
//  Select Time Inputs And Attach Event Listeners
// ===============================================

// Initializes time input fields within the pop-up details element updates them based on the event data.
// Attaches event listeners for user interactions and applies highlighting when clicked.

export function addTimeInputFunctionality(elementsObject, userEventObject) {
  const { calendarEventDetails } = elementsObject;

  // Select input variables and add to elements object
  const timeInputs = calendarEventDetails.querySelectorAll('.time-input');
  elementsObject.timeInputs = Array.from(timeInputs);

  // Save inputs to object to pass into functions
  const timeInputsObject = getTimeInputsObject(calendarEventDetails);

  // Add time object values to inputs
  addInputValues(timeInputsObject, userEventObject);

  timeInputs.forEach(inputElement => {
    // Attach 'click' and 'input' event listeners to inputs
    attachEventListeners(inputElement, elementsObject, timeInputsObject, userEventObject);
    addHighlights(inputElement, timeInputs); // Add highlight classe to inputs on click
  });
}


function getTimeInputsObject(calendarEventDetails) {
  return {
    startTimeHourInput: calendarEventDetails.querySelector('.start-time.hour-input'),
    startTimeMinutesInput: calendarEventDetails.querySelector('.start-time.minute-input'),
    endTimeHourInput: calendarEventDetails.querySelector('.end-time.hour-input'),
    endTimeMinutesInput: calendarEventDetails.querySelector('.end-time.minute-input')
  }
}


function addInputValues(timeInputsObject, userEventObject) {
  // Destructure start / end times from userEventObject
  const { time: { startTime, endTime } } = userEventObject;

  // Add values from userEventObject to inputs, adding a '0' before single digit values
  timeInputsObject.startTimeHourInput.value = formatDateAndTime(startTime.hours);
  timeInputsObject.startTimeMinutesInput.value = formatDateAndTime(startTime.minutes);
  timeInputsObject.endTimeHourInput.value = formatDateAndTime(endTime.hours);
  timeInputsObject.endTimeMinutesInput.value = formatDateAndTime(endTime.minutes);
}




// =============================================
//  Attach Event Listeners
// =============================================

// Time inputs are passed into separate functions which handle either 'input' or 'keydown' event listener functionality.
// Input handles time values being typed in, whereas keydown handles increments / decrements to the time.

function attachEventListeners(inputElement, elementsObject, timeInputsObject, userEventObject) {
  const { calendarEventDetails, timeInputs } = elementsObject;

  // Initialise the timeouts on the input element itself
  inputElement.autoCompleteTimeout = null; // Timeout property for handling input value auto-complete in handleAutoComplete()
  inputElement.eventObjectTimeout = null; // Timeout property for handling updates to time object in userEventObject and DOM elements

  // Calculate initial dataset value for hour input based on time comparison between startTime and endTime
  inputElement.addEventListener('click', () => setInitialDatasetValue(inputElement, userEventObject));

  // Remove highlight class from time inputs when the event details element is clicked
  calendarEventDetails.addEventListener('click', (e) => handleDetailsElementClick(e, timeInputs));

  inputElement.addEventListener('input', () => {
    preventNonNumbers(inputElement); // Only allow number keys
    handleAutoComplete(inputElement); // Autocomplete single digits or numbers that exceed input maximum
    
    // Handle all input event listeners that update the startTime / endTime objects in userEventObject
    handleInputTimeUpdates(inputElement, elementsObject, timeInputsObject, userEventObject);
  });

  inputElement.addEventListener('keydown', (e) => {
    allowControlKeys(e); // Allow control keys (e.g., backspace, delete, arrow keys)
    positionCursorAtEnd(inputElement); // Keep cursor at the end of input    
    clearInputOnKeyPress(inputElement, e); // Overwrite existing input value when key is pressed and input is full

    // Separate inputElements by class for targeted keyboard functionality
    if (inputElement.classList.contains('hour-input')) {
      preventExceedingTotalHours(inputElement, e);
    }

    // Allow input navigation left/right arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const timeContainer = inputElement.parentElement; // Select parent container of inputElement
      navigateInputs(e, inputElement, timeContainer, Object.values(timeInputsObject), userEventObject);
    }

    // Handle all keydown event listeners that update the startTime / endTime objects in userEventObject
    handleKeydownTimeUpdates(e, inputElement, elementsObject, timeInputsObject, userEventObject);
  });
}



// =============================================
//  Handle Details Element Click
// =============================================

// Removes 'highlight' class from time inputs when details element is clicked/=.

function handleDetailsElementClick(e, timeInputs) {
  if (!e.target.classList.contains('time-input')) {
    timeInputs.forEach(input => input.classList.remove('highlight'));
  }
}



// =============================================
//  Input / Keydown Object Updates
// =============================================

// handleInputTimeUpdates() is used to handle behaviour when a user types in a number as a time value.
// An object containing the initial start time is created to calculate increase / decrease amount in synchronizeStartAndEndTime().
// Max length (max amount of input characters) is used to determine whether sharedInputFunctions() should run immediately or after a 1s delay where the number autocompletes.
// Shared functions are called (see sharedInputFunctions).

function handleInputTimeUpdates(inputElement, elementsObject, timeInputsObject, userEventObject) {
  const { time: { startTime } } = userEventObject;
  const { classElement } = elementsObject;

  // Create object containing initial start time
  const initialStartTime = { ...startTime };

  // Select max length data attribute
  const maxLength = parseInt(inputElement.getAttribute('maxlength'));

  // Clear any existing timeout
  clearTimeout(inputElement.eventObjectTimeout);
  
  // Set timeout function to account for handleAutoComplete() before sharedInputFunctions() is run
  if (inputElement.value.length === 1) {
    inputElement.eventObjectTimeout = setTimeout(() => { 
      sharedInputFunctions();
    }, 1000);

  // Run sharedInputFunctions() when input value reaches maxiumum length
  } else if (inputElement.value.length === maxLength) {
    sharedInputFunctions();
  }

  function sharedInputFunctions() {
    updateObjectsFromInputs(inputElement, userEventObject); // Update time objects in user event object with input values
    synchronizeStartAndEndTime(initialStartTime, userEventObject); // Synchonize endTime input values with startTime
    numberDateTimeHandling(inputElement, userEventObject, elementsObject); // Handle how 'input' increases and decreases in time affect dates
    sharedEventListenerFunctions(inputElement, userEventObject); // Call shared functions used by both 'input' and 'keydown'
    updateButtonTimes(elementsObject, userEventObject); // Update time element of calendar event buttons
    monthEventPositioning(classElement, null); // Organize events according to length and position in a grid format in month calendar view
  }
}


// handleKeydownTimeUpdates() is used to handle behaviour when up / down arrow keys are used to incrememt / decrement dates.
// An object containing the initial start time is created to calculate increase / decrease amount in synchronizeStartAndEndTime().
// Functions are called to handle time updates and their effect on dates, calendar event buttons, and the overall layout of the calendar.

function handleKeydownTimeUpdates(e, inputElement, elementsObject, timeInputsObject, userEventObject) {
  // Exit function if keydown is not up/down arrow
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

  const { classElement } = elementsObject;
  const { time: { startTime } } = userEventObject;

  // Create object containing initial start time
  const initialStartTime = { ...startTime };

  arrowIncrementAndDecrement(e, inputElement, userEventObject); // Increment / Decrement input values using up and down arrow keys
  synchronizeStartAndEndTime(initialStartTime, userEventObject); // Synchonize endTime input values with startTime
  arrowDateTimeHandling(e, inputElement, userEventObject, elementsObject); // Handle how 'keydown' increases and decreases in time affect dates
  sharedEventListenerFunctions(inputElement, userEventObject); // Call shared functions used by both 'input' and 'keydown'    
  updateButtonTimes(elementsObject, userEventObject); // Update time element of calendar event buttons
  monthEventPositioning(classElement, null); // Organize events according to length and position in a grid format in month calendar view
}



// ===============================================
//  Arrow Key Increment & Decrement
// ===============================================

// Handle time object values when they are incremented / decremented using the arrow keys.
// Hours reset to 0 when they go past 23, and minutes reset to 0 when they reach 59.
// Keyboard input values are handled separately in handleAutoComplete() & preventExceedingTotalHours().

function arrowIncrementAndDecrement(e, inputElement, userEventObject) {
  // Destructure start / end times and dates from userEventObject
  const { time: { startTime, endTime } } = userEventObject;

  // Determine the target timeObject (startTime or endTime) based on the input element's class
  let timeObject = inputElement.classList.contains('start-time') ? startTime : endTime;

  if (inputElement.classList.contains('hour-input')) {
    if (e.key === 'ArrowUp') {
      // If value goes above 23, reset to 0, otherwise increment value by 1
      timeObject.hours = timeObject.hours === 23 ? 0 : timeObject.hours + 1;    

    } else if (e.key === 'ArrowDown') {
      // If value goes above 23, reset to 0, otherwise increment value by 1
      timeObject.hours = timeObject.hours === 0 ? 23 : timeObject.hours - 1;
    }

  } else if (inputElement.classList.contains('minute-input')) {
    if (e.key === 'ArrowUp') {
      // If value goes above 59, reset to 0, otherwise increment value by 1
      if (timeObject.minutes === 59) {
        timeObject.minutes = 0;
        timeObject.hours = timeObject.hours === 23 ? 0 : timeObject.hours + 1;
      
      } else {
        timeObject.minutes ++;
      }

    } else if (e.key === 'ArrowDown') {
      // If value goes below 0, reset to 59, otherwise decrement value by 1
      if (timeObject.minutes === 0) {
        timeObject.minutes = 59;
        timeObject.hours = timeObject.hours === 0 ? 23 : timeObject.hours - 1;

      } else {
        timeObject.minutes --;
      }
    }
  } 
}



// =============================================
//  Synchronize Start / End Times
// =============================================

// Control how start-time inputs synchronize the end-time inputs by pushing them one hour / minute ahead.

function synchronizeStartAndEndTime(initialStartTime, userEventObject) {
  // Destructure start / end times and dates from userEventObject
  const { time: { startTime, endTime } } = userEventObject;

  // Initial start time properties before input
  const initialStartTimeHour = initialStartTime.hours;
  const initialStartTimeMinutes = initialStartTime.minutes;

  // Calculate the difference between initial start time and the new start time
  const startHourDifference = startTime.hours - initialStartTimeHour;
  const startMinutesDifference = startTime.minutes - initialStartTimeMinutes;

  // Adjust the endTime by adding difference to original time
  endTime.hours += startHourDifference;
  endTime.minutes += startMinutesDifference;

  // Handle overflow/underflow for minutes (Prevent minutes from going below 0 or over 60)
  if (endTime.minutes >= 60) {
    endTime.minutes -= 60;
    endTime.hours += 1;

  } else if (endTime.minutes < 0) {
    endTime.minutes += 60;
    endTime.hours -= 1;
  }

  // Handle overflow/underflow for hours (Prevent hours from going below 0 or over 24)
  if (endTime.hours >= 24) {
    endTime.hours -= 24;

  } else if (endTime.hours < 0) {
    endTime.hours += 24;
  }
}



// =============================================
//  Shared Input / Keydown Functions
// =============================================

// These functions handle the different event listener functionality for each time input element, for either 'input' or 'keydown'.

function sharedEventListenerFunctions(inputElement, userEventObject) {
  // Select all inputs and update their values from userEventObject
  const allInputs = inputElement.closest('.date-and-time-details').querySelectorAll('input');
  updateAllInputValues(allInputs, userEventObject);

  // Update event in local storage
  updateEventInLocalStorage(userEventObject);
}



// =============================================
//  Update Objects From Input Values
// =============================================

// Update time objects in user event object with input values.

function updateObjectsFromInputs(inputElement, userEventObject) {
  // Destructure start / end times and dates from userEventObject
  const { time: { startTime, endTime } } = userEventObject;
  
  // Select parent timeString from clicked input
  const timeString = inputElement.parentElement; 

  // Select input values from relevant timeString
  const hourInputValue = Number(timeString.querySelector('.hour-input').value);
  const minuteInputValue = Number(timeString.querySelector('.minute-input').value);

  // Update time objects based on timeString class. (No need to do this if not user typed as object values will already be there)
  if (timeString.classList.contains('start-time-string')) {
    updateUserEventObject(startTime, hourInputValue, minuteInputValue);

  } else if (timeString.classList.contains('end-time-string')) {
    updateUserEventObject(endTime, hourInputValue, minuteInputValue);
  }
}


// Helper function to update object time properties
function updateUserEventObject(dateObject, hour, minute) {
  dateObject.hours = hour;
  dateObject.minutes = minute;
}



// =============================================
//  Update Button Times
// =============================================

// Updates time display element of calendar event buttons from userEventObect as it is updated from the time inputs.

function updateButtonTimes(elementsObject, userEventObject) {
  const { classElement } = elementsObject;
  const { eventId, dates: { datesArray }, time: { startTime, endTime } } = userEventObject;
  
  // Select any other event elements with matching ID
  const matchingIdElements = Array.from(classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`));

  // Return if there are no buttons from matching event on the screen
  if (matchingIdElements.length === 0) return;

  // Helper function for time formatting
  function formatTime(hours, minutes) {
    return `${formatDateAndTime(hours)}:${formatDateAndTime(minutes)}`;
  }

  // Update start and end times for multiple date events
  if (datesArray.length > 1) {
    // Select first event element and update start time
    const firstElementTime = matchingIdElements[0].querySelector('.event-button-time');
    firstElementTime.innerHTML = formatTime(startTime.hours, startTime.minutes);

    // Select last event element and update end time
    const lastElementTime = matchingIdElements[matchingIdElements.length -1].querySelector('.event-button-time');
    lastElementTime.innerHTML = `ends ${formatTime(endTime.hours, endTime.minutes)}`;
  }

  // Update start time for single date events
  else {
    const firstElementTime = matchingIdElements[0].querySelector('.event-button-time');
    firstElementTime.innerHTML = formatTime(startTime.hours, startTime.minutes);
  }
}



// =============================================
//  Arrow Input Nagigation
// =============================================

// Allows user to navigate between inputs using the left and right arrow keys.

// Dataset value of either 'same-day' or 'different-day' is given based on whether the event startTime is on the same day as the endTime.
// This dataset value is given preemptively ensure the correct behaviour when incrementing / decrementing time.

// Circular navigation is added for when the end is reached, and it returns to either the first or last input, depending on direction.
// Highlight class is added to the focused input.

function navigateInputs(e, inputElement, parentContainer, allInputElements, userEventObject) {
  // Select first and last input from parent container
  const firstInput = parentContainer.firstElementChild;
  const lastInput = parentContainer.lastElementChild;
  const previousInput = inputElement.previousElementSibling;
  const nextInput = inputElement.nextElementSibling

  // Select all time inputs from object and preemptively remove 'highlight' class
  allInputElements.forEach(inputElement => inputElement.classList.remove('highlight'));

  // Prevent default behavior to stop cursor movement
  e.preventDefault();

  // Handle left arrow key
  if (e.key === 'ArrowLeft') {
    // Check if previous input exists, if not, cycle around to last input
    if (previousInput !== null) {
      manageInput(previousInput);
    } else {
      manageInput(lastInput);
    }

  // Handle right arrow key
  } else if (e.key === 'ArrowRight') {
    // Check if next input exists, if not, cycle around to first input
    if (nextInput !== null) {
      manageInput(nextInput);
    } else {
      manageInput(firstInput);
    }
  }

  // Helper function to handle functions for each input
  function manageInput(targetInput) {
    targetInput.focus(); // Focus target input 
    targetInput.classList.add('highlight'); // Add highlight class

    // If time input, set initial dataset value based on difference (same-day / next-day)
    if (targetInput.classList.contains('time-input')) {
      setInitialDatasetValue(targetInput, userEventObject);
    }
  }
}



// =============================================
//  Handle Auto Complete
// =============================================

// Automatically formats single-digit hour and minute inputs to ensure correct time formatting.
// Waits for a 1s delay before auto-completing single-digit input values - e.g: if a '2' is entered, a '0' will be added before it.

function handleAutoComplete(inputElement) {
  // Clear previous timeout if still running
  clearTimeout(inputElement.autoCompleteTimeout);

  if (inputElement.classList.contains('hour-input')) {
    // Set a new timeout for the completeDates function (timeout allows pause to complete double digit numbers before auto-complete)
    inputElement.autoCompleteTimeout = setTimeout(() => autoCompleteNumbers('0', '2'), 1000);

    // Automatically add '0' to numbers three to nine
    autoCompleteNumbers('3', '9');

  } else if (inputElement.classList.contains('minute-input')) {
    // Set a new timeout for the completeDates function (timeout allows pause to complete double digit numbers befire auto-complete)
    inputElement.autoCompleteTimeout = setTimeout(() => autoCompleteNumbers('0', '5'), 1000);

    // Automatically add '0' to numbers six to nine
    autoCompleteNumbers('6', '9');
  }

  // Add '0' before numbers that would exceed limits if they became a double digit number
  function autoCompleteNumbers(startNum, endNum) {
    let value = inputElement.value;

    // If the input value length is one character, and the number is equal to or between startNum & endNum, add '0' before
    if (value.length === 1 && (value[0] >= startNum && value[0] <= endNum)) {
      value = '0' + value;
      inputElement.value = value;
    }
  }
}


// Prevent adding numbers over 23 to hour inputs.
// Once '2' is typed on the keyboard, any keys from the blockedKeys array can not be entered.

function preventExceedingTotalHours(inputElement, e) {
  let value = inputElement.value;
  const blockedKeys = ['4', '5', '6', '7', '8', '9'];

  // Prevent adding numbers 4-9 after number '2' to prevent incorrect hour values
  if (value.length > 0 && value[0] === '2' && blockedKeys.includes(e.key)) {
    e.preventDefault();
  }
}



export { navigateInputs }