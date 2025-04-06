import { handleEventListeners } from "./searchElementListeners.js";
import { getEventsFromLocalStorage } from "../calendar-events/user-added-events/userEventsLocalStorage.js";
import { getCategoriesFromLocalStorage } from "../calendar-categories/eventCategoriesLocalStorage.js";
import { eventCategoryColorsObject, formatDateAndTime, monthNames } from "../utils.js";
import { addSvgIcon } from "../icons/icons.js";



// ===============================================
//  Search Bar Functionality
// ===============================================

// Called in app index on initial load.
// Selects DOM elements and handles event listeners.

function searchbarFunctionality() {
  const searchElementsObject = getSearchElementsObject();

  // Add event listeners to search form and close button
  addEventListeners(searchElementsObject);
  
  // Add SVG icon to close button from template
  addButtonSvg(searchElementsObject);
}


// Handles event listeners on both search the form and the close 'x' button inside it.
// Search form input listener takes input value and uses it to search the local storage for matching events.

function addEventListeners(searchElementsObject) {
  const { searchFormWrapper, searchForm, closeSearchButton } = searchElementsObject;

  // Focus form when any element inside wrapper is clicked
  searchFormWrapper.addEventListener('click', (e) => {
    if (e.target.closest('.search-form-wrapper')) searchForm.focus();
  });

  // Open search results window and display results when user types into search form
  searchForm.addEventListener('input', () => handleSearchFormInput(searchElementsObject));

  // Close search results window when 'close' button is clicked
  closeSearchButton.addEventListener('click', () => handleCloseButtonClick(searchElementsObject));
}


// Select and return object containing DOM elements to pass into functions.

function getSearchElementsObject() {
  return {
    searchFormWrapper: document.querySelector('.search-form-wrapper'),
    searchForm: document.querySelector('.search-form'),
    searchResults: document.querySelector('.search-results'),
    searchIcon: document.querySelector('.search-icon'),
    closeSearchButton: document.querySelector('.close-search-button'),
  }
}


// Add SVG icons to search and close button.

function addButtonSvg(searchElementsObject) {
  const { searchIcon, closeSearchButton } = searchElementsObject;
  addSvgIcon('closeButton', closeSearchButton, '#e8e8e9', 'none');
  addSvgIcon('searchIcon', searchIcon, '#868686', '#868686');
}



// ===============================================
//  Update Search Results
// ===============================================

// Applies the same logic as the input event listener on the search input element, but allows it to be applied to click listeners.
// Used to update search results element display if any of its events are changed whilst it is open, i.e date / name / time changes etc.

function updateSearchResults() {
  if (document.body.classList.contains('open-search-results')) {
    const searchElementsObject = getSearchElementsObject();
    handleSearchFormInput(searchElementsObject);
  }
}



// ===============================================
//  Handle Search Form Input
// ===============================================

// When search value is entered into form input, the searchResults window is opened.
// Results are displayed with date / event elements, unless there are no results in which case a 'no results' message is shown.

let openSearchTimeout; // Declare timeout variable

function handleSearchFormInput(searchElementsObject) {
  const { searchForm, searchResults } = searchElementsObject;

  // Select calendar class container element
  const classElement = document.querySelector('.calendar-class-content').firstChild;

  // If the input is empty, clear the timeout and close the search results
  if (handleEmptySearchInput(searchForm, classElement)) return;

  // Clear previous timeout before setting a new one
  clearTimeout(openSearchTimeout);

  // Clear search results and open the search results window after a delay
  openSearchResults(searchResults);

  // Filter matching results and handle the display logic
  const matchingEvents = findMatchingEvents(searchForm);

  if (matchingEvents.length > 0) {
    // Get calendar categories array from local storage
    const calendarCategoriesArray = getCategoriesFromLocalStorage();

    // Create a map to group events by date
    const eventDatesObject = createDatesObject(matchingEvents);
    
    // Organize and display event date groups / create date & event elements
    const searchResultsObject = createSearchResults(searchElementsObject, eventDatesObject, calendarCategoriesArray, classElement);
    const { searchEventElementsArray, userEventObjectSet } = searchResultsObject;

    // Add event listeners to search result event elements
    handleEventListeners(searchEventElementsArray, userEventObjectSet, searchResults);
  } 

  else {
    // Display empty results message element
    const emptyResultsElement = createEmptyResultsDiv();
    searchResults.appendChild(emptyResultsElement);

    // Remove 'highlight' class and set all event buttons to pastel tone
    addDefaultButtonSettings(classElement);
  }
}


