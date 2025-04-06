import { handleDateElementDblClick } from "./user-added-events/addNewCalendarEvent.js";
import { handleEventButtonClick } from "./user-added-events/editCalendarEvents.js";
import { handleAPIButtonDblClick } from "../calendar-events/api-events/openApiCalendarEvents.js";
import { monthEventPositioning } from "./monthEventPositioning.js";
import { handleSearchElementDblClick, calculateDelayTime, updateGlobalDateCapture } from "../search-form/searchElementListeners.js";
import { removeArrowElement } from "../calendar-events/event-details-element/arrowElementFunctions.js";


// ===============================================
//  Window Event Listeners
// ===============================================

// Used in files addNewCalendarEvent.js, editCalendarEvents.js, openApiCalendarEvents.js

// These functions handle both single open / close of the calendar event details element, and the behaviour when one is opened multiple times in a row.
// Examples of this could be when the same event element is double clicked several times causing it to open and close quickly, or when one event is created while the previous event's details element is still open.
// These are unlikely scenarios but it handles these efficiently and ensures smooth behaviour even if the app's functions are used improperly.
// The 'elementAlreadyOpen' flag is used to implement a delayed open on the details element if another one is open already.
// Functions are saved to reference variables in order for them to be accessible throughout the module.


// Function references for adding / removing event listeners
let singleOrDoubleCLickReference;
let renewDblClickReference;
let enterKeyPressReference = null;
let classElementScrollReference;
let windowResizeReference;


function windowEventListeners(elementsObject, dynamicallyAdded = false) {
  const { containerElement, scrollContainer } = elementsObject;

  // Select details element placeholder
  elementsObject.detailsElementPlaceholder = document.querySelector('.details-element-placeholder');

  // Add function references
  singleOrDoubleCLickReference = (e) => singleOrDoubleClickHandler(e, elementsObject, dynamicallyAdded);
  renewDblClickReference = (e) => reattachDblClickListeners(e, containerElement, window.elementAlreadyOpen);
  classElementScrollReference = () => classElementScroll(elementsObject);
  windowResizeReference = (e) => windowResize(e, elementsObject, dynamicallyAdded);

  // Only redefine reference variable if null - (Redefining with a fresh instance of function prevents listener removal later)
  if (enterKeyPressReference === null) {
    enterKeyPressReference = (e) => handleEnterKeyPress(e, elementsObject, dynamicallyAdded);
  }

  // Check if the listener is already present
  if (!window.hasEnterKeyListener) {
    // Attach keydown event listener and update flag on window
    window.addEventListener('keydown', enterKeyPressReference);
    window.hasEnterKeyListener = true;
  }

  
  window.addEventListener('click', singleOrDoubleCLickReference); // Attach single / double click listener
  scrollContainer.addEventListener('scroll', classElementScrollReference); // Attach scroll listenr
  window.addEventListener('resize', windowResizeReference); // Attach window resize listener
}



// ===============================================
//  Single / Double Click Handler
// ===============================================

// Handles single and double clicks on calendar events inside the container (classElement or searchResults).
// Single clicks trigger a timeout to detect a second click, while double clicks fire immediately.
// Both types reattach double-click listeners (see reattachDblClickListeners).
// Also removes unused event listeners.

let clickTimeout; // Stores timeout for differentiating single/double clicks
const clickDelay = 200; // Time threshold for distinguishing clicks

function singleOrDoubleClickHandler(e, elementsObject, dynamicallyAdded) {
  const { calendarEventDetails, detailsElementPlaceholder} = elementsObject;

  // Always hide the details element immediately, regardless of click type
  hideDetailsElement(e, calendarEventDetails, 'click');

  // 'if' block handles double click
  if (clickTimeout && window.elementAlreadyOpen === true) {
    // Double-click detected: Clear timeout and reset
    clearTimeout(clickTimeout);
    clickTimeout = null;

    removePreviousDetailsElement(detailsElementPlaceholder);
    resetEventListeners(elementsObject); // Remove unused listeners and reattach double-click listener

  } else {
    if (!isValidSingleClickTarget(e.target)) return;

    // Single-click: Set timeout to confirm if no second click follows
    clickTimeout = setTimeout(() => {
      clickTimeout = null;

      // Single window click functions
      handleSingleWindowClick(elementsObject, dynamicallyAdded);
    }, clickDelay);
  }
}

