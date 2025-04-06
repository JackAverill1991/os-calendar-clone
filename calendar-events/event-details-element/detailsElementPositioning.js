import { addArrowElement, realignArrowElement } from "./arrowElementFunctions.js";
import "./detailsElementDragAndDrop.js";



// =========================================================
//  Get Details Element Position (Single Date Events)
// =========================================================

// Takes coordinates from dateElement and calendarEventDetails and adds to eventElementsObject for later use.
// Calls 'calculateHorizontalDirection' to calculate whether calendarEventDetails overflows viewport and determine its open direction.
// Creates eventHandlers object and assigns window event listeners ('click' and Enter 'keydown') so they can both be removed when one of them is used.
// Window event listeners are responsible for resetting calendarEventDetails back to its initial position as it fades out.

function getSingleDateDetailsPosition(eventElementsObject) {
  const { calendarEventDetails, dateElement  } = eventElementsObject;

  // Get date element and details element coordinates
  const dateElementCoordinates = dateElement.getBoundingClientRect();
  const detailsElementCoordinates = calendarEventDetails.getBoundingClientRect();

  // Add details element coordinates to eventElementsObject
  eventElementsObject.detailsElementCoordinates = detailsElementCoordinates;
  eventElementsObject.dateElementCoordinates = dateElementCoordinates;

  // Prevent event details elements from overflowing the right hand side of the viewport
  calculateHorizontalDirection(eventElementsObject);

  // Create an object to hold the references to the event listeners
  const eventHandlers = {};

  // Create window click handler and assign it to the eventHandlers object
  eventHandlers.windowClickHandler = createWindowClickHandler(calendarEventDetails, eventHandlers);
  
  // Create window enter key handler and assign it to the eventHandlers object
  eventHandlers.windowEnterKeyHandler = createWindowEnterKeyHandler(calendarEventDetails, eventHandlers);

  // Add event listeners to window
  window.addEventListener('click', eventHandlers.windowClickHandler);
  window.addEventListener('keydown', eventHandlers.windowEnterKeyHandler);  
}



// ========================================================
//  Get Details Element Position For Multiple Date Events
// ========================================================

// Creates a Map to group elements by the dataset value of their parent date element.
// Positions calendarEventDetails next to the desired event element (gives priority to opening right or left first, then will open downwards or upwards).
// Creates eventHandlers object and assigns window event listeners ('click' and Enter 'keydown') so they can both be removed when one of them is used.
// Window event listeners are responsible for resetting calendarEventDetails back to its initial position as it fades out.

function getMutlipleDateDetailsPosition(matchingIdEventElements, clickedRowNumber, eventElementsObject) {
  const { calendarEventDetails } = eventElementsObject;

  // Map event elements by their date element row
  const elementRowMap = createRowMap(matchingIdEventElements);

  // Get the clicked row value
  const clickedRowElements = elementRowMap.get(clickedRowNumber);

  // Get details element coordinates and add to eventElementsObject
  const detailsElementCoordinates = calendarEventDetails.getBoundingClientRect();
  eventElementsObject.detailsElementCoordinates = detailsElementCoordinates;

  // Find event element to position details element next to based on clicked row
  getTargetEventElement(clickedRowElements, clickedRowNumber, elementRowMap, eventElementsObject);

  // Create an object to hold the references to the event listeners
  const eventHandlers = {};

  // Create window click handler and assign it to the eventHandlers object
  eventHandlers.windowClickHandler = createWindowClickHandler(calendarEventDetails, eventHandlers);
  
  // Create window enter key handler and assign it to the eventHandlers object
  eventHandlers.windowEnterKeyHandler = createWindowEnterKeyHandler(calendarEventDetails, eventHandlers);

  // Add event listeners to window
  window.addEventListener('click', eventHandlers.windowClickHandler);
  window.addEventListener('keydown', eventHandlers.windowEnterKeyHandler);
}



// ===============================================
//  Create Row Map
// ===============================================

