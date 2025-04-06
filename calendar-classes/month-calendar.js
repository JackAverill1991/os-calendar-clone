import { globalDate } from "../index.js";
import { updateClasses } from "./loadAndDisplayClasses.js";
import { loadApiEventElements} from "../calendar-events/api-events/loadApiCalendarEvents.js";
import { openAPICalendarEvents} from "../calendar-events/api-events/openApiCalendarEvents.js";
import { loadCalendarEvents } from "../calendar-events/user-added-events/loadCalendarEvents.js";
import { addNewCalendarEvent } from "../calendar-events/user-added-events/addNewCalendarEvent.js";
import { editCalendarEvents } from "../calendar-events/user-added-events/editCalendarEvents.js";
import { handleEventButtonClick } from "../calendar-events/eventButtonClickFunctionality.js";
import { monthEventPositioning } from "../calendar-events/monthEventPositioning.js";
import {
  monthNames,
  getFirstDayIndex,
  highlightCurrentDate,
  getDayCountOfMonth,
  getDayCountOfPreviousMonth
} from "../utils.js";


export class MonthCalendar {
  constructor({ element, prevYearData, currentYearData, nextYearData }) {
    if (!(element instanceof HTMLElement)) {
      throw new Error("Element should be HTMLElement");
    }
    this.element = element;
    this.currentYearData = currentYearData;
    this.prevYearData = prevYearData;
    this.nextYearData = nextYearData;
    this.#listenEvents();
  }


  // ===============================================
  //  Initialize Calendar Class & Set Global Date
  // ===============================================

  // Sets up initial load for month calendar class with dates from global date object.
  // Renders calendar dates and event elements.
  // Sets up functionality allowing user to open API events and add custom events.

  init = (year, month, date) => {
    // Get dates from globalDate object
    this.#setGlobalDate(year, month, date);

    // Set dataset on calendar class element to 'month'
    this.element.dataset.calendar = 'month';

    // Render calendar dates and load API and user-added events
    this.#sharedMonthClassFunctions();

    // Add click functionality to calendar event buttons
    handleEventButtonClick(this.element);

    // Generate event details elements when API event buttons are clicked
    openAPICalendarEvents(this.element);
  }


  #setGlobalDate = (year, month, date) => {
    // Set date variables specific to this class
    this.year = year;
    this.month = month;
    this.date = date;

    // Update the global date
    globalDate.year = this.year;
    globalDate.month = this.month;
    globalDate.date = this.date;

