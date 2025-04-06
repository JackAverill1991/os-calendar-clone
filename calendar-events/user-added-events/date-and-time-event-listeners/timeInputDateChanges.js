import { getDatesBetween } from "./sharedDateChangeFunctions.js";
import { dynamicallyUpdateEventDates } from "../dynamicallyUpdateEventDates.js";
import { monthEventPositioning } from "../../monthEventPositioning.js";
import { updateSearchResults } from "../../../search-form/searchbarFunctionality.js";
import { removeArrowElement } from "../../event-details-element/arrowElementFunctions.js";
import { getDayCountOfMonth, getDayCountOfPreviousMonth } from "../../../utils.js";


// =============================================
//  Manage Date Object Changes
// =============================================

// Calculate initial dataset value for hour input based on time comparison between startTime and endTime in arrowDateTimeHandling() and numberDateTimeHandling().

function setInitialDatasetValue(inputElement, userEventObject) {
  const { dates: { startDate, endDate } } = userEventObject;

  // Set dataset to 'different-day' if start / end dates don't match
  if (startDate.date !== endDate.date) {
    inputElement.dataset.startEndTimeCheck = 'different-day';
  }
  // Set dataset to 'same-day' if start / end dates match
  else if (startDate.date === endDate.date) {
    inputElement.dataset.startEndTimeCheck = 'same-day';
  }
}



// =============================================
//  Number Time / Date Handling
// =============================================

// Handle end date increments when end time is set as a lower value than start time.
// E.g. if start time is 9am and the end time is set to 8am, the end time becomes that time the next day and the event becomes two days long.

function numberDateTimeHandling(inputElement, userEventObject, elementsObject) {
  // Destructure start / end times and dates from userEventObject
  const { time: { startTime, endTime }, dates: { endDate } } = userEventObject;

  // Save input element dataset value as variable for conditional checks later
  let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

  if (inputElement.classList.contains('end-time')) {
    if (endTime.hours < startTime.hours && endTime.hours >= 0 && startEndTimeCheck === 'same-day') {
      // Handle end date increment
      incrementDate(endDate);

      // Update dates array in the user event object and call dynamicallyUpdateEventDates()
      updateInterface(elementsObject, userEventObject);

      // Set the dataset flag to 'next-day'
      inputElement.dataset.startEndTimeCheck = 'different-day';
    }
  }
}



// =============================================
//  Arrow Time / Date Handling
// =============================================

// Handle date increments and decrements when using arrow keys to increase or decrease the hours / minutes with the time inputs.

function arrowDateTimeHandling(e, inputElement, userEventObject, elementsObject) {
  if (inputElement.classList.contains('start-time')) {
    // Handle ArrowUp key press
    if (e.key === 'ArrowUp') {
      increaseStartTime(inputElement, elementsObject, userEventObject);
    }
    // Handle ArrowDown key press
    else if (e.key === 'ArrowDown') {
      decreaseStartTime(inputElement, elementsObject, userEventObject);
    }
  }

  else if (inputElement.classList.contains('end-time')) {
    // Handle ArrowUp key press
    if (e.key === 'ArrowUp') {
      increaseEndTime(inputElement, elementsObject, userEventObject);
    }
    // Handle ArrowDown key press
    else if (e.key === 'ArrowDown') {
      decreaseEndTime(inputElement, elementsObject, userEventObject);
    }
  }
}



// =============================================
//  Increase / Decrease Start & End Times
// =============================================

// 'startEndTimeCheck' keeps track of whether startTime and endTime are on the same or different dates.
// Checks whether increments or decrements to the hours and minutes requires a date change.