// Creates a Map to group elements by the dataset value of their parent date element.

function createRowMap(matchingIdEventElements) {
  // Create a Map to group elements by their dataset value
  const elementRowMap = new Map();

  matchingIdEventElements.forEach(element => {
    const parentDateElement = element.closest('.date-element');
    const rowNumber = parentDateElement.dataset.rowNumber;

    if (!elementRowMap.has(rowNumber)) {
      // If the key doesn't exist, create a new array for this group
      elementRowMap.set(rowNumber, []);
    }

    // Add the element to the corresponding group
    elementRowMap.get(rowNumber).push(element);
  });

  return elementRowMap;
}



// ===============================================
//  Get Target Event Element
// ===============================================

// Positions calendarEventDetails next to the desired event element.
// Gives priority to opening right or left first, then will open downwards or upwards.

function getTargetEventElement(clickedRowElements, clickedRowNumber, elementRowMap, eventElementsObject) {
  const { calendarEventDetails } = eventElementsObject;

  // Get measurements from details element
  const detailsElementWidth = calendarEventDetails.getBoundingClientRect().width;

  // Select first and last elements of clicked row, and get their edge measurements
  const firstElement = clickedRowElements[0];
  const lastElement = clickedRowElements[clickedRowElements.length - 1];
  const firstElementLeftEdge = firstElement.getBoundingClientRect().left - 14;
  const lastElementRightEdge = lastElement.getBoundingClientRect().right + 14;

  // Check if the clicked row number is the first or last key in Map
  const isFirstRow = checkIfFirstKey(clickedRowNumber, elementRowMap);
  const isLastRow = checkIfLastKey(clickedRowNumber, elementRowMap);

  // Check if the details element fits in the given position
  const canFitToLeft = (firstElementLeftEdge - detailsElementWidth) > 0;
  const canFitToRight = offsetSearchMenu(lastElementRightEdge, detailsElementWidth);

  // Determine target element and behavior
  if (isFirstRow || isLastRow) {
    if (canFitToRight) {
      eventElementsObject.positionTargetCoordinates = lastElement.getBoundingClientRect();
      openDetailsElementRight(eventElementsObject);
      return;
    }
    if (canFitToLeft) {
      eventElementsObject.positionTargetCoordinates = firstElement.getBoundingClientRect();
      openDetailsElementLeft(eventElementsObject);
      return;
    }
  }

  // Select middle event element as parent
  const targetEventElement = selectMiddleElement(clickedRowElements);

  // Open details element downwards unless it overflows viewport, in which case open upwards
  calculateVerticalDirection(targetEventElement, eventElementsObject);
}


function selectMiddleElement(clickedRowElements) {
  // Find the element that has a date element as a parent with dataset day value '4'
  return clickedRowElements.find(element => {
    const dateElement = element.closest('.date-element');
    return dateElement.dataset.dayValue === '4';
  });
}


// Check for first key (row number) in map
function checkIfFirstKey(key, map) {
  const firstKey = map.keys().next().value;
  return firstKey === key;
}


// Check for last key (row number) in map
function checkIfLastKey(key, map) {
  const keys = Array.from(map.keys());
  return keys[keys.length - 1] === key;
}


function offsetSearchMenu(lastElementRightEdge, detailsElementWidth) {
  if (document.body.classList.contains('open-search-results')) {
    return (lastElementRightEdge + (detailsElementWidth + 240)) < window.innerWidth;
  } else {
    return (lastElementRightEdge + detailsElementWidth) < window.innerWidth;
  }
}



// =========================================================
//  Calculate Horizontal Direction
// =========================================================

// Calculates if calendarEventDetails will open to the right or left.
// Right is given priority, and if it would overflow viewport, it opens left instead.

