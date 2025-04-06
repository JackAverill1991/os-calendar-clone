import { createEventDetailsElement } from "./addNewCalendarEvent.js";
import { addDateAndTimeFunctionality } from "../user-added-events/date-and-time-event-listeners/addDateTimeFunctionality.js";
import { deleteCalendarEvent } from "./deleteCalendarEvent.js";
import { getEventsFromLocalStorage } from "./userEventsLocalStorage.js";
import { handleEventObjectValues, handleAllDayEvents } from "./handleEventObjectValues.js";
import { windowEventListeners } from "../sharedWindowListeners.js";
import { assignCalendarCategories } from "../../calendar-categories/assignCalendarCategories.js";
import { getSingleDateDetailsPosition, getMutlipleDateDetailsPosition } from "../event-details-element/detailsElementPositioning.js";



// ===============================================
//  Edit User Calendar Events
// ===============================================

// Allows user to edit calendar events within the month calendar Class.
// An event listener for the function 'handleEventButtonClick' is added to the classElement to open a pop-up window containing event details.
// Listener has a custom time delay based on whether there is already an event details element open.
// This event listener will be re-attached each time it is used (see 'windowEventListeners' in 'sharedWindowListeners.js') in order to update the delay time.

function editCalendarEvents(classElement) {
  const handleDblClick = (e) => {
    // Exit if user clicks anything other than a user-added event element
    if (!e.target.closest('.personal-event')) return;

    // Set open delay time based on whether the details element is open
    let delay = elementAlreadyOpen === true ? 150 : 0;
    setTimeout(() => handleEventButtonClick(e, classElement), delay); // Enable edit element process by opening details element

    // Remove the listener after the first execution
    classElement.removeEventListener('dblclick', handleDblClick);
  }

  // Check if the listener is already present
  if (!classElement.hasDblClickEditListener) {
    classElement.addEventListener('dblclick', handleDblClick);
    classElement.hasDblClickEditListener = true; // Mark the element as having a listener
  }
}


// ===============================================
//  Handle Event Button Click
// ===============================================

// Event details pop-up element is created.
// User event object is located from local storage.
// Relevant functions are attached to the details element so that users can edit the input fields (name, location etc).
// Any details entered will be updated in the object and added to the local storage.

function handleEventButtonClick(e, classElement) {
  // Select calendar event element from click
  const calendarEventElement = e.target.closest('.calendar-event-element.personal-event');
  if (!calendarEventElement) return; // Exit if user clicks anything other than a user-added event element
 
  // Get dataset event ID from event element
  const eventId = calendarEventElement.dataset.eventId;

  // Get dataset event ID from event element and find all other elements with matching ID
  const matchingIdEventElements = getMatchingIdEventElements(eventId, classElement);

  // Create event details element and prevent double-click listener from bubbling up
  const calendarEventDetails = createEventDetailsElement();

  // Group variables into object
  const eventElementsObject = createEventElementsObject(calendarEventElement, calendarEventDetails, classElement);

  // Mark details element as open and double click listener as reattached
  updateDatasetFlags(classElement);

  // Get matching user event object for eventId from local storage
  const userEventObject = getUserEventObject(eventId, matchingIdEventElements, eventElementsObject);

  // Call functions handling widget calendars, event object properties and window event listeners
  callEventDetailsFunctions(e, eventElementsObject, userEventObject);
  
  // Separate logic for single and multiple date events and determine where details element is placed
  const clickedRowNumber = eventElementsObject.dateElement.dataset.rowNumber;
  processEventByDateRange(eventElementsObject, matchingIdEventElements, clickedRowNumber);
}


function getMatchingIdEventElements(eventId, classElement) {
  // Find all other elements with matching event ID
  const matchingIdEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`);

  // Return nodelist converted to array of elements
  return Array.from(matchingIdEventElements);
}


function createEventElementsObject(calendarEventElement, calendarEventDetails, classElement) {
  return {
    calendarEventElement,
    dateElement: calendarEventElement.closest('.date-element'),
    calendarEventDetails,
    deleteButton: calendarEventDetails.querySelector('.delete-event-button'),
    classElement,
    scrollContainer: classElement.querySelector('.month-dates-scroll-container'), 
    positionTargetReference: calendarEventElement, // Used as fixed positioning reference for details element
    containerElement: classElement, // The container where double click listeners are reattached
  }
}


function updateDatasetFlags(classElement) {
  window.elementAlreadyOpen = true;  // Mark details element as being open
  requestAnimationFrame(() => classElement.hasDblClickEditListener = false); // Mark event listener as reattached
}



// ===============================================
//  Get Array Of Years
// ===============================================

// Get year dataset values from all matching event elements and add all unique values to an array.

function getArrayOfYears(matchingIdEventElements) {
  const arrayOfYears = matchingIdEventElements.map(element => {
    const dateElement = element.closest('.date-element');
    const eventYear = dateElement.getAttribute('data-year');
    return eventYear;
  });

  return [...new Set(arrayOfYears)];
}



// ===============================================
//  Process Events By Date Range
// ===============================================

// Determines which event element in which the pop-up details element is appended to.
// The only existing event element is selected in single date events.
// Multiple dates is determined based on an array of factors in getMutlipleDateDetailsPosition().

function processEventByDateRange(eventElementsObject, matchingIdEventElements, clickedRowNumber) {
  if (matchingIdEventElements.length > 1) {
    // Calculate event element to append details element
    getMutlipleDateDetailsPosition(matchingIdEventElements, clickedRowNumber, eventElementsObject);
  } 
  
  else {    
    // Ensure event details element is postioned correctly in viewport
    getSingleDateDetailsPosition(eventElementsObject);
  }
}



// ===============================================
//  Event Details Functions
// ===============================================

// Creates widget calendar classes and adds date/time inputs.
// Attaches event listeners to the details element for user interactions and event customization.
// Adds window event listeners to close the details element, update the layout, and save changes to local storage.

function callEventDetailsFunctions(e, eventElementsObject, userEventObject) {
  // Initialize widget calendars and functionalities
  addDateAndTimeFunctionality(eventElementsObject, userEventObject);
  assignCalendarCategories(eventElementsObject, userEventObject);
  handleAllDayEvents(e, eventElementsObject, userEventObject);

  // Enable removal of events with the delete button
  deleteCalendarEvent(eventElementsObject);

  // Add click and Enter key event listeners to window that update local storage
  windowEventListeners(eventElementsObject, false);
}



// ===============================================
//  Get User Event Object From Local Storage
// ===============================================

// Retrieves a user event object from local storage using the event ID.
// Allows the user to edit event details (name, location, etc.) while the popup is open.
// Updates the event object and saves changes to local storage in real time.

function getUserEventObject(eventId, matchingIdEventElements, eventElementsObject) {
  // Get an array of unique year values for the dates within calendar event
  const uniqueYears = getArrayOfYears(matchingIdEventElements);

  // Get all events from relevant calendar year in local storage
  const matchingYearUserEvents = getEventsFromLocalStorage(uniqueYears);
  const userEventObject = matchingYearUserEvents.find(object => object.eventId === eventId);

  // Update user event object details from form
  handleEventObjectValues(eventElementsObject, userEventObject);

  return userEventObject;
}



export {
  editCalendarEvents,
  handleEventButtonClick,
  callEventDetailsFunctions,
  processEventByDateRange
}