function increaseStartTime(inputElement, elementsObject, userEventObject) {
  const { time: { startTime, endTime }, dates: { startDate, endDate } } = userEventObject;
  let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

  // Check whether time changes require a date change
  const startTimeDateChange = checkDateChange(inputElement, startTime, 'increment');
  const endTimeDateChange = checkDateChange(inputElement, endTime, 'increment');

  // Pass startTimeDateChange as conditional and apply to whichever input used (hour or minute)
  if (startTimeDateChange.hourDateChange || startTimeDateChange.minuteDateChange) {
    handleDateChange('increment', startDate, elementsObject, userEventObject);

    // Add dataset value to signal that start / end times are the same day
    if (startEndTimeCheck === 'different-day') {
      inputElement.dataset.startEndTimeCheck = 'same-day';
    }
  }
  // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
  if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
    handleDateChange('increment', endDate, elementsObject, userEventObject);

    // Add dataset value to signal that start / end times are different days
    if (startEndTimeCheck === 'same-day') {
      inputElement.dataset.startEndTimeCheck = 'different-day';   
    } 
  }
}


function decreaseStartTime(inputElement, elementsObject, userEventObject) {
  const { time: { startTime, endTime }, dates: { startDate, endDate } } = userEventObject;
  let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

  // Check whether time changes require a date change
  const startTimeDateChange = checkDateChange(inputElement, startTime, 'decrement');
  const endTimeDateChange = checkDateChange(inputElement, endTime, 'decrement');

  // Pass startTimeDateChange as conditional and apply to whichever input used (hour or minute)
  if (startTimeDateChange.hourDateChange || startTimeDateChange.minuteDateChange) {
    handleDateChange('decrement', startDate, elementsObject, userEventObject);
    
    // Add dataset value to signal that start / end times are different days
    if (startEndTimeCheck === 'same-day') {
      inputElement.dataset.startEndTimeCheck = 'different-day';
    }
  }
  // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
  if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
    handleDateChange('decrement', endDate, elementsObject, userEventObject);

    // Add dataset value to signal that start / end times are the same day
    if (startEndTimeCheck === 'different-day') {
      inputElement.dataset.startEndTimeCheck = 'same-day';
    }
  }
}


function increaseEndTime(inputElement, elementsObject, userEventObject) {
  const { time: { endTime }, dates: { endDate } } = userEventObject;
  let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

  // Check whether time changes require a date change
  const endTimeDateChange = checkDateChange(inputElement, endTime, 'increment');

  // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
  if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
    handleDateChange('increment', endDate, elementsObject, userEventObject);

    // Add dataset value to signal that start / end times are different days
    if (startEndTimeCheck === 'same-day') {
      inputElement.dataset.startEndTimeCheck = 'different-day';
    }
  }
}


// Last conditional prevents endTime from being set earlier than the start time by incrementing the endDate.
// endTime is moved to the following date as it becomes a two day event.

function decreaseEndTime(inputElement, elementsObject, userEventObject) {
  const { time: { startTime, endTime }, dates: { startDate, endDate } } = userEventObject;
  let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

  // Check whether time changes require a date change
  const endTimeDateChange = checkDateChange(inputElement, endTime, 'decrement');

  // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
  if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
    handleDateChange('decrement', endDate, elementsObject, userEventObject);

    // Add dataset value to signal that start / end times are the same day
    if (endDate.date === startDate.date) {
      inputElement.dataset.startEndTimeCheck = 'same-day';
    }
  }
  // Prevent endTime from being set earlier than the start time
  if (startEndTimeCheck === 'same-day' && endTime.hours < startTime.hours) {
    handleDateChange('increment', endDate, elementsObject, userEventObject);

    // Add dataset value to signal that start / end times are different days
    inputElement.dataset.startEndTimeCheck = 'different-day';
  }
}



// ================================================
//  Check Date Change
// ================================================

// Returns conditional checks as variables to be passed into 'if' statement when hour / minute inputs are used.
// If the checks return true, the calendar updates the date objects with 'incrementDate' & 'decrementDate'.

