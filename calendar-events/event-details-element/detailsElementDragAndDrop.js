import { removeArrowElement } from "./arrowElementFunctions.js";
import { addSvgIcon } from "../../../icons/icons.js";


// ================================================
//  Drag Position Change with Final Click Handling
// ================================================


let currentElement = null; // Placeholder variable for details element
let isDragging = false; // Flag to check if element is being dragged
let calendarContainer = null;

// Variables to hold the initial element coordinates
let startX = 0;
let startY = 0;

// Variables to hold X & Y offset values
let offsetX = 0;
let offsetY = 0;

// Minimum distance to start dragging
const DRAG_THRESHOLD = 5;



// 'mousedown' listener checks for initial mouse position and saves to startX and startY variables.
// Checks for calendarEventDetails and assigns it to currentElement variable.
// Gets calendarEventDetails element coordinates and assigns its left and top values to offsetX and offsetY.
// Selects calendar contents div and assigns it to calendarContainer variable to add details element placeholder later.

window.addEventListener("mousedown", (e) => {
  if (e.target.closest('.calendar-event-details')) {
    // Store the initial mouse position
    startX = e.clientX;
    startY = e.clientY;

    // Initialize dragging setup
    currentElement = e.target.closest('.calendar-event-details');
    const rect = currentElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Select calendar container for placeholder
    calendarContainer = document.querySelector('.calendar-contents');
  }
});



// 'mousemove' listener checks that cursor is on the currentElement (calendarEventDetails) and that the dragging state is not active.
// Checks for DRAG_THRESHOLD (5px) and updates isDragging flag to 'true'.
// // Updates position values of currentElement.
// Adds header to currentElement, adds to placeholder and removes pointer arrow.

window.addEventListener("mousemove", (e) => {
  if (currentElement && !isDragging) {
    // Get dragging distance, using Math.abs() to ensure positive value
    const distanceX = Math.abs(e.clientX - startX);
    const distanceY = Math.abs(e.clientY - startY);

    // Check if the drag distance exceeds the threshold
    if (distanceX > DRAG_THRESHOLD || distanceY > DRAG_THRESHOLD) {
      isDragging = true; // Activate dragging mode
      currentElement.dataset.isDragged = "true"; // Add dataset flag

      if (!currentElement.dataset.hasHeader) {
        // Add header to details element if it does not already exist
        addDetailsElementHeader(currentElement);

        // Create placeholder element for details element in calendar container
        createPlaceholder(currentElement, calendarContainer);

        // Remove arrow when date changes
        removeArrowElement(currentElement);
      }
    }
  }

  if (currentElement && isDragging) {
    // Update the position of the dragged element
    currentElement.style.transform = "initial";
    currentElement.style.transition = "none"; // Disable transition initially
    currentElement.style.bottom = 'initial'; // Reset bottom value potentially given on last row
    currentElement.style.left = `${e.clientX - offsetX}px`;
    currentElement.style.top = `${e.clientY - offsetY}px`;
  }
});



// 'mouseup' listener resets isDragging flag to 'false' and resets currentElement to 'null'.

window.addEventListener("mouseup", () => {
  if (isDragging) isDragging = false; // Reset dragging state
  currentElement = null; // Reset current element
});



// ================================================
//  Add Details Element Header
// ================================================

// Adds header to calendarEventDetails element and animates height as it appears.
// Adds fade-in effect for header contents.

function addDetailsElementHeader(calendarEventDetails) {
  // Add dataset flag
  calendarEventDetails.dataset.hasHeader = 'true';

  // Create header element
  const detailsHeaderElement = createHeaderElement(calendarEventDetails);

  // Animate the height of the header
  animateHeaderHeight(detailsHeaderElement);

  // Select close button and info label from header
  const detailsCloseButton = detailsHeaderElement.querySelector('.details-close-button');
  const detailsInfoLabel = detailsHeaderElement.querySelector('.details-info-label');

  // Fade in header content when full height is reached
  fadeInHeaderContent(detailsCloseButton, detailsInfoLabel);

  // Close button event listener
  detailsCloseButton.addEventListener('click', () => {
    closeDetailsElement(calendarEventDetails);
  });
}


