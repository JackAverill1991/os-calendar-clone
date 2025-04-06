import { createCalendarEventElement } from "./addNewCalendarEvent.js";
import { updateEventElementColorAndData } from "./handleEventObjectValues.js"; 
import { getEventsFromLocalStorage } from "./userEventsLocalStorage.js";
import { getCategoriesFromLocalStorage } from "../../calendar-categories/eventCategoriesLocalStorage.js";
import { formatDateAndTime } from "../../utils.js"



// ===============================================
//  Load User Calendar Events
// ===============================================

// Gets complete list of years displayed in calendar month view (handles year overlap).
// Uses year(s) to find matching date events in local storage.
// Retrieves complete list of event categories from local storage.

function loadCalendarEvents(classElement) {
  // Create array of date elements (excluding time specific date elements)
  const dateElements = Array.from(classElement.querySelectorAll('.date-element:not(.time-specific-date-element)'));

  // Get array of years from data attributes in dateElements and get unique values
  const calendarYearsArray = dateElements.map((dateObject) => dateObject.getAttribute('data-year').toString());
  const uniqueYearsArray = [...new Set(calendarYearsArray)];

  // Get all events from relevant calendar year(s) in localStorage
  const matchingYearUserEvents = getEventsFromLocalStorage(uniqueYearsArray);

  // Get calendar categories array from local storage
  const calendarCategoriesArray = getCategoriesFromLocalStorage(); 

  // Loop through each userEventObject in matchingYearUserEvents array, find matching date element and create calendar event element
  handleUserEventsArray(matchingYearUserEvents, calendarCategoriesArray, dateElements, classElement);
}



// ===============================================
//  Handle User Events Array
// ===============================================

// Finds matching date element for every event object in the array and builds event element.

function handleUserEventsArray(eventsArray, calendarCategoriesArray, dateElements, classElement) {
  // Loop through each user event object in array
  eventsArray.forEach(userEventObject => {
    const { dates: { datesArray } } = userEventObject;

    // Loop through date objects in date objects array
    datesArray.forEach(object => {

      // Get matching calendar date elements for single-date event dates
      const dateElement = findMatchingDateElement(object, dateElements);

      // Add details pop-up, add widget calendars and click functionality, handle object values
      if (dateElement) {
        buildCalendarEventElements(userEventObject, dateElement, calendarCategoriesArray, classElement);
      }
    });
  });
}

// Helper function to get matching calendar date elements for both singleDateEvents and mutlipleDateEvents
function findMatchingDateElement(object, dateElements) {
  return dateElements.find(dateElement => (
    parseInt(dateElement.getAttribute('data-year')) === object.year &&
    parseInt(dateElement.getAttribute('data-month')) === object.month &&
    parseInt(dateElement.getAttribute('data-date')) === object.date
  ));
}



// ===============================================
//  Build Calendar Event Elements
// ===============================================

// Creates calendar elements for all events where the matching category is set to visible.
// Adds event name / time information and color profile from event category.

function buildCalendarEventElements(userEventObject, dateElement, calendarCategoriesArray, classElement) {
  const { eventId, dates: { datesArray } } = userEventObject;

  // Select calendar events container from date element
  const calendarEventsContainer = dateElement.querySelector('.calendar-event-container');

  // Create event element and append to events container
  const calendarEventElement = createCalendarEventElement(datesArray, false);

  // Add event ID as dataset value
  calendarEventElement.dataset.eventId = eventId;

  // Categorizes events based on single or multiple date ranges and add event times accordingly
  handleSingleAndMutlipleDateEvents(datesArray, dateElement, calendarEventElement, userEventObject);

  // Find category from array that matches the name property in the userEventObject
  const matchingCalendarCategory = calendarCategoriesArray.find(object => object.categoryId === userEventObject.categoryId);

  // Add color CSS and category dataset property to event elements
  updateEventElementColorAndData(calendarEventElement, userEventObject, matchingCalendarCategory, classElement);

  // Hide event elements if their event category is set to non-visible
  manageCategoryVisibility(calendarEventElement, userEventObject, calendarCategoriesArray);

  // Append event element to container
  calendarEventsContainer.appendChild(calendarEventElement);  
}


