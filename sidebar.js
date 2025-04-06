import { WidgetCalendar } from "./calendar-classes/widget-calendar.js";


// ===============================================
//  Sidebar Widget Calendar
// ===============================================

// Initializes a sidebar widget calendar by cloning a template, creating a WidgetCalendar instance, setting its date, and appending it to the sidebar. 
// Removes the "Today" button and restructures the button container.

export function sidebarWidgetCalendar() {
  const widgetCalendarContainer = document.querySelector('.sidebar-widget-calendar');

  // Create widget calendar HTML element (start date)
  const widgetCalendarTemplate = document.querySelector('.widget-calendar-template').content.cloneNode(true);
  const widgetCalendarElement = widgetCalendarTemplate.querySelector('.widget-calendar');

  // Create date object
  const dateObject = new Date();

  // Add new calendar widget Class
  const sidebarWidgetCalendar = new WidgetCalendar({ element: widgetCalendarElement, dateObject, type: 'sidebar'});
  sidebarWidgetCalendar.setClassDate(dateObject.getFullYear(), dateObject.getMonth() + 1, dateObject.getDate());

  // Append the DOM element to the container
  widgetCalendarContainer.appendChild(widgetCalendarElement);

  // Select button container and remove "today" button
  const buttonContainer = widgetCalendarElement.querySelector('.calendar-buttons');
  const todayButton = buttonContainer.querySelector('.widget-today-btn-month');
  todayButton.remove();

  // Select all children and use spread operator to replace the parent element with children
  const calendarButtons = buttonContainer.children;
  buttonContainer.replaceWith(...calendarButtons);
}