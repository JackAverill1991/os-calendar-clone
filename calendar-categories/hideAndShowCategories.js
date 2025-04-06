import { updateCategoryInLocalStorage } from "./eventCategoriesLocalStorage.js";
import { monthEventPositioning } from "../calendar-events/monthEventPositioning.js";



// =============================================
//  Hide And Show Categories
// =============================================

// Toggles the visibility of calendar events based on their category when a user clicks on a category in the menu.
// Forces grid reflow to calendar event containers when category is switched off by resetting grid row CSS (is later recalculated in 'monthEventPositioning' function).

function hideAndShowCategories(e, savedCalendarCategories) {
  // Select calendar category from menu and get dataset categoryId
  const calendarCategoryElement = e.target.closest('.calendar-category-wrapper');
  const categoryId = calendarCategoryElement.dataset.categoryId;

  // Toggle 'hide' class on button
  const calendarCategoryButton = e.target.closest('.calendar-category');
  calendarCategoryButton.classList.toggle('hide');

  // Toggle 'hide' class on tick icon
  const tickIcon = calendarCategoryElement.querySelector('.tick-icon');
  tickIcon.classList.toggle('hide');

  // Select calendar content window and find all elements with categoryId dataset (avoids menu items being targeted)
  const contentWindow = document.querySelector('.calendar-class-content');
  const matchingCategoryIdElements = contentWindow.querySelectorAll(`[data-category-id="${categoryId}"]`);

  // Select class container element
  const classElement = document.querySelector('.calendar-class-content').firstChild;
  const isMonthView = classElement.dataset.calendar === 'month';
  
  // Hide calendar event elements from target category
  if (isMonthView) matchingCategoryIdElements.forEach(element => element.classList.toggle('hide'));

  // Ensure that empty event containers revert back to default size when their contents are toggled on and off
  toggleGridReflow(classElement);

  // Organize events according to length in month calendar view to reshuffle lower items to the top
  if (isMonthView) monthEventPositioning(contentWindow, null);

  // Find matching category from savedCategories and update 'visible' property
  const matchingCategoryObject = savedCalendarCategories.find(object => object.categoryId === categoryId);
  matchingCategoryObject.visible = !matchingCategoryObject.visible;

  // Update in localStorage
  updateCategoryInLocalStorage(matchingCategoryObject);
}


function toggleGridReflow(classElement) {
  const calendarEventContainers = classElement.querySelectorAll('.calendar-event-container');

  calendarEventContainers.forEach(element => {
    // Toggle style between 'none' and 'grid', and force a reflow with 'offsetHeight'
    element.style.display = 'none';
    void element.offsetHeight;
    element.style.display = 'grid';

    // Reset grid template rows to 'min-content' before they are recalculated in 'monthEventPositioning' function
    element.style.gridTemplateRows = 'min-content';
  });
}



export { hideAndShowCategories }