function handleSingleAndMutlipleDateEvents(datesArray, dateElement, calendarEventElement, userEventObject) {
  if (datesArray.length > 1) {
    // Add classes to multiple date event buttons to target where event name and start / end times go
    addEventElementAttributes(dateElement, calendarEventElement, userEventObject);

  } else {
    // Add event name and start time to single date event buttons
    setCalendarButtonInfo(calendarEventElement, userEventObject, 'first-element');
  }
}



// ===============================================
//  Add Event Element Attributes
// ===============================================

// Add classes to multiple date event buttons to target where event name & start / end times go.

function addEventElementAttributes(dateElement, calendarEventElement, userEventObject) {
  const { dates: { datesArray } } = userEventObject;

  // Find dateElement with matching data attributes to year, month and date from first date in datesArray
  if (Number(dateElement.dataset.year) === datesArray[0].year &&
      Number(dateElement.dataset.month) === datesArray[0].month &&
      Number(dateElement.dataset.date) === datesArray[0].date) {

        // Add 'first element' class
        calendarEventElement.classList.add('first-element');

        // Set event name and time in calendar event button
        setCalendarButtonInfo(calendarEventElement, userEventObject, 'first-element');
  }

  // Find dateElement with matching data attributes to year, month and date from last date in datesArray
  if (Number(dateElement.dataset.year) === datesArray[datesArray.length - 1].year &&
      Number(dateElement.dataset.month) === datesArray[datesArray.length - 1].month &&
      Number(dateElement.dataset.date) === datesArray[datesArray.length - 1].date) {

        // Add 'last element' class
        calendarEventElement.classList.add('last-element');

        // Set event name and time in calendar event button
        setCalendarButtonInfo(calendarEventElement, userEventObject, 'last-element');
  }

  // Select day of the week dataset value
  const dayOfWeek = dateElement.dataset.dayValue;

  // Add name to every element that falls on a Monday when spanning more than one row
  if (Number(dayOfWeek) === 1) {
    setCalendarButtonInfo(calendarEventElement, userEventObject, 'monday-element');
  }
}



// ===============================================
//  Set Event Button Name & Time
// ===============================================

// Add name and start / end time information to calendar buttons.

function setCalendarButtonInfo(calendarEventElement, userEventObject, elementType) {
  const { name, allDay, time: { startTime, endTime } } = userEventObject;

  // Select button info elements from calendar event element
  const eventButtonName = calendarEventElement.querySelector('.event-button-name');
  const eventButtonTime = calendarEventElement.querySelector('.event-button-time');

  // Hide time on allDay events
  if (allDay) {
    eventButtonTime.classList.add('hide');
  }

  // Add event name and time to calendarEventButton
  if (elementType === 'first-element') {
    eventButtonName.innerHTML = name;
    eventButtonTime.innerHTML = `${formatDateAndTime(startTime.hours)}:${formatDateAndTime(startTime.minutes)}`;
  }

  else if (elementType === 'last-element') {
    eventButtonTime.innerHTML = `ends ${formatDateAndTime(endTime.hours)}:${formatDateAndTime(endTime.minutes)}`;
  }

  else if (elementType === 'monday-element') {
    eventButtonName.innerHTML = name;
  }
}



// ===============================================
//  Manage Category Visibility
// ===============================================

// Hide event elements for events where matching category has visible property value of 'false'.

function manageCategoryVisibility(calendarEventElement, userEventObject, calendarCategoriesArray) {
  // Find event elements with matching categoryId dataset value
  const categoryId = userEventObject.categoryId;
  const matchingCalendarCategory = calendarCategoriesArray.find(categoryObject => categoryObject.categoryId === categoryId);

  // Add 'hide' class to event elements
  if (!matchingCalendarCategory.visible) {
    calendarEventElement.classList.add('hide');
  }
}



export {
  loadCalendarEvents,
  getEventsFromLocalStorage,
  addEventElementAttributes,
  setCalendarButtonInfo
}