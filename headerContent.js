import { showYearCalendar, showMonthCalendar } from "./calendar-classes/loadAndDisplayClasses.js";
import { addSvgIcon } from "./icons/icons.js";


// Header content
const mainHeader = document.querySelector('.main-header');
const buttonWrapper = document.querySelector('.button-container');
const yearHeaderContent = document.querySelector('.year-header-content');
const monthHeaderContent = document.querySelector('.month-header-content');


// Header buttons
const yearButton = document.querySelector('.year-button');
const monthButton = document.querySelector('.month-button');



// =============================================
//  Configure Header Content
// =============================================

// Adds event listeners to header buttons that switch calendar views and toggle the sidebar.

export function configureHeaderContent() {
  // Event listeners
  yearButton.addEventListener('click', showYearCalendar);
  monthButton.addEventListener('click', showMonthCalendar);

  // Add / remove 'selected' and 'focus' classes on header calendar class buttons
  handleClickClasses();

  // Allow user to hide / show sidebar
  handleToggleSidebar(mainHeader);

  // Toggle 'hover' class on header calendar class buttons
  handleHoverClass();

  // Load prev / next button SVG icons
  const headerArray = [yearHeaderContent, monthHeaderContent];
  headerArray.forEach(header => addButtonArrows(header));
}



// =============================================
//  Handle Click Classes
// =============================================

// Add / remove 'selected' and 'focus' classes on header calendar class buttons.

function handleClickClasses() {
  const allCalendarButtons = mainHeader.querySelectorAll('.main-header-button');

  // Set month as initially selected button
  monthButton.classList.add('selected');

  // Remove 'selected' class from all buttons and add to the one that is clicked
  allCalendarButtons.forEach(button => button.addEventListener('click', () => {
    // Remove classes
    allCalendarButtons.forEach(button => {
      button.classList.remove('focus');
      button.classList.remove('selected');
    });

    // Add 'selected' class
    button.classList.add('selected');
  }));

  // Add 'focus' class to button when mouse is pressed down
  allCalendarButtons.forEach(button => button.addEventListener('mousedown', () => {
    button.classList.add('focus');
  }));
}



// =============================================
//  Handle Hover Class
// =============================================

// Toggle 'hover' class on header calendar class buttons.

function handleHoverClass() {
  buttonWrapper.addEventListener('mouseenter', () => {
    if (!buttonWrapper.classList.contains('hover')) {
      buttonWrapper.classList.add('hover');
    }
  });

  buttonWrapper.addEventListener('mouseleave', (e) => {
    if (buttonWrapper.classList.contains('hover')) {
      buttonWrapper.classList.remove('hover');
    }
  });
}



// =============================================
//  Add Button Arrows
// =============================================

// Load prev / next button SVG icons.

function addButtonArrows(headerContent) {
  // Select buttons
  const prevButton = headerContent.querySelector('.prev-button');
  const nextButton = headerContent.querySelector('.next-button');

  // Add SVG icons
  addSvgIcon('leftArrow', prevButton, '#000000', '#000000');
  addSvgIcon('rightArrow', nextButton, '#000000', '#000000');
}



// =============================================
//  Handle Toggle Sidebar
// =============================================

// Allow user to hide / show sidebar.

function handleToggleSidebar(mainHeader) {
  const sidebarToggleButton = mainHeader.querySelector('.sidebar-toggle-button');

  // Add calendar icon to sidebar toggle button
  addSvgIcon('toggleMenuButton', sidebarToggleButton, 'none', '#3F403F');

  // Toggles class that hides sidebar
  sidebarToggleButton.addEventListener('click', () => {
    document.body.classList.toggle('hide-sidebar');
  });

  // 'mouseenter' and 'mouseleave' toggle hover class on sidebar button
  sidebarToggleButton.addEventListener('mouseenter', () => {
    sidebarToggleButton.classList.toggle('hover');
  });
  sidebarToggleButton.addEventListener('mouseleave', () => {
    sidebarToggleButton.classList.toggle('hover');
  });
}