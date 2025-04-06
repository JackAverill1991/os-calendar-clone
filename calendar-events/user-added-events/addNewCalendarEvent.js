import { handleEventObjectValues, handleAllDayEvents } from "./handleEventObjectValues.js";
import { addDateAndTimeFunctionality } from "./date-and-time-event-listeners/addDateTimeFunctionality.js";
import { deleteCalendarEvent } from "./deleteCalendarEvent.js";
import { monthEventPositioning } from "../monthEventPositioning.js";
import { getSingleDateDetailsPosition } from "../event-details-element/detailsElementPositioning.js";
import { assignCalendarCategories } from "../../calendar-categories/assignCalendarCategories.js";
import { addEventToLocalStorage, updateEventInLocalStorage } from "./userEventsLocalStorage.js";
import { getCategoriesFromLocalStorage } from "../../calendar-categories/eventCategoriesLocalStorage.js";
import { windowEventListeners } from "../sharedWindowListeners.js";
import { showHiddenCategory } from "../../calendar-categories/handleCategoryObjectValues.js";
import { setCalendarButtonInfo } from "./loadCalendarEvents.js";
import { updateSearchResults } from "../../search-form/searchbarFunctionality.js";
import { addSvgIcon } from "../../icons/icons.js";



// ===============================================
//  Add New Calendar Event
// ===============================================

// Allows user to add new calendar events to the month calendar Class.
// An event listener for the function 'handleDateElementDblClick' is added to the classElement to open a pop-up window containing event details.
// Listener has a custom time delay based on whether there is already an event details element open.
// This event listener will be re-attached each time it is used (see 'windowEventListeners' in 'sharedWindowListeners.js') in order to update the delay time.

// New calendar event elements are added to the event containers each time an event is created.
// When these event elements are double clicked and popup window is reopened, any edits are handled in 'editCalendarEvents.js'.


function addNewCalendarEvent(classElement) {
  // Define function reference
  const handleDblClick = (e) => {
    // Exit if user clicks outside of the event container
    if (!e.target.matches('.calendar-event-container')) return;

    // Set open delay time based on whether the details element is open
    let delay = elementAlreadyOpen === true ? 150 : 0;
    setTimeout(() => handleDateElementDblClick(e, classElement), delay); // Create and add new calendar event
    
    // Remove the listener after the first execution
    classElement.removeEventListener('dblclick', handleDblClick);
  }

  // Check if the listener is already present
  if (!classElement.hasDblClickAddListener) {
    // Add event listener to calendar class element
    classElement.addEventListener('dblclick', handleDblClick);
    classElement.hasDblClickAddListener = true; // Mark the element as having a listener
  }
}



// ===============================================
//  Handle Date Element Double Click
// ===============================================

// Call all functions relating to new event, including the event element button, the pop-up details window and the details object.
// Widget calendar classes are created, and date and time inputs are added.
// Window event listeners are added to close details element, update layout and update local storage.

// Create data flag to track whether details element is open and preset it to false
window.elementAlreadyOpen = false;

function handleDateElementDblClick(e, classElement) {
  // Select event container on double click
  const calendarEventContainer = e.target.closest('.calendar-event-container');
  if (!calendarEventContainer) return; // Exit if double click is outside of the event container

  // Create event element and button. Append event element to date element
  const calendarEventElement = createAndAppendCalendarElement(calendarEventContainer);
  
  // Create event details element and append to container
  const calendarEventDetails = createEventDetailsElement();

  // Group variables into object
  const eventElementsObject = createEventElementsObject(
    calendarEventContainer, calendarEventElement, calendarEventDetails, classElement
  );

  // Create userEventObject for storing event information, and pass in default values
  const userEventObject = createUserEventObject(eventElementsObject);

  // Mark details element as open and double click listener as reattached
  updateDatasetFlags(classElement);

  // Preset all-day value based on date element clicked, and add toggle functionality
  handleAllDayEvents(e, eventElementsObject, userEventObject);

  // Add name and start / end time information to calendar buttons
  setCalendarButtonInfo(calendarEventElement, userEventObject, 'first-element');

  // Add category color scheme to event button
  assignEventButtonColors(calendarEventElement, userEventObject);

  // Generate pop-up menu in calendar event details which can be clicked to update category
  assignCalendarCategories(eventElementsObject, userEventObject);

  // Create widget calendars, attach event listeners and add time functionality
  addDateAndTimeFunctionality(eventElementsObject, userEventObject);

  // Enable removal of events with the delete button
  deleteCalendarEvent(eventElementsObject);

  // Format event elements in grid layout and handle how the grid is affected by hidden category elements being added
  eventPositionAndVisibility(classElement, userEventObject);

  // Position details element in single date event elements
  getSingleDateDetailsPosition(eventElementsObject);

  // Add click and Enter key event listeners to window that update local storage
  windowEventListeners(eventElementsObject, true);

  // Add event to local storage
  addEventToLocalStorage(userEventObject);

  // Update search results element results if it is open
  updateSearchResults();
}


function createAndAppendCalendarElement(calendarEventContainer) {
  const calendarEventElement = createCalendarEventElement(null, true);
  calendarEventContainer.appendChild(calendarEventElement);

  return calendarEventElement;
}