function checkDateChange(inputElement, timeObject, action) {
  // Check whether input being used is for hours or minutes
  const hourInput = inputElement.matches('.hour-input');
  const minuteInput = inputElement.matches('.minute-input');

  // Save conditional checks as variables to be passed into 'if' statement
  let hourDateChange;
  let minuteDateChange;

  // Calculate conditional checks for whether a date change is necessary
  if (action === 'increment') {
    hourDateChange = (
        (hourInput && timeObject.hours === 1 && timeObject.minutes === 0) ||
        (hourInput && timeObject.hours === 0 && timeObject.minutes >= 1)
    );
    minuteDateChange = (minuteInput && timeObject.hours === 0 && timeObject.minutes === 1);
  } else if (action === 'decrement') {
      hourDateChange = (
          (hourInput && timeObject.hours === 0 && timeObject.minutes === 0) ||
          (hourInput && timeObject.hours === 23 && timeObject.minutes >= 1)
      );
      minuteDateChange = (minuteInput && timeObject.hours === 0 && timeObject.minutes === 0);
  }

  return { hourDateChange, minuteDateChange }
}



// ================================================
//  Handle Date Change
// ================================================

// Handle date increment / decrement and update all visual updates that take place as a result.

function handleDateChange(action, dateObject, elementsObject, userEventObject) {
  // Increment or decrement date
  if (action === 'increment') {
      incrementDate(dateObject);
  } else if (action === 'decrement') {
      decrementDate(dateObject);
  }

  // Update UI
  updateInterface(elementsObject, userEventObject);
}



// ================================================
//  / Increment & Decrement Date
// ================================================

// Ensure accurate date updates when incrementing / decrementing dates.
function incrementDate(dateObject) {
  const monthDayCount = getDayCountOfMonth(dateObject.year, dateObject.month);

  if (dateObject.date + 1 > monthDayCount) {
    dateObject.date = 1;
    if (dateObject.month === 12) {
      dateObject.month = 1;
      dateObject.year ++;
    } else {
      dateObject.month ++;
    }
  } else {
    dateObject.date += 1;
  }
}

function decrementDate(dateObject) {
  const prevMonthDayCount = getDayCountOfPreviousMonth(dateObject.year, dateObject.month);

  if (dateObject.date - 1 === 0) {
    dateObject.date = prevMonthDayCount;
    if (dateObject.month === 1) {
      dateObject.month = 12;
      dateObject.year --
    } else {
      dateObject.month --
    }
  } else {
    dateObject.date -= 1;
  }
}



// =============================================
//  Update Interface
// =============================================

// Handles all visual updates that take place when a date change happens.

function updateInterface(elementsObject, userEventObject) {
  const { calendarEventDetails, classElement } = elementsObject;
  const { dates: { startDate, endDate } } = userEventObject;

  // Get array of all dates spanning from the startDate to the endDate and add to userEventObject
  const betweenDates = getDatesBetween(startDate, endDate);
  userEventObject.dates.datesArray = betweenDates;

  if (calendarEventDetails.dataset.dateChanged !== 'true') {
    // Remove arrow when date changes
    removeArrowElement(calendarEventDetails);
  }

  // Created an updated array of event elements and append to correct date elements when widget date button is clicked
  dynamicallyUpdateEventDates(userEventObject, elementsObject);

  // Organize events according to length and position in a grid format in month calendar view
  monthEventPositioning(classElement, null);

  // Update search results element results if it is open
  updateSearchResults();
}



export {
  setInitialDatasetValue,
  numberDateTimeHandling,
  arrowDateTimeHandling
}

















// import { getDatesBetween } from "./sharedDateChangeFunctions.js";
// import { dynamicallyUpdateEventDates } from "../user-calendar-events/dynamicallyUpdateEventDates.js";
// import { monthEventPositioning } from "../user-calendar-events/monthEventPositioning.js";
// import { updateSearchResults } from "../search-form/searchbarFunctionality.js";
// import { removeArrowElement } from "../user-calendar-events/event-details-element/arrowElementFunctions.js";
// import { getDayCountOfMonth, getDayCountOfPreviousMonth } from "../utils.js";


