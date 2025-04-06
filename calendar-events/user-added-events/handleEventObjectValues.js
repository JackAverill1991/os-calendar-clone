import { monthEventPositioning } from "../monthEventPositioning.js";
import { removeArrowElement } from "../event-details-element/arrowElementFunctions.js";
import { updateEventInLocalStorage } from "./userEventsLocalStorage.js";
import { getCategoriesFromLocalStorage } from "../../calendar-categories/eventCategoriesLocalStorage.js";
import { updateSearchResults } from "../../search-form/searchbarFunctionality.js";
import { assignObjectID, getShortMonthName, formatDateAndTime } from "../../utils.js";
import { addSvgIcon } from "../../icons/icons.js";


// ===============================================
//  Handle Event Object Values
// ===============================================

// Handles user event object values for both new and pre-existing events.
// Adds default values for new events and updates user changes to the local storage.
// Handles input field values like name and location etc, and date and time values.
// Also reflects changes on the calendar event element buttons.

function handleEventObjectValues(elementsObject, userEventObject) {
  const { dateElement, calendarEventElement, calendarEventDetails, classElement } = elementsObject;

  // Group HTML elements into object
  const eventDetailsElements = getEventDetailsElementsObject(calendarEventElement, calendarEventDetails);

  // Get dateElement data attributes
  const dateDataAttributes = getDataAttributes(dateElement);

  // Create unique ID using crypto.randomUUID(), or assign preexisting IDs for events on load
  assignObjectID(calendarEventElement, userEventObject, 'eventId');

  // Set object values as input placeholders, and set newly typed input values as properties in userEventObject
  handleInputValues(eventDetailsElements, classElement, userEventObject);

  // Add text cursor (focus) to name input when event is first created and name field is empty
  autoFocusNameOnLoad(calendarEventElement, eventDetailsElements);

  // Set category and color properties in user event object
  setEventCategoryAndColor(eventDetailsElements, userEventObject, classElement);

  // Use existing date and time object details in userEventObject if they exist, else create new ones using data attributes 
  setTimeAndDate(userEventObject, dateDataAttributes);

  // Configure summary date string based on varied date / time parameters
  setSummaryDateString(eventDetailsElements, userEventObject);

  return userEventObject;
}


function getEventDetailsElementsObject(calendarEventElement, calendarEventDetails) {
  return {
    calendarEventButton: calendarEventElement.querySelector('.calendar-event-button'),
    eventButtonName: calendarEventElement.querySelector('.event-button-name'),
    eventButtonTime: calendarEventElement.querySelector('.event-button-time'),
    eventNameInput: calendarEventDetails.querySelector('.event-name'),
    eventLocationInput: calendarEventDetails.querySelector('.event-location'),
    eventInviteesInput: calendarEventDetails.querySelector('.event-invitees'),
    eventNotesInput: calendarEventDetails.querySelector('.event-notes'),
    summaryDateString: calendarEventDetails.querySelector('.summary-date-string'),
    categoryMenuButton: calendarEventDetails.querySelector('.category-menu-button'),
    timeForms: calendarEventDetails.querySelectorAll('.start-date-row .column-three, .end-date-row .column-three'),
  }
}


function getDataAttributes(dateElement) {
  return {
    dataDate: Number(dateElement.dataset.date),
    dataMonth: Number(dateElement.dataset.month),
    dataYear: Number(dateElement.dataset.year)
  }
}


// ===============================================
//  Handle Input Values
// ===============================================

// Loads pre-existing or default input values to inputs and adds any new / edited ones to userEventObject.
// Updates event name on the event button(s) as value is typed.

function handleInputValues(eventDetailsElements, classElement, userEventObject) {
  // Destructure input elements from object
  const { eventNameInput, eventLocationInput, eventInviteesInput, eventNotesInput, timeForms } = eventDetailsElements;
  
  // Add any pre-existing object values to inputs
  setInputValues(eventNameInput, 'name', userEventObject);
  setInputValues(eventLocationInput, 'location', userEventObject);
  setInputValues(eventInviteesInput, 'invitees', userEventObject);
  setInputValues(eventNotesInput, 'notes', userEventObject);

  // Add new input values to event object 
  setObjectValues(eventNameInput, 'name', userEventObject);
  setObjectValues(eventLocationInput, 'location', userEventObject);  
  setObjectValues(eventInviteesInput, 'invitees', userEventObject);
  setObjectValues(eventNotesInput, 'notes', userEventObject);
  
  // If event is not given a name, set it to 'New Event' as default
  eventNameInput.value === '' ? userEventObject.name = 'New Event' : null;

  // Update calendar event button text to event name input
  addInputTextToButton(eventDetailsElements, classElement);

  // Set allDay value to false if no value has been previously set
  userEventObject.allDay = userEventObject.allDay || false;

  // Hide time inputs when 'allDay' is selected
  timeForms.forEach(form => {
    if (userEventObject.allDay) form.classList.add('hide');
  });
}