function calculateHorizontalDirection(eventElementsObject) {
  const { positionTargetReference, dateElementCoordinates, detailsElementCoordinates } = eventElementsObject;
  // Calculate right hand side of the date element
  const dateElementRight = dateElementCoordinates.right;

  // Get width of details element
  const eventDetailsWidth = detailsElementCoordinates.width;

  // Calculate if the pop-up would overflow to the right of the viewport
  const isOverflowingRight = dateElementRight + eventDetailsWidth + 14 > window.innerWidth;

  // Get coordinates from event element
  eventElementsObject.positionTargetCoordinates = positionTargetReference.getBoundingClientRect();

  if (isOverflowingRight) {
    // Open element to the left hand side if it overflows the window edge on the right
    openDetailsElementLeft(eventElementsObject);
  }

  else {
    // Open element to the right if no overflow
    openDetailsElementRight(eventElementsObject);
  }
}



// =========================================================
//  Calculate Vertical Direction
// =========================================================

// If there is not space for calendarEventDetails to open right or left, this function is used to check whether it will open downwards or upwards.
// Downward opening is given priority, and if it would overflow viewport, it opens upwards instead.

function calculateVerticalDirection(targetEventElement, eventElementsObject) {
  const { detailsElementCoordinates, positionTargetReference } = eventElementsObject;

  // Get details element height and the bottom measurement of event element
  const detailsElementHeight = detailsElementCoordinates.height;
  const eventElementBottom = positionTargetReference.getBoundingClientRect().bottom;

  // Calculate if the pop-up would overflow the bottom of the viewport
  const isOverflowingBottom = detailsElementHeight + eventElementBottom + 14 > window.innerHeight;

  // Get coordinates from event element
  eventElementsObject.positionTargetCoordinates = targetEventElement.getBoundingClientRect();

  if (isOverflowingBottom) {
    // Open element upwards if opening downwards would overflow the viewport
    openDetailsElementUp(eventElementsObject);
  } 

  else { 
    // Open element downwards if no overflow
    openDetailsElementDown(eventElementsObject);
  }
}



// ===============================================
//  Handle Details Element Left & Right Open
// ===============================================

// Ensures the calendarEventDetails opens correctly to the right or left with proper styling and positioning.
// Temporarily disables 'transition' CSS property before calendarEventDetails is given initial position (prevents unintended animations).
// Calculates 'detailsElementLeftValue' to position calendarEventDetails relative to the target event element.
// Adds dataset value and direction arrow element.

function openDetailsElementLeft(eventElementsObject) {
  const { calendarEventDetails, positionTargetCoordinates, detailsElementCoordinates } = eventElementsObject;

  // Disable transition temporarily
  calendarEventDetails.style.transition = 'transform 0s, opacity 0.3s';

  // Calculate the left property of the details element from its distance to the event element
  const eventElementLeftEdge = positionTargetCoordinates.left - 4;
  const detailsElementLeftValue = eventElementLeftEdge - detailsElementCoordinates.width;

  // Add dataset value
  calendarEventDetails.dataset.direction = 'openLeft';

  // Add right-pointing arrow
  addArrowElement(calendarEventDetails, 'right');

  // Handle left & right opening of the details element and handle potential bottom viewport overflow
  handleLeftRightPositioning(eventElementsObject, detailsElementLeftValue);
}


function openDetailsElementRight(eventElementsObject) {
  const { calendarEventDetails, positionTargetCoordinates } = eventElementsObject;

  // Disable transition temporarily
  calendarEventDetails.style.transition = 'transform 0s, opacity 0.3s';

  // Calculate the left property of the details element from its distance to the event element
  const detailsElementLeftValue = positionTargetCoordinates.right + 4;

  // Add dataset value
  calendarEventDetails.dataset.direction = 'openRight';

  // Add left-pointing arrow
  addArrowElement(calendarEventDetails, 'left');

  // Handle left & right opening of the details element and handle potential bottom viewport overflow
  handleLeftRightPositioning(eventElementsObject, detailsElementLeftValue);
}