// // =============================================
// //  Manage Date Object Changes
// // =============================================

// // Calculate initial dataset value for hour input based on time comparison between startTime and endTime in arrowDateTimeHandling() and numberDateTimeHandling()

// function setInitialDatasetValue(inputElement, userEventObject) {
//   const { dates: { startDate, endDate } } = userEventObject;

//   // Set dataset to 'different-day' if start / end dates don't match
//   if (startDate.date !== endDate.date) {
//     inputElement.dataset.startEndTimeCheck = 'different-day';
//   }
//   // Set dataset to 'same-day' if start / end dates match
//   else if (startDate.date === endDate.date) {
//     inputElement.dataset.startEndTimeCheck = 'same-day';
//   }
// }



// // =============================================
// //  Number Time / Date Handling
// // =============================================

// // Handle end date increments when end time is set as a lower value than start time
// // E.g. if start time is 9am and the end time is set to 8am, the end time becomes that time the next day and the event becomes two days long

// function numberDateTimeHandling(inputElement, userEventObject, elementsObject) {
//   // Destructure start / end times and dates from userEventObject
//   const { time: { startTime, endTime }, dates: { endDate } } = userEventObject;

//   // Save input element dataset value as variable for conditional checks later
//   let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

//   if (inputElement.classList.contains('end-time')) {
//     console.log(startEndTimeCheck);

//     if (endTime.hours < startTime.hours && endTime.hours >= 0 && startEndTimeCheck === 'same-day') {
//       // Handle end date increment
//       incrementDate(endDate);

//       // Update dates array in the user event object and call dynamicallyUpdateEventDates()
//       updateInterface(elementsObject, userEventObject);

//       // Set the dataset flag to 'next-day'
//       inputElement.dataset.startEndTimeCheck = 'different-day';
//     }
//   }
// }



// // =============================================
// //  Arrow Time / Date Handling
// // =============================================

// // Handle date increments and decrements when using arrow keys to increase or decrease the hours / minutes with the time inputs

// function arrowDateTimeHandling(e, inputElement, userEventObject, elementsObject) {
//   // Save input element dataset flag as variable for conditional checks later
//   let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

//   if (inputElement.classList.contains('start-time')) {
//     // Handle ArrowUp key press
//     if (e.key === 'ArrowUp') {
//       increaseStartTime(inputElement, elementsObject, userEventObject);
//     }
//     // Handle ArrowDown key press
//     else if (e.key === 'ArrowDown') {
//       decreaseStartTime(inputElement, elementsObject, userEventObject);
//     }
//   }

//   else if (inputElement.classList.contains('end-time')) {
//     // Handle ArrowUp key press
//     if (e.key === 'ArrowUp') {
//       increaseEndTime(inputElement, elementsObject, userEventObject);
//     }
//     // Handle ArrowDown key press
//     else if (e.key === 'ArrowDown') {
//       decreaseEndTime(inputElement, elementsObject, userEventObject);
//     }
//   }
// }



// // =============================================
// //  Increase / Decrease Start & End Times
// // =============================================

// // Keeps track of whether startTime and endTime are on the same or different dates
// // Checks whether increments or decrements to the hours and minutes requires a date change

// function increaseStartTime(inputElement, elementsObject, userEventObject) {
//   // Destructure start / end times and dates from userEventObject
//   const { time: { startTime, endTime }, dates: { startDate, endDate } } = userEventObject;

//   // Save input element dataset flag as variable for conditional checks later
//   let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

//   // Check for '0' hours and '0' minutes when increasing time / '23' hours and '59' minutes when decreasing time
//   const startTimeDateChange = checkDateChange(inputElement, startTime, 'increment');
//   const endTimeDateChange = checkDateChange(inputElement, endTime, 'increment');

//   // Pass startTimeDateChange as conditional and apply to whichever input used (hour or minute)
//   if (startTimeDateChange.hourDateChange || startTimeDateChange.minuteDateChange) {
//     // Handle start date increment
//     incrementDate(startDate);

