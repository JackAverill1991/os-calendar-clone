import { setSummaryDateString } from "../handleEventObjectValues.js";
import { removeArrowElement } from "../../event-details-element/arrowElementFunctions.js";
import { updateSearchResults } from "../../../search-form/searchbarFunctionality.js";
import {
  handleDateValues,
  highlightMatchingDate,
  updateAllInputValues
} from "./sharedDateChangeFunctions.js";



// =============================================
//  Add Widget Calendar Click Events
// =============================================

// Handles click events and date changes on details element widget calendars.

function addWidgetCalendarClickEvents(eventElementsObject, userEventObject, widgetCalendarElements) {
  const { classElement, calendarEventDetails, dateTimeSummary, dateTimeDetails, widgetCalendarClasses } = eventElementsObject;
  const { dateString, dateStringInputs, calendarContainer } = widgetCalendarElements;

  // Date details elements
  const dateTimeContainer = calendarEventDetails.querySelector('.date-and-time-details-container');
  const summaryDateString = calendarEventDetails.querySelector('.summary-date-string');

  // Select all input elements (both startDate and endDate) for access when updating values
  const allDateInputElements = dateTimeDetails.querySelectorAll('.date-string-input');

  // Combine necessary variables into new object to avoid mutating original
  const eventDetailsElements = {
    calendarEventDetails,
    dateString,
    dateStringInputs,
    allDateInputElements,
    calendarContainer,
    dateTimeContainer,
    dateTimeSummary,
    dateTimeDetails,
    summaryDateString,
    widgetCalendarClasses,
    classElement,
  }

  // Add event listeners
  attachEventListeners(eventDetailsElements, userEventObject);
}



// =============================================
//  Attach Event Listeners
// =============================================

// Attaches click event listeners on selected elements to handle open / close of widget calendars and event date changes.

function attachEventListeners(eventDetailsElements, userEventObject) {
  const { dateString, calendarContainer, calendarEventDetails } = eventDetailsElements;

  // Open relevent calendar for dateString when clicked, and pass in dates from userEventObject
  dateString.addEventListener('click', (e) => {
    handleDateStringClick(e, eventDetailsElements, userEventObject);
  });

  // Delegate date element event listener to calendar container to allow dynamic content
  calendarContainer.addEventListener('click', (e) => {
    // Add click functionality to date element buttons
    handleDateElementClick(e, eventDetailsElements, userEventObject);

    // Find and highlight date button that matches startDate / endDate object
    if (e.target.closest('.widget-button')) {
      highlightMatchingDate(calendarContainer, userEventObject);
    }
    // Prevents handleInsideClick and handleOutsideClick functions from affecting calendarContainer
    e.stopPropagation();
  });

  // Close calendar and remove classes if user clicks inside calendarEventDetails element
  calendarEventDetails.addEventListener('click', (e) => {
    handleDetailsElementClick(e, userEventObject, eventDetailsElements);
  });

  // Close calendar and remove classes if user clicks outide calendarEventDetails element
  handleWindowClick(eventDetailsElements, userEventObject);
}



// =============================================
//  Handle Date String Click
// =============================================

// Open widget calendar for whichever dateString clicked, and pass in date values in from userEventObject.
// Add click functionality to calendar date buttons that updates the dateStrings / widget calendar.
// Highlight clicked button.

function handleDateStringClick(e, eventDetailsElements, userEventObject) {
  // Destructure variables from objects
  const { dates: { startDate, endDate } } = userEventObject;
  const { dateString, dateStringInputs, calendarContainer, widgetCalendarClasses } = eventDetailsElements;
  const { startDateWidgetCalendar, endDateWidgetCalendar } = widgetCalendarClasses;

  // Clear both dateString / calendar classes (Prevents both being opened at once)
  clearClasses(dateString);

  // Open clicked calendar
  showCalendars(e, dateStringInputs);

  // Pass event object dates into calendars
  startDateWidgetCalendar.setClassDate(startDate.year, startDate.month, startDate.date);
  endDateWidgetCalendar.setClassDate(endDate.year, endDate.month, endDate.date);

  // Highlight date button that matches startDate / endDate object
  highlightMatchingDate(calendarContainer, userEventObject);
}