// Calculates whether calendarEventDetails overflows bottom of broweser viewport and vertically repositions it accordingly.
// Realigns arrow element to keep it centered vertically against target event element.
// Calculates horizontal and vertical 'transform' values to position calendarEventDetails during its open animation (see animateOpenPosition).

function handleLeftRightPositioning(eventElementsObject, detailsElementLeftValue) {
  const {
    calendarEventDetails,
    positionTargetCoordinates,
    detailsElementCoordinates
  } = eventElementsObject;

  // Get vertical center coordinate for event element
  const eventElementCenterY = positionTargetCoordinates.top + positionTargetCoordinates.height / 2;

  // Divide details element height by half and add measurement to eventElementCenterY
  const detailsElementBottom = eventElementCenterY + detailsElementCoordinates.height / 2;
  const isOverflowingBottom = detailsElementBottom > window.innerHeight - 3; // Check if measurement overflows window

  // Add dataset flag to details element if it overflows viewport bottom on load
  if (isOverflowingBottom) calendarEventDetails.dataset.isOverflowingBottom = 'true';

  // Set translateX and translateY values based on open direction and bottom viewport overflow  
  const transformXValue = calendarEventDetails.dataset.direction === 'openRight' ? '8px' : '-8px';
  const transformYValue = calendarEventDetails.dataset.isOverflowingBottom === 'true' ? '0px' : '-50%';

  if (isOverflowingBottom) {
    // Use 'bottom' value instead of top if element overflows viewport and set left value
    calendarEventDetails.style.bottom = `2px`;
    calendarEventDetails.style.left = `${detailsElementLeftValue}px`;
    calendarEventDetails.style.transform = 'translate3d(0px, 0px, 0px)';

    // Force a reflow
    calendarEventDetails.offsetHeight;

    // Realign arrow with the event element
    realignArrowElement(eventElementsObject, detailsElementBottom);

    // Animate open position
    requestAnimationFrame(() => {
      animateOpenPosition(calendarEventDetails, transformXValue, transformYValue);
    });

  } else {

    // Set position and 'transform' values
    calendarEventDetails.style.top = `${eventElementCenterY + 0.5}px`;
    calendarEventDetails.style.left = `${detailsElementLeftValue}px`;
    calendarEventDetails.style.transform = 'translate3d(0px, -50%, 0px)';
    
    // Force a reflow
    calendarEventDetails.offsetHeight;

    // Animate open position
    requestAnimationFrame(() => {
      animateOpenPosition(calendarEventDetails, transformXValue, transformYValue);
    });
  }
}


// Takes X and Y position values and uses them to position / animate calendarEventDetails as it opens.
// Viewport overflow (if any) is offset in the Y value.
// 'transition' value is restored prior to 'transform: translate3d' update to ensure smooth animation.

function animateOpenPosition(calendarEventDetails, transformXValue, transformYValue) {
  calendarEventDetails.style.transition = 'transform 0.3s, opacity 0.3s';
  calendarEventDetails.style.transform = `translate3d(${transformXValue}, ${transformYValue}, 0px)`;
}



// ===============================================
//  Handle Details Element Up & Down Open
// ===============================================

// Calculates center of target event element and uses it to horizontally center calendarEventDetails against it.
// Initially positions calendarEventDetails against the top or bottom of event element and then animates 6px or -6px (depending on open direction).

function openDetailsElementDown(eventElementsObject) {
  const { calendarEventDetails, positionTargetCoordinates, detailsElementCoordinates } = eventElementsObject;
  // Add dataset value
  calendarEventDetails.dataset.direction = 'openDown';

  // Get measurements from event element and details element
  const eventElementBottomEdge = positionTargetCoordinates.bottom;
  const eventElementCenterX = positionTargetCoordinates.left + positionTargetCoordinates.width / 2;
  const detailsElementWidth = detailsElementCoordinates.width;

  // Center horizontally
  const centerHorizontally = eventElementCenterX - (detailsElementWidth / 2);

  // Set initial position (before animation)
  calendarEventDetails.style.top = `${eventElementBottomEdge + 12}px`;
  calendarEventDetails.style.left = `${centerHorizontally}px`;

  // Add up-pointing arrow
  addArrowElement(calendarEventDetails, 'up');

  // Animate opening position
  requestAnimationFrame(() => {
    calendarEventDetails.style.transform = 'translate3d(0px, 6px, 0px)', 10;
  });
}