function openSearchResults(searchResults) {
  // Clear search results before render
  searchResults.innerHTML = '';

  // Open search results after delay
  openSearchTimeout = setTimeout(() => {
    document.body.classList.add('open-search-results');
  }, 300);
}


function handleEmptySearchInput(searchForm, classElement) {
  if (searchForm.value.trim() === '') {
    // Cancel any pending open operation
    clearTimeout(openSearchTimeout);

    // Ensure the results are closed
    document.body.classList.remove('open-search-results');

    // Remove 'highlight' class and set all event buttons to pastel tone
    addDefaultButtonSettings(classElement);

    return true; // Indicate that the input was empty
  }
  return false; // Input is not empty
}


// Create element for display when search results are empty
function createEmptyResultsDiv() {
  const emptyResultsElement = document.createElement('div');
  emptyResultsElement.classList.add('empty-results-element');
  emptyResultsElement.innerHTML = `<span class="no-results">no results</span>`;

  return emptyResultsElement;
}



// ===============================================
//  Handle Close Button Click
// ===============================================

// Close search results window and reset settings to defaults.

function handleCloseButtonClick(searchElementsObject) {
  const { searchForm } = searchElementsObject;

  // Select calendar class container element
  const classElement = document.querySelector('.calendar-class-content').firstChild;

  // Remove 'highlight' class and set all event buttons to pastel tone
  addDefaultButtonSettings(classElement);

  // Close search results window
  document.body.classList.remove('open-search-results');

  // Reset search input value to empty string
  searchForm.value = '';
}



// ===============================================
//  Find Matching Events
// ===============================================

// Returns list of events from localStorage that match search value.

function findMatchingEvents(searchForm) {
  // Call getEventsFromLocalStorage with no specified year array passed to get all events
  const storedEvents = getEventsFromLocalStorage(null);

  // Get the search input value
  const searchTerm = searchForm.value.toLowerCase();

  // Filter the objects that match the search term
  return storedEvents.filter(obj => obj.name.toLowerCase().includes(searchTerm));
}



// ===============================================
//  Create Dates Object
// ===============================================

// Create an object containing each date included in the matchingEvents array.
// Create array of events within each date property and push any userEventObjects with matching dates.

function createDatesObject(matchingEvents) {
  // Create a map to group events by date
  const eventDatesObject = {};

  matchingEvents.forEach(userEventObject => {
    const { datesArray } = userEventObject.dates;

    datesArray.forEach(({ date, month, year }) => {
      // Format the date as a string
      const dateString = `${date} ${monthNames[month - 1]} ${year}`;

      // Initialize the date object if it doesn't exist
      if (!eventDatesObject[dateString]) {
        eventDatesObject[dateString] = {
          dateObject: { date, month, year },
          eventsArray: []
        };
      }

      // Add event to the array in the corresponding date
      eventDatesObject[dateString].eventsArray.push(userEventObject);
    });
  });

  // Sort events array objects in order by time
  sortEventsByTime(eventDatesObject);

  // Sort object dates chronologically and return
  return sortObjectByDate(eventDatesObject);
}



// ===============================================
//  Sort Events By Time & Date
// ===============================================

// Date elements are sorted by date.
// Event elements are sorted by time.

function sortEventsByTime(eventDatesObject) {
  // Loop through eventDatesObject values and select eventsArray
  for (const value of Object.values(eventDatesObject)) {
    const { eventsArray } = value;

    // Sort event objects by time
    eventsArray.sort((a, b) => {
      const timeA = new Date(0, 0, 0, a.time.startTime.hours, a.time.startTime.minutes, 0);
      const timeB = new Date(0, 0, 0, b.time.startTime.hours, b.time.startTime.minutes, 0);

      return timeA.getTime() - timeB.getTime() // Compare timestamps
    });
  }
}


function sortObjectByDate(datesObject) {
  // Convert object to an array of [key, value] pairs
  const sortedEntries = Object.entries(datesObject).sort(([, a], [, b]) => {
    const dateA = new Date(a.dateObject.year, a.dateObject.month - 1, a.dateObject.date); // Months are 0-indexed
    const dateB = new Date(b.dateObject.year, b.dateObject.month - 1, b.dateObject.date);

    return dateA.getTime() - dateB.getTime(); // Compare timestamps
  });

  // Convert sorted array back into an object
  return Object.fromEntries(sortedEntries);
}



