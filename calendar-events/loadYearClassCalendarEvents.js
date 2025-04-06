import { getSingleDateDetailsPosition } from "../calendar-events/event-details-element/detailsElementPositioning.js";
import { getEventsFromLocalStorage } from "../calendar-events/user-added-events/userEventsLocalStorage.js";
import { getCategoriesFromLocalStorage } from "../calendar-categories/eventCategoriesLocalStorage.js";
import { formatDateAndTime } from "../utils.js";


// =============================================
//  Load Year Class Calendar Events
// =============================================

// Combines event data from API and user-added events and creates display of event titles and time / category information when user clicks a date in the year calendar view.

export function loadYearClassCalendarEvents(classElement, prevYearData, currentYearData, nextYearData) {
  const apiYearData = [prevYearData, currentYearData, nextYearData];
  const dateElements = classElement.querySelectorAll('.date-element');
  const detailsElementPlaceholder = document.querySelector('.details-element-placeholder');

  // Create object from all of the event / category data sources
  const calendarEventsDataObject = {
    uniqueApiEventsObject: findMatchingYearAPIEvents(apiYearData), // Create new version of apiYearData array with duplicate event titles removed
    matchingYearUserEvents: findMatchingYearUserEvents(dateElements), // Get list of displayed years and find matching user events from localStorage
  }

  // Create object containing DOM elements
  const eventElementsObject = {
    dateElements,
    classElement,
    detailsElementPlaceholder
  }

  dateElements.forEach(element => {
    element.addEventListener('click', (e) => {
      // Prevent date element listener from bubbling up to window
      e.stopPropagation();

      // Handle date element click
      handleDateElementClick(element, eventElementsObject, calendarEventsDataObject);
    });
  });
}


// Create new version of apiYearData nested array from above with duplicate event titles filtered out
function findMatchingYearAPIEvents(apiYearData) {
  const uniqueApiEventsObject = {};
  apiYearData.forEach(apiYear => removeDuplicateEvents(apiYear, uniqueApiEventsObject));

  return uniqueApiEventsObject;
}


// Get list of years from calendar display and find matching user events from localStorage
function findMatchingYearUserEvents(dateElements) {
  const yearsArray = Array.from(dateElements).map(element => element.dataset.year);
  const uniqueYearsArray = [...new Set(yearsArray)];

  // Get all events from relevant calendar year(s) in localStorage
  return getEventsFromLocalStorage(uniqueYearsArray);
}



// =============================================
//  Remove Duplicate API Events
// =============================================

// Duplicate events are removed from the API array of objects (some have the same name).

function removeDuplicateEvents(apiYear, uniqueApiEventsObject) {
  // Extract year from the first event
  const year = apiYear.response.holidays[0]?.date.datetime.year;

  if (!year) return; // Exit if there are no events

  // Create a new array with only unique event names
  const uniqueEvents = [];
  const namesSeen = new Set();

  // Loop through API array and push unique events to new array
  for (const event of apiYear.response.holidays) {
    if (!namesSeen.has(event.name)) {
      uniqueEvents.push(event);
      namesSeen.add(event.name);
    }
  }

  // Store the events in the object with the year as the key
  uniqueApiEventsObject[year] = uniqueEvents;
}



// =============================================
//  Handle Date Element Click
// =============================================

// Carry out functions when user clicks date element.

