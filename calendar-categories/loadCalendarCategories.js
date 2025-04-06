import {
  createNewCategoryElement,
  createElementsObject,
  handleCategoryObjectValues,
  generateColorIcons
} from "./addNewCalendarCategory.js";

import { getCategoriesFromLocalStorage } from "./eventCategoriesLocalStorage.js";


// =============================================
//  Load Calendar Categories
// =============================================

// Gets array of categories from local storage and builds category menu elements, appending each to container.

export function loadCalendarCategories() {
  // Select category containers
  const userCategoriesContainer = document.querySelector('.user-added-category-container');
  const apiCategoryContainer = document.querySelector('.api-category-container');

  // Get category array from local storage
  const calendarCategoriesArray = getCategoriesFromLocalStorage();

  calendarCategoriesArray.forEach(categoryDetailsObject => {
    // Build new element for every event category object in the array
    const calendarCategoryElement = buildCalendarCategory(userCategoriesContainer, categoryDetailsObject);

    // Handle separate functionality for API category and user-added categories
    appendCategoryToContainer(categoryDetailsObject, calendarCategoryElement, userCategoriesContainer, apiCategoryContainer);
  });

  // Select all user added categories and add 'highlight' class to first one
  highlightFirstCategory();
}



// =============================================
//  Build Calendar Category
// =============================================

// Builds category element and settings menu from template for each category in array.

function buildCalendarCategory(userCategoriesContainer, categoryDetailsObject) {
  // Create calendar category element for each object in array and append to container
  const calendarCategoryElement = createNewCategoryElement();

  // Create object from category and container elements 
  const categoryElementsObject = createElementsObject(userCategoriesContainer, calendarCategoryElement);

  // Hide name input
  categoryElementsObject.categoryNameInput.classList.add('hide');
  
  // Generate clickable color icons to personalize categories
  generateColorIcons(categoryElementsObject);

  // Add values from object to elements
  handleCategoryObjectValues(categoryElementsObject, categoryDetailsObject);

  // Remove 'delete' button from API category settings menu
  hideApiCategoryDeleteBtn(categoryDetailsObject, categoryElementsObject);

  return calendarCategoryElement;
}



// =============================================
//  Append Category To Container
// =============================================

// Appends each category to the container element in the sidebar.
// Separates user-added and API categories into separate containers.

function appendCategoryToContainer(categoryDetailsObject, calendarCategoryElement, userCategoriesContainer, apiCategoryContainer) {
  // Add category classes and append to either API or user-added containers
  if (categoryDetailsObject.categoryId === 'apiCategoryObject') {
    calendarCategoryElement.classList.add('api-calendar-category');
    apiCategoryContainer.appendChild(calendarCategoryElement);
  } else {
    calendarCategoryElement.classList.add('user-added-category');
    userCategoriesContainer.appendChild(calendarCategoryElement);
  }
}



// =============================================
//  Highlight First Category
// =============================================

// Highlight first category in list.

function highlightFirstCategory() {
  const allCategoryElements = [...document.querySelectorAll('.user-added-category')];
  if (allCategoryElements.length > 0) {
    allCategoryElements[0].querySelector('.calendar-category').classList.add('highlight');
  }
}



// =============================================
//  Hide API Category Delete Button
// =============================================

// Hide 'delete' button in settings menu for API category.

function hideApiCategoryDeleteBtn(categoryDetailsObject, categoryElementsObject) {
  const { categoryDeleteButton } = categoryElementsObject;

  if (categoryDetailsObject.categoryId === 'apiCategoryObject') {
    categoryDeleteButton.classList.add('hide');
    categoryDeleteButton.nextElementSibling.classList.add('hide');
  }
}