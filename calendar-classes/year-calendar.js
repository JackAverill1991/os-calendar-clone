import { globalDate } from "../index.js";
import { updateClasses } from "./loadAndDisplayClasses.js";
import { loadYearClassCalendarEvents } from "../calendar-events/loadYearClassCalendarEvents.js";
import { monthNames, getFirstDayIndex, highlightCurrentDate, getDayCountOfMonth } from "../utils.js";


export class YearCalendar {

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

  // Sets up initial load for year calendar class with dates from global date object.
  // Renders calendar dates.
  // Sets up functionality allowing user to load API and user-added events.

  init = (year, month, date) => {
    // Get dates from globalDate object
    this.#setGlobalDate(year, month, date);

    // Set dataset on calendar class element to 'year'
    this.element.dataset.calendar = 'year';

    // Render year month calendars
    this.#renderYearMonthCalendars();

    // Handle event data from local storage
    loadYearClassCalendarEvents(this.element, this.prevYearData, this.currentYearData, this.nextYearData);
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

  // Allows user to increase / decrease year by clicking left and right arrow buttons.
  // The 'today' button resets calendar to current year.
  // Renders calendar date elements for each year loaded.
  // Updates functionality allowing user to load API and user-added events

  #listenEvents = () => {
    const prevYearBtn = document.querySelector('.previous-year-btn');
    const nextYearBtn = document.querySelector('.next-year-btn');
    const todayBtn = document.querySelector('.today-btn-year');
    
    // Click previous year
    prevYearBtn.addEventListener('click', () => {
      this.year--; // Decrease year by 1

      this.#sharedListenEventFunctions();
    });

    // CLick next year
    nextYearBtn.addEventListener('click', () => {
      this.year++; // Increase year by 1

      this.#sharedListenEventFunctions();
    });

    // Return to current year
    todayBtn.addEventListener('click', () => {
      // Get current date values
      this.year = new Date().getFullYear();
      this.month = new Date().getMonth() + 1;
      this.date = new Date().getDate();

      this.#sharedListenEventFunctions();
    });
  }



  // ===============================================
  //  Shared Year Class Functions
  // ===============================================

  // Functions that are called each time the calendar display is loaded.

  #sharedListenEventFunctions = async () => {
    // Update classes from API or localStorage
    await updateClasses(this.year);

    // Update global date object
    this.#setGlobalDate(this.year, this.month, 1);

    // Render year month calendars
    this.#renderYearMonthCalendars();

    // Handle event data from local storage
    loadYearClassCalendarEvents(this.element, this.prevYearData, this.currentYearData, this.nextYearData);
  }



  // ===============================================
  //  Render Year Month Calendars
  // ===============================================

  // Renders calendars from template for each month of the calendar year.

  #renderYearMonthCalendars = () => {
    // Select container and clear templates before render
    const yearCalendarWrapper = this.element.querySelector('.calendar-wrapper.year-view');
    yearCalendarWrapper.innerHTML = '';
    
    // Set date heading
    const dateHeading = document.querySelector('.date-heading');
    dateHeading.textContent = this.year;

    // Create template
    const calendarTemplate = this.element.querySelector('.calendar-month-template');

    for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
      // Clone calendar month template for each month of the year
      const monthClone = this.#createMonthClone(monthIndex, calendarTemplate);

      // Generate date elements for each month calendar
      this.#generateDateElements(monthClone, monthIndex);

      // Append each calendar to container
      yearCalendarWrapper.appendChild(monthClone);
    }
  }

  #createMonthClone = (monthIndex, template) => {
    const clone = template.content.cloneNode(true);
    const monthTitle = clone.querySelector('.month-title');
    monthTitle.textContent = monthNames[monthIndex - 1];
    return clone;
  }



  // ===============================================
  //  Generate Date Elements
  // ===============================================

  // Clears existing calendar content and creates date elements for each month of the year.
  // Calculates date information and adds to date element.

  #generateDateElements = (monthClone, monthIndex) => {
    // Clear container before render
    const datesContainer = monthClone.querySelector('.year-dates');
    datesContainer.innerHTML = ''; 

    // Get day count of month and first day index
    const dayCountInCurrentMonth = getDayCountOfMonth(this.year, monthIndex);
    const firstDayIndex = getFirstDayIndex(this.year, monthIndex);

    // Generate buttons for each date in the month view
    for (let i = 1; i <= 42; i++) {
      const { dateElement, dateInner } = this.#createDateElement(datesContainer);
      let date;

      if (firstDayIndex > 1 && i < firstDayIndex) {
        // Dates from previous month
        const prevMonthIndex = monthIndex === 1 ? 12 : monthIndex - 1;
        const prevMonthYear = monthIndex === 1 ? this.year - 1 : this.year;
        const daysInPrevMonth = getDayCountOfMonth(prevMonthYear, prevMonthIndex);
        date = daysInPrevMonth - (firstDayIndex - i) + 1;
        this.#setDateAttributes(dateElement, date, prevMonthIndex, prevMonthYear, true);
      }

      else if (i >= dayCountInCurrentMonth + firstDayIndex) {
        // Dates from next month
        const nextMonthIndex = monthIndex === 12 ? 1 : monthIndex + 1;
        const nextMonthYear = monthIndex === 12 ? this.year + 1 : this.year;
        date = i - (dayCountInCurrentMonth + firstDayIndex) + 1;
        this.#setDateAttributes(dateElement, date, nextMonthIndex, nextMonthYear, true);
      }

      else {
        // Dates in the current month
        date = i - firstDayIndex + 1;
        highlightCurrentDate(this.year, monthIndex, date, dateElement);
        this.#setDateAttributes(dateElement, date, monthIndex, this.year);
      }

      // Add date value to date element
      dateInner.textContent = date;
    }
  }


  // Helper function to set date element attributes
  #setDateAttributes = (element, date, month, year, isAdjacent = false) => {
    element.dataset.date = date;
    element.dataset.month = month;
    element.dataset.year = year;
    if (isAdjacent) element.classList.add('adjacent-month');
  }



  // ===============================================
  //  Create Date Element
  // ===============================================

  // Creates clickable date element.

  #createDateElement = (datesContainer) => {
    // Create date element and add class
    const dateElement = document.createElement('div');
    dateElement.classList.add('date-element');

    // Add contents
    dateElement.innerHTML = `<span class="date"></span>`;

    // Select dateInner from date element
    const dateInner = dateElement.querySelector('.date');

    // Append date element to container
    datesContainer.appendChild(dateElement);

    // Return references to specific elements if needed
    return { dateElement, dateInner }
  }

}