import {
  monthNames,
  getFirstDayIndex,
  highlightCurrentDate,
  getDayCountOfMonth,
  getDayCountOfPreviousMonth,
} from "../utils.js";

import { addSvgIcon } from "../icons/icons.js";


export class WidgetCalendar {
  constructor({ element, dateObject, type }) {
    if (!(element instanceof HTMLElement)) {
      throw new Error("Element should be HTMLElement");
    }

    this.element = element;
    this.dateObject = dateObject;
    this.type = type;
    this.#listenEvents();
  }

  // Allows dates to be passed into widget calendar.
  // Is used in 'widgetCalendarClickFunctionality.js', 'widgetCalendarKeyFunctionality.js', and 'sidebar.js'.

  setClassDate = (year, month, date) => {
    this.year = year;
    this.month = month;
    this.date = date;  
    this.#renderCalendarDateElements();
  }


  // ===============================================
  //  Listen Events
  // ===============================================

  // Allows user to increase / decrease month by clicking left and right arrow buttons.
  // Renders calendar dates for each month loaded.

  #listenEvents = () => {
    const prevMonthButton = this.element.querySelector('.widget-button.widget-previous-month-btn');
    const nextMonthButton = this.element.querySelector('.widget-button.widget-next-month-btn');
    const todayBtn = this.element.querySelector('.widget-button.widget-today-btn-month');

    if (this.type === 'sidebar') {
      addSvgIcon('leftArrow', prevMonthButton, '#000000', '#000000');
      addSvgIcon('rightArrow', nextMonthButton, '#000000', '#000000');
    }

    else if (this.type === 'event') {
      addSvgIcon('leftTriangleArrow', prevMonthButton, 'none', '#808080');
      addSvgIcon('rightTriangleArrow', nextMonthButton, 'none', '#808080');
    }

    // Click previous month
    prevMonthButton.addEventListener('click', () => {
      if (this.month === 1) {
        this.month = 12;
        this.year--;
      } else {
        this.month--;
      }
      this.setClassDate(this.year, this.month, 1);
    });

    // Click next month
    nextMonthButton.addEventListener('click', () => {
      if (this.month === 12) {
        this.month = 1;
        this.year++;
      } else {
        this.month++;
      }
      this.setClassDate(this.year, this.month, 1);
    });

    // Return to current year and month
    todayBtn.addEventListener('click', () => {
      this.year = new Date().getFullYear();
      this.month = new Date().getMonth() + 1;
      this.date = new Date().getDate();

      const dataDateYear = this.dateObject.getFullYear();
      const dataDateMonth = this.dateObject.getMonth() + 1;
      this.setClassDate(dataDateYear, dataDateMonth, 1);
    });

  }


  // ===============================================
  //  Render Calendar Dates
  // ===============================================

  // Clears existing calendar content and creates a date element for each day of the month.
  // Calculates date information and adds to date element.

  #renderCalendarDateElements = () => {
    // Clear before render
    const dateElementContainer = this.element.querySelector('.widget-month-dates');
    dateElementContainer.innerHTML = '';

    // Set date heading (First three letters)
    const dateHeading = this.element.querySelector('.widget-date-heading');
    const monthName = monthNames[this.month - 1];
    const shortMonthName = monthName.slice(0, 3);
    dateHeading.textContent = `${shortMonthName} ${this.year}`;

    const monthDataObject = {
      dayCountInCurrentMonth: getDayCountOfMonth(this.year, this.month),
      firstDayIndexInCurrentMonth: getFirstDayIndex(this.year, this.month),
      dayCountOfLastMonth: getDayCountOfPreviousMonth(this.year, this.month)
    }

    for (let i = 1; i <= 42; i++) {
      // Create date elements and append to container
      const { dateElement, dateInner } = this.#createDateElement();
      dateElementContainer.appendChild(dateElement);
      
      // Calculate calendar dates
      this.#calendarDateInformation(i, dateElement, dateInner, monthDataObject);
    }
  }


  // ===============================================
  //  Create Date Element
  // ===============================================

  // Creates date elements for each day.
  // Inner element displays date number.

  #createDateElement = () => {
    // Create outer and inner elements and add classes.
    const dateElement = document.createElement('div');
    dateElement.classList.add('widget-date-element');
    const dateInner = document.createElement('span'); 
    dateInner.classList.add('date');

    // Append inner element
    dateElement.appendChild(dateInner);

    // Add dataset values
    dateElement.dataset.month = this.month;
    dateElement.dataset.year = this.year;

    return { dateElement, dateInner }
  }


  // ===============================================
  //  Calendar Date Information
  // ===============================================

  // Calculates information for each date element and adds dataset value.
  // Adds separate class for previous and next months.

  #calendarDateInformation = (i, dateElement, dateInner, monthDataObject) => {
    const { dayCountInCurrentMonth, firstDayIndexInCurrentMonth, dayCountOfLastMonth } = monthDataObject;

    // Re-assignable variables for accurate date information
    let date;
    let month;
    let year;

    if (firstDayIndexInCurrentMonth > 1 && i < firstDayIndexInCurrentMonth) {

      // Calculate and display date information for previous month
      date = dayCountOfLastMonth - (firstDayIndexInCurrentMonth - i) + 1;
      month = this.month === 1 ? month = 12 : month = this.month - 1;
      year = this.month === 1 ? year = this.year - 1 : year = this.year;

      // Class for overlapping adjacent months
      dateElement.classList.add('adjacent-month');

      // Assign data attributes for dates in previous month
      dateElement.dataset.date = date;
      this.month === 1 ? dateElement.dataset.month = 12 : dateElement.dataset.month = this.month - 1;
      this.month === 1 ? dateElement.dataset.year = this.year - 1 : dateElement.dataset.year = this.year;

    } else if (i >= dayCountInCurrentMonth + firstDayIndexInCurrentMonth) {

      // Calculate and display date information for next month
      date = i - (dayCountInCurrentMonth + firstDayIndexInCurrentMonth) + 1;
      month = this.month === 12 ? month = 1 : month = this.month + 1;
      year = this.month === 12 ? year = this.year + 1 : year = this.year;

      // Class for overlapping adjacent months
      dateElement.classList.add('adjacent-month');

      // Assign data attributes for dates in next month
      dateElement.dataset.date = date;
      this.month === 12 ? dateElement.dataset.month = 1 : dateElement.dataset.month = this.month + 1;
      this.month === 12 ? dateElement.dataset.year = this.year + 1 : dateElement.dataset.year = this.year;

    } else {

      // Calculate and display date information for current month
      date = i - firstDayIndexInCurrentMonth + 1;
      month = this.month;
      year = this.year;

      // Class for current month
      dateElement.classList.add('current-month');

      // Assign data attributes for dates in current month
      dateElement.dataset.date = date;
    }

    // Highlight current date using date variables defined above
    highlightCurrentDate(year, month, date, dateElement); 

    dateInner.textContent = date;
  }

}