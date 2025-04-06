import {
  createNewCategoryElement,
  createElementsObject,
  createCategoryDetailsObject,
  generateColorIcons,
  windowEventListeners,
  addCategoryToLocalStorage
} from "./addNewCalendarCategory.js";


// ===============================================
//  Add API Category
// ===============================================

// Add API category to sidebar on load if it does not already exist.

export function addApiCategory() {
  const categoriesContainer = document.querySelector('.calendar-categories');
  const apiCategoryContainer = document.querySelector('.api-category-container');
  const apiEventCategory = categoriesContainer.querySelector('.api-calendar-category');
  
  // Only create API event category if element does not already exist
  if (!apiEventCategory) {
    createApiCategoryElement(categoriesContainer, apiCategoryContainer);
  }
}



// ===============================================
//  Create API Category Element
// ===============================================

// Create default API category on load and add to category container.
// Allows user to change the color and rename category.
// Saves category in local storage.

function createApiCategoryElement(categoriesContainer, apiCategoryContainer) {
  // Create new calendar category, add API class and append to container
  const calendarCategoryElement = createNewCategoryElement();
  calendarCategoryElement.classList.add('api-calendar-category');
  apiCategoryContainer.appendChild(calendarCategoryElement);

  // Create an object containing elements within the category element
  const categoryElementsObject = createElementsObject(categoriesContainer, calendarCategoryElement);
  
  // Hide name input and 'delete' button
  hideClasses(categoryElementsObject);

  // Create object to store category details
  const categoryDetailsObject = createCategoryDetailsObject(categoryElementsObject);

  // Generate clickable color icons to personalize categories
  generateColorIcons(categoryElementsObject);

  // Handle window click and Enter key event listeners
  windowEventListeners(categoryElementsObject, categoryDetailsObject);

  // Add category to local storage
  addCategoryToLocalStorage(categoryDetailsObject);
}


function hideClasses(categoryElementsObject) {
  const { categoryNameInput, categoryDeleteButton } = categoryElementsObject;

  categoryNameInput.classList.add('hide'); // Hide category name input
  categoryDeleteButton.classList.add('hide'); // Hide 'delete' button
  categoryDeleteButton.nextElementSibling.classList.add('hide'); // Hide divider under 'delete' button
}