function handleDateElementClick(dateElement, eventElementsObject, calendarEventsDataObject) {
  // Get date dataset attributes of clicked element
  const dateAttributesObject = getDateAttributes(dateElement);

  // Create display element and add to placeholder container
  const calendarEventDetails = createEventDetailsElement(eventElementsObject);

  // Add elements to object
  eventElementsObject.dateElement = dateElement;
  eventElementsObject.positionTargetReference = dateElement; // Use as position reference point for details element
  eventElementsObject.calendarEventDetails = calendarEventDetails;

  // Create array from merged API and user-added events
  const mergedEventsArray =  mergeAPIandUserEvents(calendarEventsDataObject, dateAttributesObject);

  // Separate events by type (API or user-added)
  sortEventsByTime(mergedEventsArray);

  // Separate events by type (API or user-added) and build event elements
  separateAndBuildEventElements(mergedEventsArray, calendarEventDetails);

  // Add / remove 'no events' placeholder to event containers when category visibility leaves them empty
  handleEmptyContainers(calendarEventDetails);

  // Ensure event details element is postioned correctly in viewport
  getSingleDateDetailsPosition(eventElementsObject);

  // Add 'show' class to details element and disable date element click
  handleDetailsElementVisibility(eventElementsObject);

  // Add click and Enter key listeners to window
  windowEventListeners(eventElementsObject);
}


// Get date dataset attributes of clicked element
function getDateAttributes(dateElement) {
  return {
    dataYear: Number(dateElement.dataset.year),
    dataMonth: Number(dateElement.dataset.month),
    dataDate: Number(dateElement.dataset.date)
  }
}



// =============================================
//  Create Event Details Element
// =============================================

// Create pop-up details element to display event details and append to placeholder container.

function createEventDetailsElement(eventElementsObject) {
  const { detailsElementPlaceholder } = eventElementsObject;

  // Create details element and add class
  const calendarEventDetails = document.createElement('div');
  calendarEventDetails.classList.add('calendar-event-details', 'year-calendar');

  // Create arrow container for arrow element and add class
  const arrowContainer = document.createElement('div');
  arrowContainer.classList.add('arrow-container');

  // Append arrow container to details element
  calendarEventDetails.appendChild(arrowContainer);

  // Append element to placeholder container
  detailsElementPlaceholder.appendChild(calendarEventDetails);

  return calendarEventDetails;
}



// =============================================
//  Merge API & User Events
// =============================================

// Merge arrays of events (API & user-added) into a single array so that they can be re-ordered correctly for display.

function mergeAPIandUserEvents(calendarEventsDataObject, dateAttributesObject) {
  const { uniqueApiEventsObject, matchingYearUserEvents } = calendarEventsDataObject;

  // Get API data array from object for the matching year of clicked date element
  const matchingApiYear = uniqueApiEventsObject[dateAttributesObject.dataYear];

  // Get any existing API events for the specific date
  const filteredAPIEvents = getFilteredAPIEvents(matchingApiYear, dateAttributesObject);

  // Get any existing user-created events for the specific date
  const filteredUserEvents = getFilteredUserEvents(matchingYearUserEvents, dateAttributesObject);

  // Merge API and user-added events to a single array and return
  const mergedEventsArray = [...filteredAPIEvents, ...filteredUserEvents];
  return mergedEventsArray;
}



// =============================================
//  Sort & Build Event Elements
// =============================================

// Separate events by type (API or user-added) and build event elements.

function separateAndBuildEventElements(mergedEventsArray, calendarEventDetails) {
  // Get calendar categories from local storage and add to data source object
  const calendarCategoriesArray = getCategoriesFromLocalStorage();

  for (const eventObject of mergedEventsArray) {
    if (!eventObject.eventId) {
      // Find matching category and destructure color value
      const apiEventCategory = calendarCategoriesArray.find(object => object.categoryId === 'apiCategoryObject');

      if (apiEventCategory.visible) {
        // Add calendar events to pop-out event details element
        createAPIEventElements(eventObject, apiEventCategory, calendarEventDetails);
      }
    } 

    else {
      const { categoryId } = eventObject;
      // Find matching category and destructure color value
      const matchingEventCategory = calendarCategoriesArray.find(object => object.categoryId === categoryId);

      // Create element for every event
      if (matchingEventCategory.visible) {
        // Add calendar events to pop-out event details element
        createUserEventElement(eventObject, matchingEventCategory, calendarEventDetails);
      }
    }
  }
}



// =============================================
//  Get Filtered Events By Date
// =============================================

// Separate logic for filtering either API and user-added events that match the date of clicked element.

