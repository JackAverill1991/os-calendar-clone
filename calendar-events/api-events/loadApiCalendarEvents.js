import { getSingleCategoryFromLocalStorage } from "../../calendar-categories/eventCategoriesLocalStorage.js";


// ===============================================
//  Configure API Events
// ===============================================

// Creates map of date elements and finds matching events with matching dates in API data.
// Uses API data to create clickable event elements.

function loadApiEventElements(apiData, classElement) {
  // Select dateElements from relevant calendar class element
  const dateElements = classElement.querySelectorAll('.date-element');

  // Create object for each date element containing HTML element and date data attributes 
  const dateObjectsMap = createDateObjectsMap(dateElements);

  // Create array of API events with duplicate event titles filtered out
  const uniqueApiEvents = removeDuplicateEvents(apiData);

  // Find matching dateElements for API events and create calendarEventElements
  findApiEventDates(uniqueApiEvents, dateObjectsMap);
}


// Create object for each dateElement and add to dateElementMap
function createDateObjectsMap(dateElements) {
  return Array.from(dateElements).map(element => ({
    dataDate: parseInt(element.getAttribute('data-date')),
    dataMonth: parseInt(element.getAttribute('data-month')),
    dataYear: parseInt(element.getAttribute('data-year')),
    eventContainer: element.querySelector('.calendar-event-container')
  }));
}



// ===============================================
//  Remove Duplicate Events
// ===============================================

// Duplicate events are removed from the API array of objects (some have the same name).

function removeDuplicateEvents(apiData) {
  // Create a new array with only unique event names
  const uniqueEvents = [];
  const namesSeen = new Set();

  for (const event of apiData.response.holidays) {
    if (!namesSeen.has(event.name)) {
      uniqueEvents.push(event);
      namesSeen.add(event.name);
    }
  }

  return uniqueEvents;
}



// ===============================================
//  Find API Event Dates
// ===============================================

// Find events that match each date element and create event element.

function findApiEventDates(uniqueApiEvents, dateObjectsMap) {
  // Loop through API data
  for (const event of uniqueApiEvents) {
    const { date: { datetime: { day, month, year } } } = event;

    // Find matching dateElements in dateElementMap
    const matchingDateElement = dateObjectsMap.find(element => (
      element.dataDate === day &&
      element.dataMonth === month &&
      element.dataYear === year
    ));

    // Create event element
    if (matchingDateElement) {
      const { name } = event;

      // Create calendar event element for each API event
      createApiEventElement(matchingDateElement, name);
    }
  }
}



// ===============================================
//  API Calendar Event Elements
// ===============================================

// Event name is given instead of unique ID in order to include API events in grouped events for dynamic layouts in 'monthEventPositioning.js'.

function createApiEventElement(matchingDateElement, name) {
  // Create calendar event element and append to event container
  const calendarEventElement = document.createElement('div');
  calendarEventElement.classList.add('calendar-event-element', 'api-event');
  calendarEventElement.dataset.categoryId = 'apiCategoryObject'; // Add calendar category dataset value

  // Add calendar button and details container
  calendarEventElement.innerHTML = `
    <span class="calendar-event-button" data-prevent-remove-highlight="false">${name}</span>
  `; // Assign 'preventRemoveHighlight' dataset value to allow highlight removal on window click

  // Use event name instead of unique ID
  calendarEventElement.dataset.eventId = name;

  // Append calendar event element to matching date
  matchingDateElement.eventContainer.appendChild(calendarEventElement);

  // Get API category from local storage array
  const apiCalendarCategory = getSingleCategoryFromLocalStorage('apiCategoryObject');

  // Hide / show calendar event elements on load depending on API category visibility property
  setApiCategoryVisibility(calendarEventElement, apiCalendarCategory);

  // Add class and dataset values from API category
  handleApiCategoryColor(calendarEventElement, apiCalendarCategory);

  return calendarEventElement;
}



// ===============================================
//  Set API Category Visibility
// ===============================================

// Hide API category on load if category object visibility is set to 'false'.

function setApiCategoryVisibility(calendarEventElement, apiCalendarCategory) {  
  // Add 'hide' class to event elements if matching category has falsy visible property value
  if (!apiCalendarCategory.visible) {
    calendarEventElement.classList.add('hide');
  }
}



// ===============================================
//  Handle API Category Color
// ===============================================

// Change the color of the API event elements.

function handleApiCategoryColor(calendarEventElement, apiCalendarCategory) {
  const { colorPalette: { name, colors: { pastel } } } = apiCalendarCategory;

  // Select calendar event button
  const calendarEventButton = calendarEventElement.querySelector('.calendar-event-button');

  // Add category pastel color on load
  calendarEventButton.style.backgroundColor = `#${pastel}`;

  // Add category colorPalette name as dataset so highlight color can be added on click
  calendarEventButton.dataset.colorPalette = name;
}



export {
  loadApiEventElements,
  removeDuplicateEvents
}