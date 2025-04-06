// ===============================================
//  Vertically Center On Expand
// ===============================================

// Keeps the details element centered vertically when the date and time details expands.

function verticallyCenterOnExpand(eventElementsObject, eventElementCoordinates) {
  const { calendarEventDetails } = eventElementsObject;

  // Get vertical center measurement from event element
  const eventElementCenterY = eventElementCoordinates.top + eventElementCoordinates.height / 2;

  // Disable transition temporarily
  calendarEventDetails.style.transition = 'all 0s';

  // Force a repaint before applying position
  calendarEventDetails.offsetHeight;

  // Set details element height value to eventElementCenterY, adding an additional .5px for accuracy
  calendarEventDetails.style.top = `${eventElementCenterY + 0.5}px`;

  // Apply translate3d Y values of -50% to offset top value and center element vertically (maintain predetermined X values)
  if (calendarEventDetails.dataset.direction === 'openRight') {
    calendarEventDetails.style.transform = `translate3d(8px, -50%, 0px)`;
  } 
  else if (calendarEventDetails.dataset.direction === 'openLeft') {
    calendarEventDetails.style.transform = `translate3d(-8px, -50%, 0px)`;
  }
}



// ===============================================
//  Handle Details Element Expand On Upward Open
// ===============================================

// Handls the date / time details element expansion when details element was loaded in an upward direction from bottom event row.
// Switches position anchor of the details element from the top to the bottom.
// Allows the expand to happen upwards rather than downwards which is default.
// Only applies to multiple date events.

function handleOpenUpDetailsExpand(eventElementsObject, eventElementCoordinates) {
  const { calendarEventDetails } = eventElementsObject;

  // Get measurement from top of the event element
  const eventElementTop = window.innerHeight - eventElementCoordinates.top;

  // Reset 'top' to initial and use 'eventElementTop' to set bottom value
  calendarEventDetails.style.top = 'initial';
  calendarEventDetails.style.bottom = `${eventElementTop + 8}px`;
}



// ===============================================
//  Prevent Expand Overflow
// ===============================================

// Prevents downward opening details element from overflowing viewport when clicking the dateTimeSummary element and opening menu.
// Switches the details element so that it opens upwards instead.
// Changes arrow to downward direction.

function preventExpandOverflow(eventElementsObject) {
  const { calendarEventDetails, positionTargetCoordinates } = eventElementsObject;

  // Get bounding rectangles of the element and its parent container
  const eventDetailsRect = calendarEventDetails.getBoundingClientRect();

  // Calculate the bottom edge relative to the viewport
  const eventDetailsBottom = eventDetailsRect.bottom;

  // Define the maximum allowable bottom position (3px from viewport bottom)
  const maxBottomBoundary = window.innerHeight - 3;

  // Check if the element is overflowing the viewport
  const isOverflowingBottom = eventDetailsBottom > maxBottomBoundary;

  if (isOverflowingBottom) {
    // Get top measurement from event element and calculate new bottom property for details element
    const eventElementTopEdge = positionTargetCoordinates.top;
    const detailsBottomPosition = window.innerHeight - eventElementTopEdge;
    
    // Reset 'top' property to initial and add new 'bottom' property to details element
    calendarEventDetails.style.top = 'initial';
    calendarEventDetails.style.bottom = `${detailsBottomPosition + 8}px`;

    // Temporarily set 'transition' property to 0s to avoid layout bug and update 'translate3d' property
    calendarEventDetails.style.transition = 'all 0s';
    calendarEventDetails.style.transform = 'translate3d(0px, -6px, 0px)';

    // Update arrow position to bottom of details element
    const arrowElement = calendarEventDetails.querySelector('.arrow-element');
    arrowElement.style.transition = 'initial';
    arrowElement.style.top = 'calc(100% - 6px)';
    arrowElement.style.transform = 'translateX(calc(-50% + 1.5px)) rotate(-45deg)';
  }
}



export {
  preventExpandOverflow,
  handleOpenUpDetailsExpand,
  verticallyCenterOnExpand
}