function getFilteredAPIEvents(matchingYear, dateAttributesObject) {
  const { dataYear, dataMonth, dataDate } = dateAttributesObject;

  // Return events objects from array with matching date properties to dataset attributes 
  return matchingYear.filter(item => {
    const { date: { datetime: { day, month, year } } } = item;
    return (
      day === dataDate &&
      month === dataMonth &&
      year === dataYear
    );
  });
}


function getFilteredUserEvents(matchingYearUserEvents, dateAttributesObject) {
  const { dataYear, dataMonth, dataDate } = dateAttributesObject;

  return matchingYearUserEvents.filter(userEventObject => {
    const { dates: { datesArray } } = userEventObject;

    // Check if any date in datesArray matches the given date
    return datesArray.some(({ year, month, date }) =>
      dataDate === date && dataMonth === month && dataYear === year
    );
  });
}



// =============================================
//  Build Event Elements By Type
// =============================================

// Separate logic for building event elements for both API and user-added events.

function createAPIEventElements(eventObject, apiEventCategory, calendarEventDetails) {
  const { name } = eventObject;
  const { colorPalette: { colors: { highlight } } } = apiEventCategory;

  // Create element and add class
  const calendarEventElement = document.createElement('div');
  calendarEventElement.classList.add('calendar-event-element');

  // Add category dataset value
  calendarEventElement.dataset.categoryId = 'apiCategoryObject';

  // Add inner content to event element
  calendarEventElement.innerHTML = `
    <span class="color-icon" style="background-color:#${highlight}"></span>
    <span class="event-name">${name}</span>
    <span class="time-stamp">all-day</span>
  `;

  // Append to pop-up window
  calendarEventDetails.appendChild(calendarEventElement);

  // Add calendar category dataset value
  calendarEventElement.dataset.categoryId = 'apiCategoryObject'; 

  return calendarEventElement;
}


function createUserEventElement(userEventObject, matchingEventCategory, calendarEventDetails) {
  const { 
    name,
    categoryId,
    dates: { datesArray },
    time: { startTime },
    allDay
  } = userEventObject;

  const { colorPalette: { colors: { highlight } } } = matchingEventCategory;

  // Create element and add class
  const calendarEventElement = document.createElement('div');
  calendarEventElement.classList.add('calendar-event-element');

  // Add category dataset value
  calendarEventElement.dataset.categoryId = categoryId;

  // Set time value based on event length and 'all-day' value
  let timeValue;
  const summaryStartTime = `${formatDateAndTime(startTime.hours)}:${formatDateAndTime(startTime.minutes)}`;
  datesArray.length > 1 || allDay ? timeValue = 'all-day' : timeValue = summaryStartTime;

  // Build inner contents and add event name and color
    calendarEventElement.innerHTML = `
    <span class="color-icon" style="background-color:#${highlight}"></span>
    <span class="event-name">${name}</span>
    <span class="time-stamp">${timeValue}</span>
  `;

  // Append to pop-up window
  calendarEventDetails.appendChild(calendarEventElement);

  return calendarEventElement;
}



// =============================================
//  Handle Details Element Visibility
// =============================================

// Show details pop-up window when the date element is clicked.
// Add 'no-click' class to date elements while it is open.

function handleDetailsElementVisibility(eventElementsObject) {
  const { calendarEventDetails, dateElements } = eventElementsObject;
  // Toggle 'show' class for the clicked date element
  calendarEventDetails.classList.add('show');
  
  // Make all date elements un-clickable while details element is open
  dateElements.forEach(element => element.classList.add('no-click'));
}



// =============================================
//  Sort Events By Time
// =============================================

// Sort events by length, 'allDay' value, event type (API or user-added) & start time.
// Events are stacked top to bottom by the criteria above (in that order).

