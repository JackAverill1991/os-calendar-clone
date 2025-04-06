import { WidgetCalendar } from "../../calendar-classes/widget-calendar.js";
import { formatDateAndTime } from "../../utils.js";


// =============================================
//  Create Widget Calendars
// =============================================

// Creates widget calendar Class to use in the event details element pop-up (also used in the sidebar).
// Allows user to change calendar event dates when clicking widget calendars in the details element.
// Creates start / end widget calendars from HTML templates and then passes into class as main element.
// Returns start / end date calendar inputs and other DOM elements as variables to pass into other functions for separate logic.

export function createWidgetCalendars(userEventObject, eventElementsObject) {
  const { dateElement, calendarEventDetails } = eventElementsObject;

  // Select calendar containers from calendar event element
  const startDateCalendarContainer = calendarEventDetails.querySelector('.start-date-calendar-container');
  const endDateCalendarContainer = calendarEventDetails.querySelector('.end-date-calendar-container');
  
  // Date string variables
  const startDateString = calendarEventDetails.querySelector('.start-date-string');
  const endDateString = calendarEventDetails.querySelector('.end-date-string');

  // Create object containing date input elements
  const inputElementsObject = createInputElementsObject(calendarEventDetails);

  // Get dateElement data attributes
  const dataDateObject = getDataAttributes(dateElement);

  // Arrays of date string variables to loop over
  const startDateStringInputs = [inputElementsObject.startDateInput, inputElementsObject.startMonthInput, inputElementsObject.startYearInput];
  const endDateStringInputs = [inputElementsObject.endDateInput, inputElementsObject.endMonthInput, inputElementsObject.endYearInput];

  // Give object dates as values to date inputs, adding a '0' before single digit values
  setDateInputValues(inputElementsObject, userEventObject);

  // Create start & end date widget calendar HTML elements
  const widgetCalendarElements = createWidgetCalendarElements();
  const { startWidgetCalendarElement, endWidgetCalendarElement } = widgetCalendarElements;

  // Create new calendar widget Classes for start and end dates
  const startDateWidgetCalendar = new WidgetCalendar({
     element: startWidgetCalendarElement,
     dateObject: dataDateObject,
     type: 'event'
  });
  const endDateWidgetCalendar = new WidgetCalendar({
    element: endWidgetCalendarElement,
    dateObject: dataDateObject,
    type: 'event'
  });

  // Append widget calendar classes to containers
  startDateCalendarContainer.appendChild(startWidgetCalendarElement);
  endDateCalendarContainer.appendChild(endWidgetCalendarElement);
  
  return {
    startDateString,
    endDateString,
    startDateStringInputs,
    endDateStringInputs,
    startDateCalendarContainer,
    endDateCalendarContainer, 
    startDateWidgetCalendar,
    endDateWidgetCalendar
  }
}


// Create object containing date input elements
function createInputElementsObject(calendarEventDetails) {
  return {
    startDateInput: calendarEventDetails.querySelector('.start-date'),
    startMonthInput: calendarEventDetails.querySelector('.start-month'),
    startYearInput: calendarEventDetails.querySelector('.start-year'),
    endDateInput: calendarEventDetails.querySelector('.end-date'),
    endMonthInput: calendarEventDetails.querySelector('.end-month'),
    endYearInput: calendarEventDetails.querySelector('.end-year')
  }
}


// Get dateElement data attributes
function getDataAttributes(dateElement) {
  const dataYear = Number(dateElement.dataset.year);
  const dataMonth = Number(dateElement.dataset.month);
  const dataDate = Number(dateElement.dataset.date);
  return new Date(dataYear, dataMonth - 1, dataDate);
}



// =============================================
//  Set Date Input Values
// =============================================

// Sets startDate and endDate values as default input values on details element.

function setDateInputValues(inputElementsObject, userEventObject) {
  // Destructure dates from userEventObject
  const { dates: { startDate, endDate } } = userEventObject; 

  // Give object dates as values to date inputs, adding a '0' before single digit values
  inputElementsObject.startDateInput.value = formatDateAndTime(startDate.date);
  inputElementsObject.startMonthInput.value = formatDateAndTime(startDate.month);
  inputElementsObject.startYearInput.value = startDate.year;
  inputElementsObject.endDateInput.value = formatDateAndTime(endDate.date);
  inputElementsObject.endMonthInput.value = formatDateAndTime(endDate.month);
  inputElementsObject.endYearInput.value = endDate.year;
}



// =============================================
//  Create Widget Calendar Elements
// =============================================

// Creates start and end date widget calendar elements from template in HTML.

function createWidgetCalendarElements() {
  // Create widget calendar HTML element (start date)
  const startWidgetCalendarTemplate = document.querySelector('.widget-calendar-template');
  const clonedStartCalendarContent = startWidgetCalendarTemplate.content.cloneNode(true);  
  const startWidgetCalendarElement = clonedStartCalendarContent.querySelector('.widget-calendar');

  // Create widget calendar HTML element (end date)
  const endWidgetCalendarTemplate = document.querySelector('.widget-calendar-template');
  const clonedEndCalendarContent = endWidgetCalendarTemplate.content.cloneNode(true);  
  const endWidgetCalendarElement = clonedEndCalendarContent.querySelector('.widget-calendar');

  return { startWidgetCalendarElement, endWidgetCalendarElement }
}