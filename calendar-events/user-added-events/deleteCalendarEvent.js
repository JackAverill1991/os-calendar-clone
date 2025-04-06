import { removeEventFromLocalStorage } from "../../calendar-events/user-added-events/userEventsLocalStorage.js";
import { monthEventPositioning } from "../../calendar-events/monthEventPositioning.js";
import { updateSearchResults } from "../../search-form/searchbarFunctionality.js";
import { deletePlaceholder } from "../event-details-element/detailsElementDragAndDrop.js";


// ===============================================
//  Delete Calendar Event
// ===============================================

// Delete events when the 'trash bin' button is pressed on the details element.
// Removes event elements from calendar and deletes event object from local storage.

export function deleteCalendarEvent(eventElementsObject) {
  const { deleteButton, calendarEventDetails, calendarEventElement, classElement } = eventElementsObject;

  deleteButton.addEventListener('click', () => {
    // Get event ID and dataset year
    const eventId = calendarEventElement.dataset.eventId;

    // Find any other event elements that share the eventId of the one clicked
    const matchingEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`);

    // Get dataset year from parent date element of first matching event element
    const dataYear = matchingEventElements[0].closest('.date-element').getAttribute('data-year');

    // Hide details element and delete temporary placeholder
    hideDetailsElement(calendarEventDetails);

    // Set timeout so functions are called after details window closes
    setTimeout(() => {
      // Remove all event elements and reposition layout
      handleEventElementRemoval(matchingEventElements, classElement)

      // Remove from local storage
      removeEventFromLocalStorage(eventId, dataYear);

      // Update search results element results if it is open
      updateSearchResults();
    }, 200);

    // Remove 'no-click' class from all calendar event buttons
    removeNoClickClass(classElement);    
  });
}


function handleEventElementRemoval(matchingEventElements, classElement) {
  if (matchingEventElements) matchingEventElements.forEach(element => element.remove());
  // Reshuffle event elements to fit grid layout
  monthEventPositioning(classElement, null);
}


function hideDetailsElement(calendarEventDetails) {
  calendarEventDetails.style.transition = 'all .3s';
  calendarEventDetails.classList.remove('show');

  // Delete temporary placeholder element if details element has been moved
  if (calendarEventDetails.dataset.isDragged) {
    deletePlaceholder(calendarEventDetails);
  }
}


function removeNoClickClass(classElement) {
  const allCalendarEventButton = classElement.querySelectorAll('.calendar-event-button');
  allCalendarEventButton.forEach(button => {
    button.classList.remove('no-click');
  });
}