//     // Update UI
//     updateInterface(elementsObject, userEventObject);

//     // Add dataset value to signal that start / end times are the same day
//     if (startEndTimeCheck === 'different-day') inputElement.dataset.startEndTimeCheck = 'same-day';
//   }

//   // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
//   if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
//     // Handle end date increment
//     incrementDate(endDate);

//     // Update UI
//     updateInterface(elementsObject, userEventObject); 

//     // Add dataset value to signal that start / end times are different days
//     if (startEndTimeCheck === 'same-day') inputElement.dataset.startEndTimeCheck = 'different-day';    
//   }
// }


// function decreaseStartTime(inputElement, elementsObject, userEventObject) {
//   // Destructure start / end times and dates from userEventObject
//   const { time: { startTime, endTime }, dates: { startDate, endDate } } = userEventObject;

//   // Save input element dataset flag as variable for conditional checks later
//   let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

//   // Check for '0' hours and '0' minutes when increasing time / '23' hours and '59' minutes when decreasing time
//   const startTimeDateChange = checkDateChange(inputElement, startTime, 'decrement');
//   const endTimeDateChange = checkDateChange(inputElement, endTime, 'decrement');
  
//   // Pass startTimeDateChange as conditional and apply to whichever input used (hour or minute)
//   if (startTimeDateChange.hourDateChange || startTimeDateChange.minuteDateChange) {
//     // Handle end date decrement
//     decrementDate(startDate);

//     // Update UI
//     updateInterface(elementsObject, userEventObject);

//     // Add dataset value to signal that start / end times are different days
//     if (startEndTimeCheck === 'same-day') inputElement.dataset.startEndTimeCheck = 'different-day';
//   }

//   // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
//   if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
//     // Handle end date decrement
//     decrementDate(endDate);

//     // Update UI
//     updateInterface(elementsObject, userEventObject);

//     // Add dataset value to signal that start / end times are the same day
//     if (startEndTimeCheck === 'different-day') inputElement.dataset.startEndTimeCheck = 'same-day';    
//   }
// }


// function increaseEndTime(inputElement, elementsObject, userEventObject) {
//   // Destructure start / end times and dates from userEventObject
//   const { time: { endTime }, dates: { endDate } } = userEventObject;

//   // Save input element dataset flag as variable for conditional checks later
//   let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

//   // Check for '0' hours and '0' minutes when increasing time
//   const endTimeDateChange = checkDateChange(inputElement, endTime, 'increment');

//   // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
//   if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
//     // Handle end date increment
//     incrementDate(endDate);

//     // Update UI
//     updateInterface(elementsObject, userEventObject);

//     // Add dataset value to signal that start / end times are different days
//     if (startEndTimeCheck === 'same-day') inputElement.dataset.startEndTimeCheck = 'different-day';
//   }
// }


// function decreaseEndTime(inputElement, elementsObject, userEventObject) {
//   // Destructure start / end times and dates from userEventObject
//   const { time: { startTime, endTime }, dates: { startDate, endDate } } = userEventObject;

//   // Save input element dataset flag as variable for conditional checks later
//   let startEndTimeCheck = inputElement.dataset.startEndTimeCheck;

//   // Check for '23' hours and '59' minutes when decreasing time
//   const endTimeDateChange = checkDateChange(inputElement, endTime, 'decrement');

//   // Pass endTimeDateChange as conditional and apply to whichever input used (hour or minute)
//   if (endTimeDateChange.hourDateChange || endTimeDateChange.minuteDateChange) {
//     // Handle end date decrement
//     decrementDate(endDate);

//     // Update UI
//     updateInterface(elementsObject, userEventObject);

//     // Add dataset value to signal that start / end times are the same day
//     if (endDate.date === startDate.date) inputElement.dataset.startEndTimeCheck = 'same-day';
//   } 
  
