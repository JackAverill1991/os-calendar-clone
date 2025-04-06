import { createWidgetCalendars } from "../createWidgetCalendars.js";
import { addWidgetCalendarClickEvents } from "./widgetCalendarClickFunctionality.js";
import { addWidgetCalendarKeyEvents } from "./widgetCalendarKeyFunctionality.js";
import { addTimeInputFunctionality } from "./timeInputFunctionality.js";
import {
  preventExpandOverflow,
  handleOpenUpDetailsExpand,
  verticallyCenterOnExpand
} from "../../event-details-element/detailsElementExpandPositioning.js";



// ===============================================
//  Date & Time Functionality
// ===============================================

// Creates widget calendars using createWidgetCalendars().
// Attaches event listeners to the date summary with dateSummaryEventListeners().

function addDateAndTimeFunctionality(eventElementsObject, userEventObject) {  
  // Create widget calendars
  const widgetCalendars = createWidgetCalendars(userEventObject, eventElementsObject);
  const { startDateWidgetCalendar, endDateWidgetCalendar } = widgetCalendars;

  // Add widget calendar classes to event details object
  eventElementsObject.widgetCalendarClasses = {
    startDateWidgetCalendar,
    endDateWidgetCalendar
  }

  // Attach event listeners to date summary
  dateSummaryEventListeners(eventElementsObject, widgetCalendars, userEventObject);
}



// Initialises widget calendar functionality with one-time click listener attached to dateTimeSummary.
// A second reusable click listener toggles visibility of dateTimeSummary and dateTimeDetails amd prevents overflow when expanding.
// Details element positioning is kept consistent on expand.

function dateSummaryEventListeners(eventElementsObject, widgetCalendars, userEventObject) {
  const { calendarEventElement, calendarEventDetails } = eventElementsObject;

  // Add dateTimeSummary and dateTimeDetails to eventElementsObject
  eventElementsObject.dateTimeSummary = calendarEventDetails.querySelector('.date-and-time-summary');
  eventElementsObject.dateTimeDetails = calendarEventDetails.querySelector('.date-and-time-details');

  // One-time listener for handleWidgetCalendarListeners
  eventElementsObject.dateTimeSummary.addEventListener('click', function oneTimeListener() {
    setTimeout(() => {
      handleWidgetCalendarListeners(eventElementsObject, widgetCalendars, userEventObject);
    }, 10); // Add delay to wait for widget calendars to be created

    // Remove listener after use
    eventElementsObject.dateTimeSummary.removeEventListener('click', oneTimeListener);
  });

  // Reusable listener for toggling date / time details visibility
  eventElementsObject.dateTimeSummary.addEventListener('click', () => {
    const { isDragged, direction: openDirection, isOverflowingBottom } = calendarEventDetails.dataset;

    // Get details element coordinates on click to calculate reposition
    const eventElementCoordinates = calendarEventElement.getBoundingClientRect();

    if (!isDragged && !isOverflowingBottom) {
      if (openDirection === 'openRight' || openDirection === 'openLeft') {
        // Vertically center details element if needed
        verticallyCenterOnExpand(eventElementsObject, eventElementCoordinates);

      } else if (openDirection === 'openUp') {
        // Switches open position from downwards to upwards if overflowing viewport
        handleOpenUpDetailsExpand(eventElementsObject, eventElementCoordinates);
      }
    }

    // Toggle visibility of elements
    eventElementsObject.dateTimeSummary.classList.remove('show');
    eventElementsObject.dateTimeDetails.classList.add('show');

    // Prevent overflow when expanding
    preventExpandOverflow(eventElementsObject);
  });
}



// ===============================================
//  Handle Widget Calendar Listeners
// ===============================================

// Divides start date and end date calendar elements from pop-up details window into separate objects.
// Attaches event 'click' & 'keydown' event listeners to each group of elements.

function handleWidgetCalendarListeners(eventElementsObject, widgetCalendars, userEventObject) {
  // Destructure elements from widget calendar
  const {
    startDateString, endDateString,
    startDateStringInputs, endDateStringInputs,
    startDateCalendarContainer, endDateCalendarContainer,
  } = widgetCalendars;

  // Create object containing start date widget calendar elements
  const startCalendarElements = { 
    dateString: startDateString,
    dateStringInputs: startDateStringInputs,
    calendarContainer: startDateCalendarContainer
  }

  // Create object containing end date widget calendar elements
  const endCalendarElements = { 
    dateString: endDateString,
    dateStringInputs: endDateStringInputs,
    calendarContainer: endDateCalendarContainer
  }

  // Set up handlers for start and end dates
  setupDateHandlers(eventElementsObject, startCalendarElements, userEventObject);
  setupDateHandlers(eventElementsObject, endCalendarElements, userEventObject);

  // Add click / keyboard functionality to start and end time forms
  addTimeInputFunctionality(eventElementsObject, userEventObject);
}


// Helper function to handle events for date strings
function setupDateHandlers(eventElementsObject, widgetCalendarElements, userEventObject) {
  addWidgetCalendarClickEvents(
    eventElementsObject,
    userEventObject,
    widgetCalendarElements
  );

  addWidgetCalendarKeyEvents(
    eventElementsObject,
    userEventObject,
    widgetCalendarElements
  );
}



export { addDateAndTimeFunctionality }