function sortEventsByTime(eventsArray) {
  eventsArray.sort((a, b) => {
    // // Ensure `datesArray` exists before accessing its length
    const datesArrayA = a.dates?.datesArray?.length || 1;
    const datesArrayB = b.dates?.datesArray?.length || 1;

    // Sort by array length (descending)
    if (datesArrayB !== datesArrayA) return datesArrayB - datesArrayA;

    // Ensure allDay is always a boolean (defaults to `false` if missing)
    const allDayA = a?.allDay ?? true;
    const allDayB = b?.allDay ?? true;

    // Sort by allDay value (all-day events come first)
    if (allDayA !== allDayB) return allDayA ? -1 : 1;

    // Sort by event type (API events sorted above single date user-added events)
    const isApiOrUserA = a.categoryId === 'apiCategoryObject';
    const isApiOrUserB = b.categoryId === 'apiCategoryObject';
    if (isApiOrUserA !== isApiOrUserB) return isApiOrUserA ? 1 : -1;

    // Get timestamps (fallback to a large number if missing time data)
    const timestampA = getTimeData(a);
    const timestampB = getTimeData(b);

    return timestampA - timestampB;
  });

  function getTimeData(event) {
    // Ensure `time` and `startTime` exist before accessing properties
    const startHour = event.time?.startTime?.hours ?? 23; // Default to 23:59 if missing
    const startMinute = event.time?.startTime?.minutes ?? 59;

    // Returns timestamp in milliseconds
    const date = new Date();
    date.setHours(startHour, startMinute, 0, 0);
    return date.getTime();
  }
}



// =============================================
//  Handle Empty Event Containers
// =============================================

// Function is used by both user-added and API events in the calendar year view.
// 'No events' placeholders are added by default in the API year calendar file, so the nested if (!placeholder) check is needed to prevent duplicates being added.

function handleEmptyContainers(calendarEventDetails) {
  // Check if there are no visible events
  const eventElements = Array.from(calendarEventDetails.querySelectorAll('.calendar-event-element'));
  const allHidden = eventElements.every(child => child.classList.contains('hide'));

  // If there are no visible events, create 'No events' placeholder element
  if (allHidden) {
    // Check for 
    const placeholder = calendarEventDetails.querySelector('.no-events');

    // Create placeholder if one does not exist
    if (!placeholder) {
      const placeholder = document.createElement('span');
      placeholder.classList.add('no-events');
      placeholder.textContent = 'No events';
      calendarEventDetails.appendChild(placeholder);
    }
  }

  // Remove placeholder if it exists and there are visible events
  else {
    const placeholder = calendarEventDetails.querySelector('.no-events');
    if (placeholder) placeholder.remove();
  }
}



// =============================================
//  Window Event Listeners
// =============================================

function windowEventListeners(eventElementsObject) {
  // Attach listener to window
  window.addEventListener('click', windowClickHandler);
  window.addEventListener('keydown', enterKeyPressHandler);
  window.addEventListener('resize', windorResizeHandler);

  function windowClickHandler(e) {
    if (!e.target.closest('.calendar-event-details')) {
      // Remove classes from details element and date elements
      removeElementAndClasses(eventElementsObject);

      // Remove listeners from window once one has been used
      removeEventHandlers();
    }
  }

  function enterKeyPressHandler(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      // Remove classes from details element and date elements
      removeElementAndClasses(eventElementsObject);

      // Remove listeners from window once one has been used
      removeEventHandlers();
    }
  }

  function windorResizeHandler() {
    // Remove classes from details element and date elements
    removeElementAndClasses(eventElementsObject);

    // Remove listeners from window once one has been used
    removeEventHandlers();
  }

  function removeEventHandlers() {
    window.removeEventListener('click', windowClickHandler);
    window.removeEventListener('keydown', enterKeyPressHandler);
    window.removeEventListener('resize', windorResizeHandler);
  }
}


function removeElementAndClasses(eventElementsObject) {
  const { calendarEventDetails, dateElements } = eventElementsObject;

  // Remove 'no-click' & 'show' classes from date elements and details element
  dateElements.forEach(element => element.classList.remove('no-click'));
  calendarEventDetails.classList.remove('show');

  // Remove element after 'show' class is removed
  setTimeout(() => calendarEventDetails.remove(), 300);
}

