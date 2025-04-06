import { globalDate } from "../index.js";
import { createEventDetailsElement } from "../calendar-events/user-added-events/addNewCalendarEvent.js";
import { findMatchingEvents, highlightEventButtons } from "./searchbarFunctionality.js";
import { callEventDetailsFunctions, processEventByDateRange } from "../calendar-events/user-added-events/editCalendarEvents.js";
import { handleEventObjectValues } from "../calendar-events/user-added-events/handleEventObjectValues.js";
import { showMonthCalendar } from "../calendar-classes/loadAndDisplayClasses.js";



// ===============================================
//  Add Event Element Click Functionality
// ===============================================

// Add single and double click listeners to the search results container.
// Double click listener is executed once, after which the 'handleSearchElementDblClick()' function is re-attached (see sharedWindowListeners.js).
// Re-attaching the event listener allows the opening delay time / behaviour to be manipulated based on whether there is already a details element open.

function handleEventListeners(searchEventElementsArray, userEventObjectSet, searchResults) {
  // Take an initial capture of the globalDate object and attach to searchResults window
  searchResults.globalDateCapture = {
    month: globalDate.month,
    year: globalDate.year
  }

  searchEventElementsArray.forEach(element => {
    // Handle search event element click functions
    element.addEventListener('click', () => {
      searchEventElementClick(element, searchEventElementsArray, userEventObjectSet);
    });
  });

  const handleDblClick = (e) => {
    // Exit if user clicks anything other than a search menu event element
    if (!e.target.closest('.search-event-element')) return;

    // Save click event to variable
    const searchEventElement = e.target;

    // Calculate open delay time for event details element
    const delayTime = calculateDelayTime(searchEventElement, searchResults.globalDateCapture);

    // Update globalDateCapture object on the searchResults window after a short delay
    updateGlobalDateCapture(searchResults);

    // Open calendar event details element for clicked search event element
    setTimeout(() => handleSearchElementDblClick(e, searchResults), delayTime);

    // Remove the listener after the first execution
    searchResults.removeEventListener('dblclick', handleDblClick);
  }

  // Check if the listener is already present
  if (!searchResults.hasDblClickSearchListener) {
    searchResults.addEventListener('dblclick', handleDblClick);
    searchResults.hasDblClickSearchListener = true; // Mark the element as having a listener
  }
}



// ===============================================
//  Handle Search Event Element Single Click
// ===============================================

// If the event element clicked is from a different month / year than the current calendar display, the display is updated to the date of the event.
// Highlights clicked event button and updates top header button menu to reflect the month calendar view.

function searchEventElementClick(element, searchEventElements, userEventObjectSet) {
  // Call fresh instance of class element
  const classElement = document.querySelector('.calendar-class-content').firstChild;

  // Check if clicked event is from the same month & year as the current calendar view
  const isSameMonth = checkIfSameMonth(element, globalDate);

  // Check if the calendar view is set to month and clicked event is the same month / year
  if (!isSameMonth || classElement.dataset.calendar !== 'month') {
    callMonthCalendarClass(element, userEventObjectSet);
  }

  // Highlight clicked event element in search results
  highlightEventElement(element, searchEventElements);

  // Highlight the month button in the header to reflect the calendar class change
  selectMonthButton();
}


// Clear 'highlight' class from all buttons and add to clicked button
function highlightEventElement(element, searchEventElements) {
  searchEventElements.forEach(element => {
    element.classList.remove('highlight');
  });
  element.classList.add('highlight');
}


function callMonthCalendarClass(element, userEventObjectSet) {
  // Select parent date element and its data attributes
  const searchDateElement = element.closest('.search-date-element');

  // Update global date
  globalDate.year = parseInt(searchDateElement.dataset.year);
  globalDate.month = parseInt(searchDateElement.dataset.month);
  globalDate.date = parseInt(searchDateElement.dataset.date);

  // Set delay based on whether there is already a details element open
  const delay = window.elementAlreadyOpen ? 250 : 0;

  setTimeout(() => {
    showMonthCalendar(); // Call calendar class and pass in event dates
    highlightEventButtons(userEventObjectSet); // Ensure all event buttons are still highlighted
  }, delay); // Add delay value
}

// Highlight the month button in the header to reflect the calendar class change
function selectMonthButton() {
  const mainHeaderButtons = document.querySelectorAll('.main-header-button');
  mainHeaderButtons.forEach(button => {
    button.classList.remove('selected');
    if (button.matches('.month-button')) button.classList.add('selected');
  });
}



// ===============================================
//  Handle Search Event Element Double Click
// ===============================================

// When user clicks an event element in the search results menu, the matching event element is opened in the calendar and enable editing.
// Function is attached in an event listener on initial page load and re-attached when is used (see sharedWindowListeners.js).

