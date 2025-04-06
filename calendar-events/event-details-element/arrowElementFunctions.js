// ===============================================
//  Add Arrow Element
// ===============================================

// Adds a single directional arrow inside calendar event details pop-up element
// Assigns a direction-specific class to ensure arrow points in the right direction. 
// Appends new arrow to the arrow container.

function addArrowElement(calendarEventDetails, direction) {
  // Select arrow container
  const arrowContainer = calendarEventDetails.querySelector('.arrow-container');

  // Create new arrow element
  const arrowElement = document.createElement('span');
  arrowElement.classList.add('arrow-element');

  // Add direction class
  if (direction === 'left') {
    arrowElement.classList.add('direction-left');
  
  } else if (direction === 'right') {
    arrowElement.classList.add('direction-right');
  
  } else if (direction === 'up') {
    arrowElement.classList.add('direction-up');
  
  } else if (direction === 'down') {
    arrowElement.classList.add('direction-down');
  }

  // Append to container
  arrowContainer.appendChild(arrowElement);
}



// ===============================================
//  Re-align Arrow Element
// ===============================================

// Realigns arrow with the target position point if the pop-up window overflows the bottom of the viewport and needs to be moved higher.

function realignArrowElement(eventElementsObject) {
  const { calendarEventDetails, positionTargetCoordinates } = eventElementsObject;

  // Get center point measurement of event element
  const eventElementCenterY = positionTargetCoordinates.bottom + positionTargetCoordinates.height / 2;

  // Select arrow element
  const arrowElement = calendarEventDetails.querySelector('.arrow-element');

  // Reset 'top' value to default and subtract 'eventElementCenterY' from the viewport to get 'bottom' value
  arrowElement.style.top = 'initial';
  arrowElement.style.bottom = `${window.innerHeight - eventElementCenterY + 0.5}px`; // Add half a px for accuracy

  if (calendarEventDetails.classList.contains('year-calendar')) {
    arrowElement.style.bottom = `${window.innerHeight - eventElementCenterY + 8}px`; // Add 7px for accuracy on year display
  }
}



// ===============================================
//  Remove Arrow Element
// ===============================================

// Removes the arrow element in cases where the calendar details element is moved, or the event date is changed.

function removeArrowElement(calendarEventDetails) {
  // Select arrow container and check for arrow element
  const arrowContainer = calendarEventDetails.querySelector('.arrow-container');
  const arrowElement = arrowContainer.querySelector('.arrow-element');

  if (arrowElement) {
    // Delay the opacity change to ensure transition is applied
    requestAnimationFrame(() => arrowElement.style.opacity = '0');

    // Remove element from container
    setTimeout(() => arrowElement.remove(), 200);
  }
}



export {
  addArrowElement,
  realignArrowElement,
  removeArrowElement
}