// ===============================================
//  Create & Display Search Results
// ===============================================

// Loop through date object and create date elements.
// Loop through the events array within each date in the date object and create event element for each userEventObject.

function createSearchResults(searchElementsObject, eventDatesObject, calendarCategoriesArray, classElement) {
  const { searchResults } = searchElementsObject;

  const searchEventElementsArray = [];
  const userEventObjectSet = new Set(); // Set to keep track of unique eventIds

  // Initially remove 'highlight' class and set all event buttons to pastel tone
  addDefaultButtonSettings(classElement);

  // Loop through each date key in object and destructure properties
  for (const [key, value] of Object.entries(eventDatesObject)) {
    const { dateObject, eventsArray } = value;

    // Loop through each userEventObject in array
    eventsArray.forEach((userEventObject) => {
      const { categoryId } = userEventObject;

      // Find category from array that matches the dataset categoryId of the menuElement
      const matchingCalendarCategory = calendarCategoriesArray.find(userEventObject => 
        userEventObject.categoryId === categoryId
      );

      // Only include events from visible categories
      if (matchingCalendarCategory.visible) {
        // Create date element
        const searchDateElement = createDateElement(key, dateObject, searchResults);

        // Create event element for each userEventObject and push to array
        const searchEventElement = createEventElement(userEventObject, searchDateElement, matchingCalendarCategory);
        searchEventElementsArray.push(searchEventElement);

        // Add userEventObject to Set (to track unique event IDs)
        userEventObjectSet.add(userEventObject);
      }
    });
  }

  // Add 'highlight' class and color to event buttons that match search query
  setTimeout(() => highlightEventButtons(Array.from(userEventObjectSet), classElement), 300);

  // Add event start / end times 
  configureEventTimes(Array.from(userEventObjectSet), searchResults);

  return { searchEventElementsArray, userEventObjectSet: Array.from(userEventObjectSet) };
}



// ===============================================
//  Create Date Elements
// ===============================================

// Create date element for each date that comes up in the list of events.
// Date elements will contain event elements.

function createDateElement(key, dateObject, searchResults) {
  // Create date element
  const searchDateElement = document.createElement('div');
  searchDateElement.classList.add('search-date-element');
  searchDateElement.innerHTML = `<span class="search-date-heading">${key}</span>`;

  // Assign dataset attributes
  searchDateElement.dataset.year = dateObject.year;
  searchDateElement.dataset.month = dateObject.month;
  searchDateElement.dataset.date = dateObject.date;

  // Append to search results
  searchResults.appendChild(searchDateElement);

  return searchDateElement;
}



// ===============================================
//  Create Event Elements
// ===============================================

// Create event elements for the search menu results.

function createEventElement(object, searchDateElement, matchingCalendarCategory) {
  const { name, eventId } = object;
  const { colorPalette: { colors: { highlight } } } = matchingCalendarCategory;

  // Create outer element and add class
  const searchEventElement = document.createElement('div');
  searchEventElement.classList.add('search-event-element');

  // Add event ID as dataset attribute
  searchEventElement.dataset.eventId = eventId;

  // Add inner elements
  searchEventElement.innerHTML = `
    <div class="name-container">
      <span class="event-search-color" style="background-color:#${highlight}"></span>
      <span class="event-search-name">${name}</span>
    </div>
    <div class="search-time-container">
      <span class="search-start-time"></span>
      <span class="search-end-time"></span>
    </div>
  `;
  
  // Append to date element
  searchDateElement.appendChild(searchEventElement);

  return searchEventElement;
}



// ===============================================
//  Configure Event Times
// ===============================================

// Use array of userEventObjects to find all calendar event elements with matching eventId.
// Handle multiple-date events, adding startTime to first element, endTime to the last element and 'all-day' for those in between.
// For single-date events, add both startTime and endTime to element.

function configureEventTimes(eventObjectArray, searchResults) {
  eventObjectArray.forEach(userEventObject => {
    const { eventId } = userEventObject;

    // Use dataset to find matching calendar event elements once per eventId
    const matchingIdEventElements = searchResults.querySelectorAll(`.search-event-element[data-event-id="${eventId}"]`);

    matchingIdEventElements.forEach((element, index) => {
      const timeElements = {
        startTimeElement: element.querySelector('.search-start-time'),
        endTimeElement: element.querySelector('.search-end-time')
      }

      // Differentiate between multiple-date & single-date events
      if (matchingIdEventElements.length > 1) {
        // Handle multiple-date event
        multipleDateEventTimes(index, userEventObject, timeElements, matchingIdEventElements);
      } 
      
      else {
        // Handle single-date event
        singleDateEventTimes(userEventObject, timeElements)
      }
    });
  });
}