// Prevents triggering a single click event on excluded targets
function isValidSingleClickTarget(target) {
  return (
    !target.closest('.calendar-event-details') ||
    target.closest('.delete-event-button') ||
    target.closest('.details-close-button')
  );
}



// ===============================================
//  Handle Single Window Click Listener
// ===============================================

// Handles single click on the window within 'singleOrDoubleClickHandler' function.
// Removes details element from placeholder and refreshes calendar event button display with newly added elements no longer at the top.
// Removes unused event listeners.

function handleSingleWindowClick(elementsObject, dynamicallyAdded) {
  const { classElement, detailsElementPlaceholder } = elementsObject;
  // Reset the flag to false
  window.elementAlreadyOpen = false;

  // Select and remove most recent '.calendar-event-details' element
  removePreviousDetailsElement(detailsElementPlaceholder);

  // Position month events in size order
  if (dynamicallyAdded) monthEventPositioning(classElement, null);
  
  // Remove unused event listeners and reattach double-click listener to container element
  resetEventListeners(elementsObject);
}



// ===============================================
//  Renew Double Click Listeners
// ===============================================

// Reattaches the double-click event listener to the container and triggers different functions based on the clicked element.
// If a details element is already open, applies a delay to allow it to close before opening a new one.
// For search results, calculates an accurate delay (calculateDelayTime) to account for calendar month/year transitions.

function reattachDblClickListeners(e, containerElement, elementAlreadyOpen) {
  // Exit function if user does not click on any of the target elements
  if (!targetElementDoubleClicked(e.target)) return;

  // Set open delay time based on whether the details element is open
  const delay = elementAlreadyOpen === true ? 150 : 0;

  // Check click occurs on a calendar event container in a date element
  if (!containerElement.hasDblClickAddListener && e.target.matches('.calendar-event-container')) {
    setTimeout(() => handleDateElementDblClick(e, containerElement), delay); // Add new calendar event element 
    containerElement.hasDblClickAddListener = true; // Event listener re-added in windowEventListeners function
  }

  // Check click occurs on personal event element
  if (!containerElement.hasDblClickEditListener && e.target.closest('.calendar-event-element.personal-event')) {
    setTimeout(() => handleEventButtonClick(e, containerElement), delay); // Edit calendar event element
    containerElement.hasDblClickEditListener = true; // Event listener re-added in windowEventListeners function
  }

  // Check click occurs on API event element
  if (!containerElement.hasApiClickListener && e.target.closest('.calendar-event-element.api-event')) {
    setTimeout(() => handleAPIButtonDblClick(e, containerElement), delay); // Open API details element
    containerElement.hasApiClickListener = true; // Event listener re-added in windowEventListeners function
  }

  // Check click occurs on search results event element
  if (!containerElement.hasDblClickSearchListener && e.target.closest('.search-event-element')) {
    // Set open delay time based on whether the details element is open and whether the calendar has to change month
    const searchDelay = calculateDelayTime(e.target, containerElement.globalDateCapture);

    // Update the global date capture object after a slight delay (so that it only takes effect on the next double click)
    updateGlobalDateCapture(containerElement);

    // Open details element by clicking search results event element
    setTimeout(() => handleSearchElementDblClick(e, containerElement), searchDelay);
    containerElement.hasDblClickSearchListener = true; // Event listener re-added in windowEventListeners function
  }

  // Remove event listener after use
  containerElement.removeEventListener('dblclick', renewDblClickReference);
}


function targetElementDoubleClicked(target) {
  return (
    target.closest('.calendar-event-container') ||
    target.closest('.calendar-event-element') ||
    target.closest('.search-event-element')
  );
}



// ===============================================
//  Handle Enter Key Press Listener 
// ===============================================

// Hides calendarEventDetails when when 'Enter' key is pressed.
// 'resetEventListeners' removes unused event listeners and reattaches double click window to container element.
// 'monthEventPositioning' reorders event elements for dynamically added events that have been initially positioned at the top.
// Sets 'elementAlreadyOpen' flag to false to signal calendarEventDetails is closed.