function createHeaderElement(calendarEventDetails) {
  // Create element and add inner content
  const detailsHeaderElement = document.createElement('div');
  detailsHeaderElement.classList.add('details-element-header');

  // Create close button element
  const closeButtonSpan = document.createElement('span');
  closeButtonSpan.classList.add('details-close-button');
  
  // Create SVG and add to the button (Parameters are icon, container, strokeColor, fillColor)
  addSvgIcon('closeButton', closeButtonSpan, '#cbcbcc', 'none');

  // Add the "Info" label
  const infoLabelSpan = document.createElement('span');
  infoLabelSpan.classList.add('details-info-label');
  infoLabelSpan.textContent = 'Info';

  // Append the button and label to the header element
  detailsHeaderElement.appendChild(closeButtonSpan);
  detailsHeaderElement.appendChild(infoLabelSpan);

  // Prepend the header element at the beginning
  calendarEventDetails.prepend(detailsHeaderElement);

  return detailsHeaderElement;
}


function animateHeaderHeight(detailsHeaderElement) {
  detailsHeaderElement.style.height = '0px'; // Set initial height
  setTimeout(() => {
    detailsHeaderElement.style.transition = "all 0.3s"; 
    detailsHeaderElement.style.height = '26px';
  }, 100); // Delay to allow the initial render
}


function fadeInHeaderContent(detailsCloseButton, detailsInfoLabel) {
  // Set initial opacity and transition properties
  detailsCloseButton.style.opacity = '0';
  detailsInfoLabel.style.opacity = '0';
  detailsCloseButton.style.transition = "opacity 0.5s";
  detailsInfoLabel.style.transition = "opacity 0.5s";

  // Delay the opacity change
  setTimeout(() => {
    detailsCloseButton.style.opacity = '1';
    detailsInfoLabel.style.opacity = '1';
  }, 300);
}


function closeDetailsElement(calendarEventDetails) {
  // Add transition value and remove 'show' class from details element
  calendarEventDetails.style.transition = "all 0.3s";
  calendarEventDetails.classList.remove('show');

  // Remove 'no-click' class from all calendar event buttons
  const allCalendarEventButton = document.querySelectorAll('.calendar-event-button');
  allCalendarEventButton.forEach(button => {
    button.classList.remove('no-click');
  });

  // Delete placeholder and child elements
  deletePlaceholder(calendarEventDetails);
}



// ===============================================
//  Create / Delete Placeholder
// ===============================================

// Creates temporary placeholder (separate from regular details element placeholder).

function createPlaceholder(calendarEventDetails, calendarContainer) {
  // Check if placeholder already exists
  let placeholder = calendarContainer.querySelector('.temporary-details-placeholder');

  // If placeholder does not exist, create one and append to calendar container
  if (!placeholder) {
    placeholder = document.createElement('div');
    placeholder.classList.add('temporary-details-placeholder');
    calendarContainer.appendChild(placeholder);
  }

  // Append details element to placeholder container
  if (!placeholder.contains(calendarEventDetails)) {
    placeholder.appendChild(calendarEventDetails);
  }
}


// Deletes placeholder when empty.

export function deletePlaceholder(calendarEventDetails) {
  // Check if placeholder already exists
  const placeholder = document.querySelector('.temporary-details-placeholder');

  // Remove calendarEventDetails from the placeholder if it exists
  if (placeholder && placeholder.contains(calendarEventDetails)) {
    setTimeout(() => {
      placeholder.removeChild(calendarEventDetails);
      
      // Remove the placeholder itself if it has no children
      if (placeholder.children.length === 0) {
        placeholder.remove();
      }
    }, 300);
  }
}