// Group variables into object
function createEventElementsObject(calendarEventContainer, calendarEventElement, calendarEventDetails, classElement) {
  return {
    dateElement: calendarEventContainer.closest('.date-element'),
    calendarEventContainer,
    calendarEventElement,
    calendarEventDetails,
    deleteButton: calendarEventDetails.querySelector('.delete-event-button'),
    classElement,
    scrollContainer: classElement.querySelector('.month-dates-scroll-container'), 
    positionTargetReference: calendarEventElement, // Used as fixed positioning reference for details element
    containerElement: classElement // The container where double click listeners are reattached
  }
}



// ===============================================
//  Create Calendar Element
// ===============================================

// Creates clickable button for events that displays the name and start / end time of an event.

function createCalendarEventElement(datesArray, dynamicallyAdded = false) {
  // Create calendar event element
  const calendarEventElement = document.createElement('div');
  calendarEventElement.classList.add('calendar-event-element', 'personal-event');

  // Create calendar event button and assign class
  const calendarEventButton = document.createElement('span');
  calendarEventButton.classList.add('calendar-event-button');

  // Assign dataset value to allow highlight removal on window click
  calendarEventButton.dataset.preventRemoveHighlight = 'false';

  // Add button content
  calendarEventButton.innerHTML = `
    <span class="event-button-name"></span>
    <span class="event-button-time"></span>
  `;

  // Append inner elements to calendar event element
  calendarEventElement.append(calendarEventButton);

  // Add color 'highlight' class to dynamically added elements 
  if (dynamicallyAdded) calendarEventButton.classList.add('highlight');

  // Check datesArray is more than one and add class to multiple day events
  if (datesArray && datesArray.length > 1) {
    calendarEventElement.classList.add('multiple-day-event');
  }

  return calendarEventElement;
}



// ===============================================
//  Create Details Element
// ===============================================

// Create event details element that appears when an event element is double clicked.
// Element is deleted when it is closed so a new instance appears every time.

function createEventDetailsElement() {
  // Create calendar event details element and add class
  const calendarEventDetails = document.createElement('div');
  calendarEventDetails.classList.add('calendar-event-details', 'month-calendar');

  // Create new calendar event details form from template 
  const calendarEventDetailsFormTemplate = document.querySelector('.calendar-event-details-template');
  const clonedContent = calendarEventDetailsFormTemplate.content.cloneNode(true);
  const calendarEventDetailsForm = clonedContent.querySelector('.details-inner-container');

  // Append form to details element
  calendarEventDetails.appendChild(calendarEventDetailsForm);

  // Select placeholder element and append calendarEventDetails
  const detailsElementPlaceholder = document.querySelector('.details-element-placeholder');
  detailsElementPlaceholder.appendChild(calendarEventDetails);

  // Add animation with delay to ensure correct rendering
  setTimeout(() => calendarEventDetails.classList.add('show'), 10);

  // Add 'delete event' button
  const deleteButton = calendarEventDetails.querySelector('.delete-event-button');
  addSvgIcon('dustbinIcon', deleteButton, 'none', '#464645');

  return calendarEventDetails;
}



// ===============================================
//  Create User Event Object
// ===============================================

// New object (userEventObject) is created to store event details in the local storage.
// Object is passed to handleEventObjectValues, in which initial details date / time / event name values are created as placeholders.
// User can then edit the input fields (name, location etc) while the popup window is still open.
// Any details entered will be updated in the object and added to the local storage.

function createUserEventObject(eventElementsObject) {
  // Create user event object
  const userEventObject = {};

  // Update user event object details from form
  handleEventObjectValues(eventElementsObject, userEventObject);

  return userEventObject;
}



// ===============================================
//  Update Window Event Element Dataset Flags
// ===============================================

// Update dataset flags used to determine window event listener behaviour when adding / editing events.

function updateDatasetFlags(classElement) {
  window.elementAlreadyOpen = true;  // Mark details element as being open
  requestAnimationFrame(() => classElement.hasDblClickAddListener = false); // Mark event listener as reattached
}



// ===============================================
//  Assign Event Button Colors
// ===============================================

// Add category color profile to event button.

function assignEventButtonColors(calendarEventElement, userEventObject) {
  // Get calendar categories array from local storage
  const calendarCategoriesArray = getCategoriesFromLocalStorage();

  // Find category from array that matches the name property in the userEventObject
  const matchingCalendarCategory = calendarCategoriesArray.find(object => object.categoryId === userEventObject.categoryId);
  
  // Add matching category colors to calendar buttons
  const calendarEventButton = calendarEventElement.querySelector('.calendar-event-button');
  calendarEventButton.style.backgroundColor = `#${matchingCalendarCategory.colorPalette.colors.highlight}`;
}



// ===============================================
//  Event Position And Visibility
// ===============================================

// Check for hidden category when adding new event.
// If category is hidden, switch its visibility back on and reorganize layout.
// If category is visible, reorganize layout only.

function eventPositionAndVisibility(classElement, userEventObject) {
  // Look for sidebar category button that has 'highlight' and 'hide' class
  const hiddenCategoryButton = document.querySelector('.calendar-category.hide.highlight');

  if (hiddenCategoryButton) {
    // Select parent category element to use its dataset properties
    const highlightedCategoryElement = hiddenCategoryButton.closest('.calendar-category-wrapper');
    showHiddenCategory(highlightedCategoryElement, classElement, userEventObject);

    // Position month events in size order
    monthEventPositioning(classElement, userEventObject.eventId);
  }

  else {
    // Position month events in size order
    monthEventPositioning(classElement, userEventObject.eventId);
  }
}



export {
  addNewCalendarEvent,
  handleDateElementDblClick,
  createCalendarEventElement,
  createEventDetailsElement,
  updateEventInLocalStorage,
}