    // Return the updated globalDate object
    return globalDate;
  }



  // ===============================================
  //  Listen Events
  // ===============================================

  // Allows user to increase / decrease month by clicking left and right arrow buttons.
  // The 'today' button resets calendar to current month.
  // Renders calendar dates and event elements for each month loaded.
  // Updates functionality allowing user to open API events and add custom events.

  #listenEvents = () => {
    const prevMonthButton = document.querySelector('.previous-month-btn');
    const nextMonthButton = document.querySelector('.next-month-btn');
    const todayBtn = document.querySelector('.today-btn-month');

    // Click previous month
    prevMonthButton.addEventListener('click', async () => {
      if (this.month === 1) {
        this.month = 12;
        this.year--;

        // Update classes from API or localStorage
        await updateClasses(this.year);

      } else {
        this.month--;
      }
      // Update globalDate object
      this.#setGlobalDate(this.year, this.month, 1);

      // Render calendar dates and load API and user-added events
      this.#sharedMonthClassFunctions();
    });

    // Click next month
    nextMonthButton.addEventListener('click', async () => {
      if (this.month === 12) {
        this.month = 1;
        this.year++;

        // Update classes from API or localStorage
        await updateClasses(this.year);        

      } else {
        this.month++;
      }
      // Update globalDate object
      this.#setGlobalDate(this.year, this.month, 1);

      // Render calendar dates and load API and user-added events
      this.#sharedMonthClassFunctions();
    });

    // Return to current year and month
    todayBtn.addEventListener('click', async () => {
      const currentDate = new Date();
      this.year = currentDate.getFullYear();
      this.month = currentDate.getMonth() + 1;
      this.date = currentDate.getDate();

      // Update classes from API or localStorage
      await updateClasses(this.year);

      // Update globalDate object
      this.#setGlobalDate(this.year, this.month, this.date);

      // Render calendar dates and load API and user-added events
      this.#sharedMonthClassFunctions();
    });
  }



  // ===============================================
  //  Shared Month Class Functions
  // ===============================================

  // Functions that are called each time the calendar display is loaded.

  #sharedMonthClassFunctions = () => {
    // Render calendar dates
    this.#renderCalendarDateElements();

    // Call API events for current year, and adjacent years when there are overlapping dates
    this.#handleApiCalendarEvents();

    // Call functions for handling user calendar events 
    this.#userCalendarEventFunctions();
  }



  // ===============================================
  //  Render Calendar Date Elements
  // ===============================================

  // Clears existing calendar content and creates a date element for each day of the month.
  // Calculates date information and adds to date element.

  #renderCalendarDateElements = () => {
    const dateElementContainer = this.element.querySelector('.month-dates');
    // Clear date elements before rendering new ones
    dateElementContainer.innerHTML = '';

    // Set date heading
    const dateHeading = document.querySelector('.date-heading');
    dateHeading.innerHTML = `<span>${monthNames[this.month - 1]}</span> <span>${this.year}</span>`;

    // Get date information
    const monthDataObject = {
      firstDayIndex: getFirstDayIndex(this.year, this.month),
      dayCountInCurrentMonth: getDayCountOfMonth(this.year, this.month),
      dayCountOfLastMonth: getDayCountOfPreviousMonth(this.year, this.month)
    }

    for (let i = 1; i <= 42; i++) {
      const dateElementObject = this.#createDateElement(i);
      const { dateElement, dateContainer } = dateElementObject;

      // Calculate calendar dates and dataset values
      this.#calendarDateInformation(i, dateElementObject, monthDataObject);

      // Append child elements to date elements
      dateElementContainer.appendChild(dateElement);

      // Add 1st of month
      this.#addFirstOfMonthTitle(dateContainer);  
    }
  }



  // ===============================================
  //  Create Date Element
  // ===============================================

  // Creates month date element with clickable event container inside.

  #createDateElement = (i) => {
    // Create date elements for each day
    const dateElement = document.createElement('div');
    dateElement.classList.add('date-element');

    // Calculate the row number
    let rowNumber = Math.ceil(i / 7);
    // dateElement.setAttribute('row-number', rowNumber);
    dateElement.dataset.rowNumber = rowNumber;

    // Assign dataset value from 1 to 7
    dateElement.dataset.dayValue = (i - 1) % 7 + 1;

    // Create date container (wraps dates and month titles)
    const dateContainer = document.createElement('div');
    dateContainer.classList.add('date-container');

    // Create date numbers in date elements
    const calendarDate = document.createElement('span');
    calendarDate.classList.add('date');

    // Create event containers
    const calendarEventContainer = document.createElement('div');
    calendarEventContainer.classList.add('calendar-event-container');

    // Add calculated dates to date elements and append child elements to date elements
    dateContainer.appendChild(calendarDate);
    dateElement.appendChild(dateContainer);
    dateElement.appendChild(calendarEventContainer);

    return { dateElement, calendarDate, dateContainer };
  }



  // ===============================================
  //  Calendar Date Information
  // ===============================================

  // Gets date information for each date element based on the date index.
  // Adds relevant classes and dataset values to date elements.

  #calendarDateInformation = (i, dateElementObject, monthDataObject) => {
    const { dateElement, calendarDate } = dateElementObject;
    const { firstDayIndex, dayCountInCurrentMonth, dayCountOfLastMonth } = monthDataObject;

    // Re-assignable variables for cross-month dates
    let date;
    let month;
    let year;

    if (firstDayIndex > 1 && i < firstDayIndex) {
      // Calculate and display date information for previous month
      date = dayCountOfLastMonth - (firstDayIndex - i) + 1;
      month = this.month === 1 ? 12 : this.month - 1;
      year = this.month === 1 ? this.year - 1 : this.year;

      // Class for overlapping adjacent month dates
      dateElement.classList.add('adjacent-month');

      // Set previous month data attributes
      this.#setDateAttributes(dateElement, date, month, year, true);
    }

    else if (i >= dayCountInCurrentMonth + firstDayIndex) {
      // Calculate and display date information for next month
      date = i - (dayCountInCurrentMonth + firstDayIndex) + 1;
      month = this.month === 12 ? 1 : this.month + 1;
      year = this.month === 12 ? this.year + 1 : this.year;

      // Class for overlapping adjacent month dates
      dateElement.classList.add('adjacent-month');

      // Set next month data attributes
      this.#setDateAttributes(dateElement, date, month, year, true);
    }

    else {
      // Calculate and display date information for current month
      date = i - firstDayIndex + 1;
      month = this.month;
      year = this.year

      // Class for current month dates
      dateElement.classList.add('current-month');

      // Set current month data attributes
      this.#setDateAttributes(dateElement, date, month, year, false);
    }

    // Highlight current date using date variables defined above
    highlightCurrentDate(year, month, date, dateElement);

    // Add calculated dates to date element
    calendarDate.textContent = date;
  }


  // Helper function to set date element attributes
  #setDateAttributes = (element, date, month, year, isAdjacent = false) => {
    element.dataset.date = date;
    element.dataset.month = month;
    element.dataset.year = year;
    if (isAdjacent) element.classList.add('adjacent-month');
  }



  // ===============================================
  //  Handle API Calendar Events
  // ===============================================

  // Loads API events for calendar month, accounting for overlapping years in January and December.

  #handleApiCalendarEvents = () => {
    // Generate events for current year
    loadApiEventElements(this.currentYearData, this.element);

    // Generate overlapping events for adjacent years
    if (this.month === 1) {
      loadApiEventElements(this.prevYearData, this.element);
    }
    if (this.month === 12) {
      loadApiEventElements(this.nextYearData, this.element);
    }
  }



  // ===============================================
  //  User Calendar Event Functions
  // ===============================================

  // Loads user-added calendar events, whilst allowing editing, deleting and adding new events.
  // Recalculates event elements to ensure correct positioning.

  #userCalendarEventFunctions = () => {
    // Load calendar events from localStorage
    loadCalendarEvents(this.element);

    // Click dateElements to add new user-added events
    addNewCalendarEvent(this.element);

    // Enable editing of user-added events
    editCalendarEvents(this.element);

    // Organize events according to length in month calendar view
    monthEventPositioning(this.element, null)
  }



  // ===============================================
  //  Add First Of Month Title
  // ===============================================

  // Adds the first three letters of month to the date information on the first of each month.

  #addFirstOfMonthTitle = (dateContainer) => {
    const dataDate = parseInt(dateContainer.parentElement.getAttribute('data-date'));
    const dataMonth = parseInt(dateContainer.parentElement.getAttribute('data-month'));
    if (dataDate === 1) {
      const monthTitle = document.createElement('span');
      monthTitle.classList.add('month-title');
      monthTitle.textContent = monthNames[dataMonth - 1].slice(0, 3);
      dateContainer.appendChild(monthTitle);
    }
  }

}