function handleSearchElementDblClick(e, searchResults) {
  // Select search evemt element from click target and get eventId dataset
  const searchEventElement = e.target.closest('.search-event-element');
  if (!searchEventElement) return; // Exit if user clicks outside of search event element

  // Call fresh instance of class element
  const classElement = document.querySelector('.calendar-class-content').firstChild;

  // Retrieve event data
  const eventId = searchEventElement.dataset.eventId;
  const { calendarEventElement, matchingIdEventElements } = findMatchingEventElements(eventId, classElement);

  // Create event details element
  const calendarEventDetails = createEventDetailsElement();

  // Return dataset row number value from parent date element of first matching event element
  const targetCalendarRow = firstOccupiedRowNumber(matchingIdEventElements);

  // Reselect the search form and use its input value to get array of matching events from local storage
  const matchingUserEventObject = getMatchingUserEventObject(eventId);

  // Create elements object
  const eventElementsObject = createEventElementsObject(calendarEventElement, calendarEventDetails, searchResults, classElement);

  // Mark details element as open and double click listener as reattached
  updateDatasetFlags(searchResults);

  // Pull user event object details userEventObject
  handleEventObjectValues(eventElementsObject, matchingUserEventObject);

  // Call functions handling widget calendars, event object properties and window event listeners
  callEventDetailsFunctions(e, eventElementsObject, matchingUserEventObject);

  // Separate logic for single and multiple date events and determine where details element is placed
  processEventByDateRange(eventElementsObject, matchingIdEventElements, targetCalendarRow);
}


function findMatchingEventElements(eventId, classElement) {
  // Use dataset to find matching calendar event elements
  const matchingIdEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`);
  return {
    calendarEventElement: matchingIdEventElements[0],
    matchingIdEventElements
  };
}


// Return dataset row number value from parent date element of first matching event element
function firstOccupiedRowNumber(matchingIdEventElements) {
  const firstDateElement = matchingIdEventElements[0].closest('.date-element');
  return firstDateElement.dataset.rowNumber.toString();
}


// Group variables into object
function createEventElementsObject(calendarEventElement, calendarEventDetails, searchResults, classElement) {
  return {
    calendarEventElement,
    dateElement: calendarEventElement.closest('.date-element'),
    calendarEventDetails,
    deleteButton: calendarEventDetails.querySelector('.delete-event-button'),
    classElement,
    scrollContainer: classElement.querySelector('.month-dates-scroll-container'),
    positionTargetReference: calendarEventElement, // Used as fixed positioning reference for details element
    containerElement: searchResults, // The container where double click listeners are reattached
  };
}



// ===============================================
//  Update Window Event Element Dataset Flags
// ===============================================

// Update dataset flags used to determine window event listener behaviour when adding / editing events.

function updateDatasetFlags(searchResults) {
  window.elementAlreadyOpen = true; // Mark details element as being open
  requestAnimationFrame(() => searchResults.hasDblClickSearchListener = false); // Mark event listener as reattached
}



// ===============================================
//  Get Matching User Event Object
// ===============================================

function getMatchingUserEventObject(eventId) {
  // Reselect the search form and use its input value to get array of matching events from local storage
  const searchForm = document.querySelector('.search-form');
  const matchingEvents = findMatchingEvents(searchForm);

  // Find matching user event object from array
  return matchingEvents.find(object => object.eventId === eventId);
}



// =========================================================================
//  Calculate Details Element Open Delay Time / Update Global Date Capture
// =========================================================================

// calculateDelayTime calculates the delay time before the details element opens when an event element is double clicked.
// This time is based on whether there is already another details element open, or if the clicked event is from another month / year and the calendar display has to update.

// updateGlobalDateCapture function takes an updated capture of the globalDate object after a short delay once the calendar month has changed and attaches it to the searchResults window.
// The delay prevents the object updating immediately, otherwise the value would always consider the current calendar view date to be the same as the double clicked event element.

function calculateDelayTime(element, dateObject) {
  // Check if event element clicked is the same month / year as the snapshot taken from globalDate object
  const isSameMonth = checkIfSameMonth(element, dateObject);

  let delayTime; // Set conditional
  
  // Calculate delay time
  if (isSameMonth && !window.elementAlreadyOpen) {
    delayTime = 0;
  } else if (isSameMonth && window.elementAlreadyOpen) {
    delayTime = 150;
  } else if (!isSameMonth && !window.elementAlreadyOpen) {
    delayTime = 150;
  } else if (!isSameMonth && window.elementAlreadyOpen) {
    delayTime = 300;
  }

  return delayTime;
}

function updateGlobalDateCapture(containerElement) {
  setTimeout(() => {
    containerElement.globalDateCapture.month = globalDate.month;
    containerElement.globalDateCapture.year = globalDate.year;
  }, 150);
}



// ===============================================
//  Check If Same Month
// ===============================================

// Check if clicked event is from the same month & year as the current calendar view.
// Used to check if calendar month display needs to be changed.
// Takes dateObject argument, which is used for either the globalDate object or the 'capture' that is taken from it when the event element is double clicked.

function checkIfSameMonth(element, dateObject) {
  const dateElement = element.closest('.search-date-element');
  const eventMonth = parseInt(dateElement.dataset.month);
  const eventYear = parseInt(dateElement.dataset.year);
  return eventMonth === dateObject.month && eventYear === dateObject.year;
}



export {
  handleEventListeners,
  handleSearchElementDblClick,
  calculateDelayTime,
  updateGlobalDateCapture
}