// Clears both calendars prior to open, preventing both being opened at the same time.

function clearClasses(dateStringElement) {
  // Select furthest common ancestor
  const dateAndTime = dateStringElement.closest('.date-and-time-details-container');

  // Use ancestor to select both dateStrings and both calendars
  const startAndEndDateString = dateAndTime.querySelectorAll('.start-date-string, .end-date-string');
  const startAndEndDateCalendars = dateAndTime.querySelectorAll('.start-date-calendar-container, .end-date-calendar-container');

  // Remove highlight and show classes from elements when dateString inputs are clicked, avoiding both being opened at once
  startAndEndDateString.forEach(dateString => dateString.classList.remove('highlight', 'show-reverse-highlight'));
  startAndEndDateCalendars.forEach(dateCalendar => dateCalendar.classList.remove('show', 'show-reverse'));

  // Make an array from dateString inputs and remove highlight class
  startAndEndDateString.forEach(dateString => {
    const childElements = Array.from(dateString.children);
    childElements.forEach(element => element.classList.remove('highlight'));
  });
}


// Shows corresponding widget calendar for whichever date string input is clicked.
// Calculates whether calendar overflows viewport and reverses open direction if necessary.

function showCalendars(e, dateStringInputs) {
  // Show widget calendar when any date string element is clicked
  const widgetCalendar = e.currentTarget.nextElementSibling;
  const clickedDateString = e.currentTarget;
  const clickedInput = e.target;
  
  // Open downwards unless calendar overflows viewport
  setTimeout(() => setOpenDirection(widgetCalendar), 10);

  // Remove red highlight from all inputs
  dateStringInputs.forEach(item => item.classList.remove('highlight'));

  // Add red highlight class to clicked input
  clickedInput.classList.add('highlight');

  function setOpenDirection(widgetCalendar) {
    const calendarRect = widgetCalendar.getBoundingClientRect();
    const windowBottomBoundary = window.innerHeight;
  
    // Check if calendar overflows viewport
    if (calendarRect.bottom > windowBottomBoundary) {
      widgetCalendar.classList.add('show-reverse');
      clickedDateString.classList.add('show-reverse-highlight'); // Add highlight class to dateString
    } else {
      widgetCalendar.classList.add('show');
      clickedDateString.classList.add('highlight');
    }
  }
}



// =============================================
//  Handle Date Button Click
// =============================================

// Attach event listener to calendar container, and check for click events on widget calendar date buttons.
// Exract data attributes (year, month, date) from the button clicked and pass into widget calendar class.
// This updates the calendar display if clicked month is different from current month, and buttons are replaced (the click event on the container remains).
// Data attributes are used to select the button that was initially clicked after refresh, and it is passed to handleDateValues() and highlightMatchingDate().

function handleDateElementClick(e, eventDetailsElements, userEventObject) {
  const { calendarEventDetails, calendarContainer, widgetCalendarClasses } = eventDetailsElements;
  const { startDateWidgetCalendar, endDateWidgetCalendar } = widgetCalendarClasses;

  // Check if a calendar date button was clicked
  const dateButton = e.target.closest('.widget-date-element');

  // Exit if no date button was clicked
  if (!dateButton) return;

  if (calendarEventDetails.dataset.dateChanged !== 'true') {
    // Remove arrow when date changes
    removeArrowElement(calendarEventDetails);
  }

  // Create object of data attributes from clicked date button
  const { dataYear, dataMonth, dataDate, dateDataAttributes } = createDateDataAttributes(dateButton);

  // Update calendars with the new selected date
  startDateWidgetCalendar.setClassDate(dataYear, dataMonth, dataDate);
  endDateWidgetCalendar.setClassDate(dataYear, dataMonth, dataDate);

  // Re-query the date button after the calendar has been updated
  const updatedDateButton = calendarContainer.querySelector(`[data-year="${dataYear}"][data-month="${dataMonth}"][data-date="${dataDate}"]`);

  // Apply the date values to the relevant elements
  handleDateValues(updatedDateButton, dateDataAttributes, eventDetailsElements, userEventObject);

  // Update search results element results if it is open
  updateSearchResults();

  // Highlight clicked date button
  updatedDateButton.classList.add('highlight');
}