function handleEnterKeyPress(e, elementsObject, dynamicallyAdded) {
  const { classElement, detailsElementPlaceholder } = elementsObject;
  if (e.key === 'Enter' || e.keyCode === 13) {    
    // Reset the flag to false
    window.elementAlreadyOpen = false;

    // Remove classes from event details element
    const calendarEventDetails = detailsElementPlaceholder.querySelector('.calendar-event-details');
    hideDetailsElement(e, calendarEventDetails, null);

    // Remove unused event listeners and reattach double-click listener to container element
    resetEventListeners(elementsObject);

    // Select and remove most recent '.calendar-event-details' element
    removePreviousDetailsElement(detailsElementPlaceholder);

    // Position month events in size order
    if (dynamicallyAdded) {
      setTimeout(() => monthEventPositioning(classElement, null), 250);
    }
  }
}


// Remove Enter key press listener
function removeEnterKeyPress() {
  window.removeEventListener('keydown', enterKeyPressReference); // Remove listener from window
  window.hasEnterKeyListener = false; // Mark the element as no longer having a listener 
  enterKeyPressReference = null; // Reset reference to null
}



// ===============================================
//  Window Resize
// ===============================================

// Hides calendarEventDetails when window is resized.
// 'resetEventListeners' removes unused event listeners and reattaches double click window to container element.
// 'monthEventPositioning' reorders event elements for dynamically added events that have been initially positioned at the top.
// Sets 'elementAlreadyOpen' flag to false to signal calendarEventDetails is closed.

function windowResize(e, elementsObject, dynamicallyAdded) {
  const { detailsElementPlaceholder, calendarEventDetails, classElement } = elementsObject;
  // Reset the flag to false
  window.elementAlreadyOpen = false;

  // Remove unused event listeners and reattach double-click listener to container element
  resetEventListeners(elementsObject);    

  // Select and remove most recent '.calendar-event-details' element
  hideDetailsElement(e, calendarEventDetails, null);
  removePreviousDetailsElement(detailsElementPlaceholder);

  // Position month events in size order
  if (dynamicallyAdded) {
    setTimeout(() => monthEventPositioning(classElement, null), 250);
  }
}



// ===============================================
//  Class Element Scroll
// ===============================================

// Remove arrow from details element when the window is scrolled (for when content overflows viewport).

function classElementScroll(elementsObject) {
  const { calendarEventDetails } = elementsObject;

  calendarEventDetails.dataset.windowScrolled = 'true';
  removeArrowElement(calendarEventDetails);
}



// ===============================================
//  Reset Event Listners
// ===============================================

// Removes unused 'click', 'scroll', and 'resize' event listeners and reattaches double-click listener to container element.

function resetEventListeners(elementsObject) {
  const { containerElement, scrollContainer } = elementsObject;

  // Attach the reusable double-click handler
  containerElement.addEventListener('dblclick', renewDblClickReference);

  // Remove listener after use
  window.removeEventListener('click', singleOrDoubleCLickReference);

  // Remove scroll listener from scroll container element
  scrollContainer.removeEventListener('scroll', classElementScrollReference);

  // Remove event listener immediately to prevent multiple executions
  window.removeEventListener('resize', windowResizeReference);

  // Remove event listener after use
  removeEnterKeyPress();
}



// ===============================================
//  Remove Previous Details Element
// ===============================================

// Function selects the most recent calendar event details element and removes it from DOM.
// Prevents bugs where future details elements need to be re-selected and the a leftover old one may be targeted.

function removePreviousDetailsElement(detailsElementPlaceholder) {
  const calendarEventDetails = detailsElementPlaceholder.querySelector('.calendar-event-details');

  // Delay the removal of elements by 300 milliseconds
  if (calendarEventDetails && calendarEventDetails.dataset.isDragged !== 'true') {
    if (calendarEventDetails) {
      setTimeout(() => calendarEventDetails.remove(), 250);
    }
  }
}



// ===============================================
//  Hide Details Element
// ===============================================

// Remove 'show' class visibility from details element.

function hideDetailsElement(e, calendarEventDetails, type) {
  // Return from function if click event takes place on details element (Prevents unintended closure)
  const isWithinDetailsElement = type === 'click' && e.target.closest('.calendar-event-details');
  if (isWithinDetailsElement) return;

  // Hide calendar details element
  if (calendarEventDetails && calendarEventDetails.dataset.isDragged !== 'true') {
    setTimeout(() => {
      calendarEventDetails.classList.remove('show');
    }), 20;
  }
}



export { windowEventListeners }