// Set pre-existing object values to inputs on page load
function setInputValues(inputElement, objectProperty, userEventObject) {
  if (userEventObject.hasOwnProperty(objectProperty)) {
    inputElement.value = userEventObject[objectProperty];
  }
}


// Add new input values to event object 
function setObjectValues(inputElement, objectProperty, userEventObject) {
  inputElement.addEventListener('input', () => {
    let inputString = inputElement.value;
    userEventObject[objectProperty] = inputString;

    // Update event in local storage
    updateEventInLocalStorage(userEventObject);

    if (objectProperty === 'name') {
      // Update search results element results if it is open
      updateSearchResults();
    }
  });
}


// Update calendar event button text to event name input
function addInputTextToButton(eventDetailsElements, classElement) {
  const { eventNameInput, calendarEventButton } = eventDetailsElements;

  eventNameInput.addEventListener('input', () => {
    let inputString = eventNameInput.value;

    // Get event ID from calendar element dataset and use it to find all elements with same ID
    const eventId = calendarEventButton.parentElement.dataset.eventId;
    const matchingIdEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${eventId}"]`);

    // Exit function if there are no matching event elements
    if (matchingIdEventElements.length === 0) return;

    // Get updated event button from results (allows the text to be updated after changing calendar class)
    const updatedEventButton = matchingIdEventElements[0].querySelector('.calendar-event-button');
    
    // Set event name text for calendar event buttons
    setButtonText(updatedEventButton, inputString);

    // Handle multiple date events that span more than one row
    if (matchingIdEventElements) {
      matchingIdEventElements.forEach(element => handleMultipleRowEvents(element, inputString));
    }
  });

  function handleMultipleRowEvents(element, inputString) {
    // Select dateElement and get its day of the week dataset value
    const dateElement = element.closest('.date-element');
    const dayOfWeek = dateElement.dataset.dayValue;

    // Set button text for any subsequent event buttons that fall on a Monday
    if (parseInt(dayOfWeek) === 1) {
      const calendarEventButton = element.querySelector('.calendar-event-button');
      setButtonText(calendarEventButton, inputString);
    }
  }

  // Helper function to update button text from details pop-up window as user types
  function setButtonText(calendarEventButton, inputString) {
    const buttonNameElement = calendarEventButton.querySelector('.event-button-name');
    if (buttonNameElement) {
      buttonNameElement.textContent = inputString || 'New Event';
      if (inputString.value === '') {
        buttonNameElement.textContent = '';
      }
    }
  }
}


function autoFocusNameOnLoad(calendarEventElement, eventDetailsElements) {
  // Destructure event name input
  const { eventNameInput } = eventDetailsElements;

  // Autofocus name input on load (only when event name is blank when first opened)
  if (calendarEventElement.classList.contains('personal-event') && eventNameInput.value === '') {

    // preventScroll prevents autofocus from expanding layout
    eventNameInput.focus({ preventScroll: true });
  }
}



// ===============================================
//  Set Summary Date String
// ===============================================

// Adds a summary of date and time to the details element, differentiating for single / multiple day and all-day events.

function setSummaryDateString(eventDetailsElements, userEventObject) {
  const { summaryDateString } = eventDetailsElements;

  // Destructure variables from objects
  const {
    dates: { startDate, endDate, datesArray },
    time: { startTime, endTime },
    allDay,
  } = userEventObject;

  // Check if event has more than one date
  const multipleDateEvent = datesArray.length > 1;

  // Check if event lasts all day
  const isAllDay = allDay;

  // Create start and end date / time strings from date objects
  const summaryStartDate = `${startDate.date} ${getShortMonthName(startDate.month)} ${startDate.year}`;
  const summaryEndDate = `${endDate.date} ${getShortMonthName(endDate.month)} ${endDate.year}`;
  const summaryStartTime = `${formatDateAndTime(startTime.hours)}:${formatDateAndTime(startTime.minutes)}`;
  const summaryEndTime = `${formatDateAndTime(endTime.hours)}:${formatDateAndTime(endTime.minutes)}`;
  
  // Differentiate summary string for single and multiple date events
  if (multipleDateEvent) {
    summaryDateString.innerHTML = isAllDay
      ? `${summaryStartDate} to ${summaryEndDate}`
      : `${summaryStartDate} ${summaryStartTime} to </br> ${summaryEndDate} ${summaryEndTime}`;
  } else {
    summaryDateString.innerHTML = isAllDay
      ? `${summaryStartDate}`
      : `${summaryStartDate} ${summaryStartTime} to ${summaryEndTime}`;
  }
}