function createDateDataAttributes(dateButton) {
  const dataYear = Number(dateButton.dataset.year);
  const dataMonth = Number(dateButton.dataset.month);
  const dataDate = Number(dateButton.dataset.date);

  // Create object of data attributes from clicked date button
  const dateDataAttributes = { dataYear, dataMonth, dataDate };

  return {
    dataYear,
    dataMonth,
    dataDate,
    dateDataAttributes
  }
}



// ===============================================
//  Handle Window Click (Calendar Event Details)
// ===============================================

// If user clicks outside of calendar details element, 'highlight' class is removed from dateString / dateStringInputs.
// Widget calendars are hidden and inputs left blank are given values from startDate / endDate objects.
// Date and time details window is closed and summary is shown instead.

function handleWindowClick(eventDetailsElements, userEventObject) {  
  // Set up event listener functionality for window click
  window.addEventListener('click', windowClickHandler);
  window.addEventListener('keydown', handleEnterKeyPress);

  function windowClickHandler(e) {
    if (!e.target.closest('.calendar-event-details')) {
      hideCalendars(eventDetailsElements);
      fillBlankInputs(eventDetailsElements, userEventObject);

      // Remove both event listeners once one is used
      window.removeEventListener('click', windowClickHandler);
      window.removeEventListener('keydown', handleEnterKeyPress);
    }
  }

  function handleEnterKeyPress(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      hideCalendars(eventDetailsElements);
      fillBlankInputs(eventDetailsElements, userEventObject);

      // Remove both event listeners once one is used
      window.removeEventListener('click', windowClickHandler);
      window.removeEventListener('keydown', handleEnterKeyPress);
    }
  }
}


// Carries out the same functions as the window click when the user clicks outside the date and time details container.
// A separate close function is used to avoid the delay used for the window click version.

function handleDetailsElementClick(e, userEventObject, eventDetailsElements) {
  // Only run if click event takes place outside date strings
  if (!e.target.closest('.start-date-string') && !e.target.closest('.end-date-string')) {
    hideCalendars(eventDetailsElements);
    fillBlankInputs(eventDetailsElements, userEventObject);
    closeDateTimeDetails(e, eventDetailsElements);
    setSummaryDateString(eventDetailsElements, userEventObject)
  }
}


// If inputs are left blank, replace with values from startDate / endDate objects.
// Also works for hour / minute time inputs.

function fillBlankInputs(eventDetailsElements, userEventObject) {
  const { calendarContainer } = eventDetailsElements;

  const allInputs = calendarContainer.closest('.date-and-time-details').querySelectorAll('input');
  allInputs.forEach(inputElement => {
    if (inputElement.value === '') {
      updateAllInputValues(allInputs, userEventObject);
    }
  });
}


// Hides widget calendars when user clicks anywhere else in details element / window.
// Removes white highlights from date string abd red highlights from inputs.

function hideCalendars(eventDetailsElements) {
  const { calendarContainer, dateString, dateStringInputs } = eventDetailsElements;

  if (calendarContainer.classList.contains('show') || calendarContainer.classList.contains('show-reverse')) {
    // Remove display classes from widget calendars and date strings
    calendarContainer.classList.remove('show', 'show-reverse');
    dateString.classList.remove('highlight', 'show-reverse-highlight');

     // Remove date input classes
    dateStringInputs.forEach(dateStringElement => {
      dateStringElement.classList.remove('highlight');
    });
  }
}


// Date / time details is closed when user clicks anyhere else in the main details element.
// Excludes category menu and delete button.

function closeDateTimeDetails(e, eventDetailsElements) {
  const { dateTimeContainer, dateTimeSummary, dateTimeDetails } = eventDetailsElements;
  if (
    !dateTimeContainer.contains(e.target) &&
    !e.target.closest('.category-menu-button') &&
    !e.target.closest('.delete-event-button')
  ) {
    dateTimeDetails.classList.remove('show');
    dateTimeSummary.classList.add('show');
  }
}



export {
  addWidgetCalendarClickEvents
}