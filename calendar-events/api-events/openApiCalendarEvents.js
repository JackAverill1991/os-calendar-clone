import { removeDuplicateEvents } from "./loadApiCalendarEvents.js";
import { getSingleDateDetailsPosition } from "../event-details-element/detailsElementPositioning.js";
import { windowEventListeners } from "../sharedWindowListeners.js";
import { getFromLocalStorage, monthNames } from "../../utils.js";



// ===============================================
//  Open API Calendar Events
// ===============================================

// Adds event listener to class element that allows the user to double click API event elements and open the details element.
// 'handleAPIButtonDblClick' function listener is removed after the first use and is reapplied in 'windowEventListeners' function.
// Reattaching listener allows for differentiated delay time to be applied based on factors like whether the details element is already open etc.

function openAPICalendarEvents(classElement) {
  const handleDblClick = (e) => {
    // Exit if user clicks anything other than an API event element
    if (!e.target.closest('.api-event')) return;

    // Set open delay time based on whether the details element is open
    let delay = elementAlreadyOpen === true ? 150 : 0;
    setTimeout(() => handleAPIButtonDblClick(e, classElement), delay); // Create and open details element with info pulled from API

    // Remove the listener after the first execution
    classElement.removeEventListener('dblclick', handleDblClick);
  }

  // Check if the listener is already present
  if (!classElement.hasApiClickListener) {
    classElement.addEventListener('dblclick', handleDblClick);
    classElement.hasApiClickListener = true; // Mark the element as having a listener
  }
}



// ===============================================
//  Handle API Button Double Click
// ===============================================

// Event ID is taken from the event element button and used to find the matching API event in local storage.
// Event details pop-up element is created containing details from the API.
// Dataset flag is updated marking details pop-up as already open.

function handleAPIButtonDblClick(e, classElement) {
  // Select API calendar event element from click
  const calendarEventElement = e.target.closest('.calendar-event-element.api-event');
  if (!calendarEventElement) return; // Exit if user clicks anything other than an API event element

  // Select date element
  const dateElement = e.target.closest('.date-element');

  // Get dataset values
  const dataYear = dateElement.dataset.year;
  const eventName = calendarEventElement.dataset.eventId;

  // Get API year from local storage and filter duplicate event titles
  const apiCalendarYear = getFromLocalStorage(dataYear);
  const uniqueApiEvents = removeDuplicateEvents(apiCalendarYear);

  // Select matching calendar event and get its object properties 
  const matchingCalendarEvent = uniqueApiEvents.find(event => event.name === eventName);

  // Create event details element
  const calendarEventDetails = createApiDetailsElement(matchingCalendarEvent);

  // Group variables into object
  const eventElementsObject = createEventElementsObject(dateElement, calendarEventElement, calendarEventDetails, classElement);
  
  // Update flags
  updateDatasetFlags(classElement);

  // Show pop-up event details window
  showApiEventDetails(eventElementsObject);

  // Add and remove event listeners on document window
  windowEventListeners(eventElementsObject, false);
}


function createEventElementsObject(dateElement, calendarEventElement, calendarEventDetails, classElement) {
  return {
    dateElement,
    calendarEventElement,
    calendarEventDetails,
    classElement,
    scrollContainer: classElement.querySelector('.month-dates-scroll-container'),
    containerElement: classElement, // The container where double click listeners are reattached
    positionTargetReference: calendarEventElement, // Used as fixed positioning reference for details element
  }
}


function updateDatasetFlags(classElement) {
  window.elementAlreadyOpen = true;  // Mark details element as being open
  requestAnimationFrame(() => classElement.hasApiClickListener = false); // Mark event listener as reattached
}



// ===============================================
//  Create  API Details Element
// ===============================================

// Creates a pop-up details element containing the event name, date and a short description from the API.
// Appends element to the placeholder container once created.

function createApiDetailsElement(matchingCalendarEvent) {
  const {
    name,
    description,
    date: { 
      datetime: { year, month, day }
    }
  } = matchingCalendarEvent;

  // Create event details pop-up
  const calendarEventDetails = document.createElement('div');
  calendarEventDetails.classList.add('calendar-event-details', 'month-calendar');
  calendarEventDetails.innerHTML = `
    <div class="details-inner-container">
      <div class="calendar-details-title">${name}</div>
      <div class="calendar-details-date">${day} ${monthNames[month - 1]} ${year}</div>
      <div class="calendar-details-description">${description}</div>
      <div class="arrow-container"></div>
    </div>
  `;

  // Append details element to placeholder
  const detailsElementPlaceholder = document.querySelector('.details-element-placeholder');
  detailsElementPlaceholder.appendChild(calendarEventDetails);

  return calendarEventDetails;
}



function showApiEventDetails(eventElementsObject) {
  const { calendarEventDetails } = eventElementsObject;

  if (calendarEventDetails) {
    // Show detailed calendar event information
    setTimeout(() => calendarEventDetails.classList.add('show'), 10); // Add animation with delay to ensure correct rendering

    // Position details element in single date event elements
    getSingleDateDetailsPosition(eventElementsObject);
  }
}



export {
  openAPICalendarEvents,
  handleAPIButtonDblClick,
}