//   // Increment endDate when endTime is set earlier than the start time
//   if (startEndTimeCheck === 'same-day' && endTime.hours < startTime.hours) {
//     // Handle end date increment
//     incrementDate(endDate);

//     // Update UI
//     updateInterface(elementsObject, userEventObject);

//     // Add dataset value to signal that start / end times are on different days
//     inputElement.dataset.startEndTimeCheck = 'different-day';
//   }
// }



// // ================================================
// //  Check Date Change / Increment & Decrement Date
// // ================================================

// // Returns conditional checks as variables to be passed into 'if' statement when hour / minute inputs are used
// // If the checks return true, the calendar updates the date objects with 'incrementDate' & 'decrementDate'

// function checkDateChange(inputElement, timeObject, direction) {
//   // Check whether input being used is for hours or minutes
//   const hourInput = inputElement.matches('.hour-input');
//   const minuteInput = inputElement.matches('.minute-input');

//   // Save conditional checks as variables to be passed into 'if' statement
//   let hourDateChange;
//   let minuteDateChange;

//   // Calculate conditional checks for whether a date change is necessary
//   if (direction === 'increment') {
//     hourDateChange = (
//         (hourInput && timeObject.hours === 1 && timeObject.minutes === 0) ||
//         (hourInput && timeObject.hours === 0 && timeObject.minutes >= 1)
//     );
//     minuteDateChange = (minuteInput && timeObject.hours === 0 && timeObject.minutes === 1);
//   } else if (direction === 'decrement') {
//       hourDateChange = (
//           (hourInput && timeObject.hours === 0 && timeObject.minutes === 0) ||
//           (hourInput && timeObject.hours === 23 && timeObject.minutes >= 1)
//       );
//       minuteDateChange = (minuteInput && timeObject.hours === 0 && timeObject.minutes === 0);
//   }

//   return { hourDateChange, minuteDateChange }
// }


// // Ensure accurate date updates when incrementing / decrementing dates
// function incrementDate(dateObject) {
//   const monthDayCount = getDayCountOfMonth(dateObject.year, dateObject.month);

//   if (dateObject.date + 1 > monthDayCount) {
//     dateObject.date = 1;
//     if (dateObject.month === 12) {
//       dateObject.month = 1;
//       dateObject.year ++;
//     } else {
//       dateObject.month ++;
//     }
//   } else {
//     dateObject.date += 1;
//   }
// }

// function decrementDate(dateObject) {
//   const prevMonthDayCount = getDayCountOfPreviousMonth(dateObject.year, dateObject.month);

//   if (dateObject.date - 1 === 0) {
//     dateObject.date = prevMonthDayCount;
//     if (dateObject.month === 1) {
//       dateObject.month = 12;
//       dateObject.year --
//     } else {
//       dateObject.month --
//     }
//   } else {
//     dateObject.date -= 1;
//   }
// }



// // =============================================
// //  Update Interface
// // =============================================

// // Handles all visual updates that take place when a date change happens

// function updateInterface(elementsObject, userEventObject) {
//   const { calendarEventDetails, classElement } = elementsObject;
//   const { dates: { startDate, endDate } } = userEventObject;

//   // Get array of all dates spanning from the startDate to the endDate and add to userEventObject
//   const betweenDates = getDatesBetween(startDate, endDate);
//   userEventObject.dates.datesArray = betweenDates;

//   if (calendarEventDetails.dataset.dateChanged !== 'true') {
//     // Remove arrow when date changes
//     removeArrowElement(calendarEventDetails);
//   }

//   // Created an updated array of event elements and append to correct date elements when widget date button is clicked
//   dynamicallyUpdateEventDates(userEventObject, elementsObject);

//   // Organize events according to length and position in a grid format in month calendar view
//   monthEventPositioning(classElement, null);

//   // Update search results element results if it is open
//   updateSearchResults();
// }



// export {
//   setInitialDatasetValue,
//   numberDateTimeHandling,
//   arrowDateTimeHandling
// }