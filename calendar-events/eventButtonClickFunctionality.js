import { eventCategoryColorsObject } from "../utils.js";


// ===============================================
//  Handle Event Button Click
// ===============================================

// Event listeners on window and classElement check for calendar event buttons.
// Delegation is used to target buttons dynamically added after page load.

function handleEventButtonClick(classElement) {
  // Exit if listeners are already added
  if (classElement.dataset.listenersAdded === 'true') return;

  // Handle single click functionality for highlights and colors
  classElement.addEventListener('mousedown', (e) => handleClick(e, classElement));

  // Remove highlight class (if any) from buttons when window is clicked
  window.addEventListener('click', (e) => handleWindowClick(e, classElement));

  // Mark listeners as added
  classElement.dataset.listenersAdded = 'true';
}


function handleClick(e, classElement) {
  // Select list of calendar buttons (selecting these with click listener includes those added after page load)
  const calendarEventButtons = classElement.querySelectorAll('.calendar-event-button');

  // Target calendar event button
  if (e.target.closest('.calendar-event-button')) {
    const calendarEventButton = e.target.closest('.calendar-event-button');

    // Clear highlight color / class from all event buttons
    removeAllHighlights(calendarEventButtons, classElement);

    // Add highlight color to multiple date event element buttons on click
    addDateButtonHighlight(calendarEventButton, classElement);
  }
}


function handleWindowClick(e, classElement) {
  const calendarEventButtons = classElement.querySelectorAll('.calendar-event-button');
  const hasHighlight = Array.from(calendarEventButtons).some(button => button.classList.contains('highlight'));

  // Check if any buttons have highlight before running code to avoid unnecessary work
  if (hasHighlight && // Check if the clicked target is neither a calendar button nor within the sidebar
    !e.target.closest('.calendar-event-button') &&
    !e.target.closest('.sidebar') &&
    !e.target.closest('.calendar-event-details')) {

    // Clear highlight color / class from all event buttons
    removeAllHighlights(calendarEventButtons, classElement);
  }
}



// ===============================================
//  Manage Highlights
// ===============================================

// Clears highlight color / class from all event buttons and resets color to pastel.
// Function is run preemptively when any button or the window is clicked.

function removeAllHighlights(calendarEventButtons, classElement) {
  calendarEventButtons.forEach(button => {
    if (button.dataset.preventRemoveHighlight === 'false') {
      button.classList.remove('highlight');
      handleColors(button);
    }
  });

  function handleColors(button) {
    // Get matching category color object from calendar button dataset value
    const datasetColor = button.dataset.colorPalette;

    // If dataset color exists on button, find matching pastel property in category colors object and assign
    if (datasetColor) {
      const matchingColorObject = eventCategoryColorsObject[datasetColor];
      button.style.backgroundColor = `#${matchingColorObject.pastel}`;
    }
  }
}


// Handles 'highlight' classes for both single and mutliple date events.
// Uses datasets to select multiple date event elements, adding highlight to all buttons with matching dataset ID.

function addDateButtonHighlight(calendarEventButton, classElement) {
  if (calendarEventButton.parentElement.classList.contains('multiple-day-event')) {

    // Get eventId dataset and select all other event elements with matching value
    const eventId = calendarEventButton.closest('.calendar-event-element').dataset.eventId;
    const matchingIdElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`);
    
    matchingIdElements.forEach(element => {
      // Get dataset color for each matching button
      const calendarEventButton = element.querySelector('.calendar-event-button');
      const datasetColor = calendarEventButton.dataset.colorPalette;

      // Handle button styles based on dataset properties
      setEventButtonStyles(datasetColor, calendarEventButton, classElement);
    });

  } else {
    // Get matching category color object from calendar button dataset value
    const datasetColor = calendarEventButton.dataset.colorPalette;

    // Handle button styles based on dataset properties
    setEventButtonStyles(datasetColor, calendarEventButton, classElement);
  }
}


// Adds styles to calendar buttons based on which calendar view is being used.

function setEventButtonStyles(datasetColor, calendarEventButton, classElement) {
  // If dataset color exists on button, assign matching highlight property from category colors object
  if (datasetColor) {
    const matchingColorObject = eventCategoryColorsObject[datasetColor];
    calendarEventButton.style.backgroundColor = `#${matchingColorObject.highlight}`;
  }

  // Add highlight class to month calendar buttons that don't require text color
  calendarEventButton.classList.add('highlight');
}



export {
  handleEventButtonClick,
  removeAllHighlights
}