// ===============================================
//  Set Time & Date
// ===============================================

// Creates empty date / time objects if neither already exists, and adds default values.
// Pre-existing values are updated within the userEventObject if available.

function setTimeAndDate(userEventObject, dateDataAttributes) {
  // Destructure variables from object
  const { dataYear, dataMonth, dataDate } = dateDataAttributes;

  // Create dates object if it does not already exist
  userEventObject.dates = userEventObject.dates || {};

  // If startDate, endDate and datesArray haven't been set, add data attributes as default values
  userEventObject.dates.startDate = userEventObject.dates.startDate || { date: dataDate, month: dataMonth, year: dataYear };
  userEventObject.dates.endDate = userEventObject.dates.endDate || { date: dataDate, month: dataMonth, year: dataYear };
  userEventObject.dates.datesArray = userEventObject.dates.datesArray || [{ date: dataDate, month: dataMonth, year: dataYear }];

  // Create time object if it does not already exist
  userEventObject.time = userEventObject.time || {};

  // If startTime and endTime haven't been set, add default values
  userEventObject.time.startTime = userEventObject.time.startTime || { hours: 9, minutes: 0 };
  userEventObject.time.endTime = userEventObject.time.endTime || { hours: 10, minutes: 0 };
}



// ===============================================
//  Handle All Day Events Checkbox
// ===============================================

// Adds all-day functionality to details element by attaching an event listener to the 'all-day' tickbox.
// Hides time displays on calendar buttons (in calendar and in search results) and hides time inputs on pop-up event details element.

function handleAllDayEvents(e, eventElementsObject, userEventObject) {
  const { calendarEventDetails } = eventElementsObject;
  const allDayButton = calendarEventDetails.querySelector('.tickbox');

  // Add SVG icon
  const tickIcon = addSvgIcon('tickIcon', allDayButton, '#ffffff', 'none');

  // Update button class to match object value on load
  updateTickboxClasses(allDayButton, tickIcon, userEventObject);

  // Attach event listener to 'all-day' button
  allDayButton.addEventListener('click', () =>  {
    handleAllDayButtonClick(allDayButton, tickIcon, eventElementsObject, userEventObject);
  });
}


function updateTickboxClasses(allDayButton, tickIcon, userEventObject) {
  // Add / remove 'hide' class based on 'allDay' object property value
  if (userEventObject.allDay) {
    allDayButton.classList.add('checked');
    tickIcon.classList.remove('hide');
  }
  else {
    allDayButton.classList.remove('checked');
    tickIcon.classList.add('hide');
  }
}


function handleAllDayButtonClick(allDayButton, tickIcon, eventElementsObject, userEventObject) {console.log('poo');
  const { classElement, calendarEventDetails } = eventElementsObject;

  // Toggle allDay value for event object
  userEventObject.allDay = !userEventObject.allDay;

  // Toggle 'checked' class on button
  allDayButton.classList.toggle('checked');

  // Toggle 'hide' class on button
  tickIcon.classList.toggle('hide');

  // Hide time inputs when 'allDay' is selected
  toggleTimeInputVisibility(eventElementsObject);

  // Toggle time display elements on calendar buttons
  toggleEventButtonTime(eventElementsObject, userEventObject);

  // Update user event object in local storage
  updateEventInLocalStorage(userEventObject);
  
  // Reorganize events to with all-day event elements at the top
  monthEventPositioning(classElement, null);

  // Update search results element results if it is open
  updateSearchResults();

  // Remove arrow from details element
  const isDragged = calendarEventDetails.dataset.isDragged === true;
  if (!isDragged) removeArrowElement(calendarEventDetails);
}


function toggleTimeInputVisibility(eventElementsObject) {
  const { dateTimeDetails } = eventElementsObject;

  // Select time columns and add 'hide' class
  const timeForms = dateTimeDetails.querySelectorAll('.start-date-row .column-three, .end-date-row .column-three');
  timeForms.forEach(item => item.classList.toggle('hide'));
}


