import { createCalendarEventElement } from "./addNewCalendarEvent.js";
import { handleEventObjectValues } from "./handleEventObjectValues.js";
import { addEventElementAttributes, setCalendarButtonInfo } from "./loadCalendarEvents.js";


// ===============================================
//  Dynamically Update Event Dates
// ===============================================

// Separates logic for both single and multiple date events where dates have changed and rebuilds with new ones from updated date array.
// Appends new event elements to containers and removes all old ones.
// Updates event info in user event object.

export function dynamicallyUpdateEventDates(userEventObject, eventDetailsElements) {
  const { calendarEventDetails, classElement } = eventDetailsElements;
  const { eventId, dates: { datesArray } } = userEventObject;

  // Create array of all event elements that have the same eventId as userEventObject
  const matchingEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`);
  const eventElementsArray = Array.from(matchingEventElements);

  // Return separate arrays containing matching date and event elements for items in datesArray
  const dateAndEventElementArrays = getDateAndEventElements(datesArray, userEventObject);
  const { newDateElementsArray, newEventElementsArray } = dateAndEventElementArrays;

  // Group elements together in object
  const eventElementsObject = createEventElementsObject(
    newDateElementsArray, newEventElementsArray, calendarEventDetails, classElement
  );

  if (newEventElementsArray.length > 0) {
    // Handle differences between single and multiple date events
    handleSingleAndMutlipleDateEvents(newDateElementsArray, newEventElementsArray, userEventObject);

    // Append all new calendarEventElements to eventContainers
    appendEventElements(newDateElementsArray, newEventElementsArray);

    // Update userEventObject values (dates and event details form fields)
    handleEventObjectValues(eventElementsObject, userEventObject);
  }

  // Add dateChanged dataset flag
  calendarEventDetails.dataset.dateChanged = 'true';

  // Remove original calendarEventElements
  eventElementsArray.forEach(element => element.remove());
}


function createEventElementsObject(newDateElementsArray, newEventElementsArray, calendarEventDetails, classElement) {
  return {
    dateElement: newDateElementsArray[0],
    calendarEventElement: newEventElementsArray[0],
    calendarEventDetails,
    classElement,
  }
}



// ===============================================
//  Get Date And Event Elements
// ===============================================

// Retrieves matching date elements and event elements from the datesArray in the user event object and returns as arrays.
// Adds event ID as a dataset property to event elements.

function getDateAndEventElements(datesArray, userEventObject) {
  // Create object map of all dateElements with data attributes
  const dateElements = document.querySelectorAll('.date-element');
  const dateElementMap = Array.from(dateElements);

  // Empty arrays to store dateElements and new calendarEventElements
  let newDateElementsArray = [];
  let newEventElementsArray = [];

  // Loop through datesArray
  for (const object of datesArray) {
    // Get matching dateElements for datesArray objects from dateElementMap and push to newEventElementsArray
    const matchingDateElement = getMatchingDateElements(object, dateElementMap);
    if (matchingDateElement !== undefined) { newDateElementsArray.push(matchingDateElement) };

    // Create new calendar event elements based on new datesArray and push to newEventElementsArray
    const newCalendarEventElement = createCalendarEventElement(datesArray, true);
    if (matchingDateElement !== undefined) { newEventElementsArray.push(newCalendarEventElement) };

    // Set eventId as data attribute to every calendarEventElement
    newCalendarEventElement.dataset.eventId = userEventObject.eventId;
  }

  return { newDateElementsArray, newEventElementsArray };
}


function getMatchingDateElements(object, dateElementMap) {
  return dateElementMap.find(dateElement => (
    Number(dateElement.dataset.year) === object.year &&
    Number(dateElement.dataset.month) === object.month &&
    Number(dateElement.dataset.date) === object.date
  ));
}



// ===============================================
//  Handle Single And Multiple Date Events
// ===============================================

// Categorizes events based on single or multiple date ranges and add event times accordingly.

function handleSingleAndMutlipleDateEvents(newDateElementsArray, newEventElementsArray, userEventObject) {
  const { dates: { datesArray } } = userEventObject;

  newDateElementsArray.forEach((element, index) => {
    if (element && datesArray.length > 1) {
      // Add class to first and last event element and handle differences in event name / time info placement
      addEventElementAttributes(element, newEventElementsArray[index], userEventObject);
    
    } else {
      // Add name and start time to single-date event elements (Handled in addEventElementAttributes above for multiple-date elements)
      setCalendarButtonInfo(newEventElementsArray[0], userEventObject, 'first-element');
    }
  });
}



// ===============================================
//  Append Event Elements
// ===============================================

// Append all new calendarEventElements to eventContainers.

function appendEventElements(newDateElementsArray, newEventElementsArray) {
  newDateElementsArray.forEach((dateElement, index) => {
    const eventContainer = dateElement.querySelector('.calendar-event-container');
    eventContainer.appendChild(newEventElementsArray[index]);
  });
}