function multipleDateEventTimes(index, userEventObject, timeElements, matchingIdEventElements) {
  const { time: { startTime, endTime }, allDay } = userEventObject;
  const { startTimeElement, endTimeElement } = timeElements;

  // Helper function to format time
  const formatTime = (time) => `${formatDateAndTime(time.hours)}:${formatDateAndTime(time.minutes)}`;

  // Function to handle 'all-day' display logic
  const handleAllDayDisplay = () => {
    displayAllDay(startTimeElement, endTimeElement);
  };

  // Check for 'all-day' first, and exit if true
  if (allDay) {
    handleAllDayDisplay();
    return;
  }

  if (index === 0) {
    // Display start time and hide end time for the first element
    startTimeElement.innerHTML = formatTime(startTime);
    endTimeElement.style.display = 'none';
  } 
  
  else if (index === matchingIdEventElements.length - 1) {
    // Hide start time and show end time for the last element
    startTimeElement.style.display = 'none';
    endTimeElement.innerHTML = `
      <span class="search-end-label">Ends</span>
      <span>${formatTime(endTime)}</span>
    `;
  } 
  
  else {
    // For elements between the start and end, show 'all-day'
    handleAllDayDisplay();
  }
}


function singleDateEventTimes(userEventObject, timeElements) {
  const { time: { startTime, endTime }, allDay } = userEventObject;
  const { startTimeElement, endTimeElement } = timeElements;

  if (!allDay) {
    // Add both start and end times to single date element
    startTimeElement.innerHTML = `${formatDateAndTime(startTime.hours)}:${formatDateAndTime(startTime.minutes)}`;
    endTimeElement.innerHTML = `${formatDateAndTime(endTime.hours)}:${formatDateAndTime(endTime.minutes)}`;
  
  } else {
    // Display 'all-day'
    displayAllDay(startTimeElement, endTimeElement);
  }
}


function displayAllDay(startTimeElement, endTimeElement) {
  startTimeElement.textContent = 'all-day';
  endTimeElement.style.display = 'none';
}



// ===============================================
//  Button Highlight / Color Functionality
// ===============================================

// Returns event buttons to their default pastel color scheme when the searchResults window is closed.
// A 300ms delay is set to sync it with the results window close.

function addDefaultButtonSettings(classElement) {
  const allCalendarEventButtons = classElement.querySelectorAll('.calendar-event-button');

  setTimeout(() => allCalendarEventButtons.forEach(button => {
    // Allow highlight to be removed by clicking window
    button.dataset.preventRemoveHighlight = 'false';

    // Remove button highlight and set pastel tone
    addAndRemoveHighlight(button, 'remove', 'pastel');
  }), 300);
}


// Adds highlight color scheme to event buttons that match search form input value.

function highlightEventButtons(eventObjectArray) {
  // Call fresh instance of class element
  const classElement = document.querySelector('.calendar-class-content').firstChild;

  // Loop through the array of unique event IDs and highlight matching buttons
  eventObjectArray.forEach(object => {
    const { eventId } = object;

    // Use dataset to find matching calendar event elements once per eventId
    const matchingIdEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`);

    // If search result event has matching calendar event elements, highlight them
    if (matchingIdEventElements) {
      matchingIdEventElements.forEach(element => {
        const calendarEventButton = element.querySelector('.calendar-event-button');

        // Prevent highlight removal from selected buttons when window is clicked
        calendarEventButton.dataset.preventRemoveHighlight = 'true';
        addAndRemoveHighlight(calendarEventButton, 'add', 'highlight');
      });
    }
  });
}


function addAndRemoveHighlight(button, addOrRemove, colorTone) {
  // Add or remove highlight class based on 'addOrRemove' value
  addOrRemove === 'add' ? button.classList.add('highlight') : button.classList.remove('highlight');

  // Get color dataset value from button and finds corresponding property in eventCategoryColorsObject
  const datasetColor = button.dataset.colorPalette;
  const color = eventCategoryColorsObject[datasetColor][colorTone];

  // Apply colorTone value from object to button as a background-color value
  button.style.backgroundColor = `#${color}`;
}



export {
  searchbarFunctionality,
  updateSearchResults,
  findMatchingEvents,
  highlightEventButtons
}