function openDetailsElementUp(eventElementsObject) {
  const { calendarEventDetails, positionTargetCoordinates, detailsElementCoordinates } = eventElementsObject;
  // Add dataset value
  calendarEventDetails.dataset.direction = 'openUp';

  // Get measurements
  const eventElementTopEdge = positionTargetCoordinates.top;
  const eventElementCenterX = positionTargetCoordinates.left + positionTargetCoordinates.width / 2;
  const detailsElementWidth = detailsElementCoordinates.width;
  const detailsElementHeight = detailsElementCoordinates.height;

  // Center horizontally
  const centerHorizontally = eventElementCenterX - (detailsElementWidth / 2);

  // Set initial position (before animation)
  calendarEventDetails.style.top = `${eventElementTopEdge - detailsElementHeight - 8}px`;
  calendarEventDetails.style.left = `${centerHorizontally}px`;

  // Add down-pointing arrow
  addArrowElement(calendarEventDetails, 'down');

  // Animate opening position
  requestAnimationFrame(() => {
    calendarEventDetails.style.transform = 'translate3d(0px, -6px, 0px)';
  });
}



// ===============================================
//  Reset Details Element Position
// ===============================================

// Resets the position of the details element back to where it was before the animation.

function resetDetailsElementPosition(calendarEventDetails) {
  const { dateChanged, isDragged, direction: openDirection } = calendarEventDetails.dataset;

  // Reset details element transition values to default before it is removed
  calendarEventDetails.style.transition = 'transform 0.3s, opacity 0.3s';

  // Do not run if date has been changed, or details element has been dragged from its original position
  if (!dateChanged && !isDragged) {

    if (openDirection === 'openRight' || openDirection === 'openLeft') {
      // Reset translate3d value to default
      let xAxis = calendarEventDetails.dataset.isOverflowingBottom ? '0' : '-50%';
      calendarEventDetails.style.transform = `translate3d(0px, ${xAxis}, 0px)`;
    } 

    else if (openDirection === 'openDown' || openDirection === 'openUp') {
      // Reset translate3d value to default
      calendarEventDetails.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  }
}



// ===============================================
//  Create Window Click Handler
// ===============================================

// Both return click and key handler functions that are added to the eventHandlers object to allow both listeners to be removed when either one is used.
// Both call 'resetDetailsElementPosition' to reset calendarEventDetails to initial position before it was opened.

function createWindowClickHandler(calendarEventDetails, eventHandlers) {
  return function windowClickHandler(e) {
    if (!e.target.closest('.calendar-event-details')) {
      resetDetailsElementPosition(calendarEventDetails);

      // Remove event listeners after click
      window.removeEventListener('click', eventHandlers.windowClickHandler);
      window.removeEventListener('keydown', eventHandlers.windowEnterKeyHandler);
    }
  }
}

function createWindowEnterKeyHandler(calendarEventDetails, eventHandlers) {
  return function windowEnterKeyHandler(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      resetDetailsElementPosition(calendarEventDetails);

      // Remove event listeners after Enter key press
      window.removeEventListener('click', eventHandlers.windowClickHandler);
      window.removeEventListener('keydown', eventHandlers.windowEnterKeyHandler);
    }
  }
}



export {
  getSingleDateDetailsPosition,
  getMutlipleDateDetailsPosition,
  getTargetEventElement,
  openDetailsElementLeft,
  openDetailsElementRight,
  openDetailsElementDown,
  openDetailsElementUp
}