function toggleEventButtonTime(eventElementsObject, userEventObject) {
  const { calendarEventElement, classElement } = eventElementsObject;

  // Select all event elements with matching dataset eventID
  const matchingIdEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${userEventObject.eventId}"]`);

  // Check for multiple date events (from editCalendarEvents function)
  if (matchingIdEventElements) {
    matchingIdEventElements.forEach(element => {
      const eventButtonTime = element.querySelector('.event-button-time');
      eventButtonTime.classList.toggle('hide');
    });
  }

  // If no matchingIdEventElements, use initial single date calendar event element (passed in from addCalendarEvents function)
  else {
    const eventButtonTime = calendarEventElement.querySelector('.event-button-time');
    eventButtonTime.classList.toggle('hide');
  }
}



// ===============================================
//  Set Event Category And Color Palette
// ===============================================

// Checks userEventObject for existing category and if none exists, adds whichever category is currently highlighted in the sidebar (API category is excluded).
// Adds category color profile and dataset values to event all buttons with matching event ID.

function setEventCategoryAndColor(eventDetailsElements, userEventObject) {
  const { categoryMenuButton } = eventDetailsElements;

  // Get calendar categories array from local storage
  const calendarCategoriesArray = getCategoriesFromLocalStorage();

  // If API category element is highlighted in sidebar, default to top category in list
  const highlightedCategoryElement = disableApiCategory();

  // Get dataset category ID from element and use it to find category in array
  const highlightedCategoryId = highlightedCategoryElement.parentElement.dataset.categoryId;
  const highlightedCategory = calendarCategoriesArray.find(object => object.categoryId === highlightedCategoryId);

  // If no value exists, set eventCategory property to highlighted category
  userEventObject.categoryId = userEventObject.categoryId || highlightedCategory.categoryId;

  // Find category from array that matches the categoryId property in the userEventObject
  const matchingCategory = calendarCategoriesArray.find(object => object.categoryId === userEventObject.categoryId);
  
  // Set intitial button icon color
  const categoryColorIcon = categoryMenuButton.querySelector('.category-color-icon');
  categoryColorIcon.style.backgroundColor = `#${matchingCategory.colorPalette.colors.highlight}`;

  // Select all event elements with matching eventId and update color and category dataset
  const calendarEventElements = document.querySelectorAll(`.calendar-event-element[data-event-id="${userEventObject.eventId}"]`);
  calendarEventElements.forEach(eventElement => {
    updateEventElementColorAndData(eventElement, userEventObject, matchingCategory);
  });
}


function disableApiCategory() {
  let highlightedCategoryElement = document.querySelector('.calendar-category.highlight');

  if (highlightedCategoryElement.parentElement.matches('.api-calendar-category')) {
    highlightedCategoryElement.classList.remove('highlight');

    const eventCategories = document.querySelectorAll('.calendar-category:not(.api-calendar-category)');
    highlightedCategoryElement = eventCategories[0];
    highlightedCategoryElement.classList.add('highlight');
  }
  return highlightedCategoryElement;
}


// Used in 'assignCalendarCategories.js' to update color and category dataset value on event elements when category is chosen in details window.
// Used in loadCalendarEvents to set initial values on event elements when page loads.

function updateEventElementColorAndData(eventElement, userEventObject, categoryDetailsObject) {
  const { colorPalette: { name, colors: { highlight, pastel } } } = categoryDetailsObject;

  // Set categoryId as event element dataset value
  eventElement.dataset.categoryId = userEventObject.categoryId;

  // Set category colorPalette name as event button dataset value
  const calendarEventButton = eventElement.querySelector('.calendar-event-button');
  calendarEventButton.dataset.colorPalette = name;

  // Differentiate color behaviour based on classElement dataset and whether buttons are highlighted
  setEventButtonStyles();
  
  function setEventButtonStyles() {
    if (calendarEventButton.classList.contains('highlight')) {
      // Set initial event button background color as pastel tone
      calendarEventButton.style.backgroundColor = `#${highlight}`;

    } else {
      // Set initial event button background color as pastel tone
      calendarEventButton.style.backgroundColor = `#${pastel}`;
    }
  }
}



export {
  handleEventObjectValues,
  handleAllDayEvents,
  setSummaryDateString,
  updateEventElementColorAndData
}