import { updateCategoryInLocalStorage } from "./editCalendarCategory.js";
import { handleCategoryObjectValues } from "./handleCategoryObjectValues.js";
import { addCategoryToLocalStorage } from "./eventCategoriesLocalStorage.js";
import { eventCategoryColorsObject } from "../utils.js";
import { addSvgIcon } from "../icons/icons.js";


// ===============================================
//  Add Calendar Categories
// ===============================================

// Sets up 'new category' button that allows the user to add custom categories to the sidebar.
// Adds default category as placeholder on first load if none exist.

function addCalendarCategories() {
  // Select calendar categories container and 'new category' button
  const userCategoriesContainer = document.querySelector('.user-added-category-container');
  const newCalendarCategoryButton = document.querySelector('.new-calendar-button');
  const userAddedCategories = userCategoriesContainer.querySelectorAll('.user-added-category');

  // Dataset flag to check whether coategories container is empty and differentiate between default category and ones added with button
  userCategoriesContainer.dataset.hasContent = null;

  // If no user added categories exist in container on app load, add one as default placeholder
  if (userAddedCategories.length === 0) {
    // Set dataset flag to 'false' to prevent input classes being affected and window click listeners being added
    userCategoriesContainer.dataset.hasContent = 'false';
    addNewCalendarCategory(userCategoriesContainer);
  }

  // Add new calendar category when user clicks '+' button in sidebar
  newCalendarCategoryButton.addEventListener('click', () => {
    userCategoriesContainer.dataset.hasContent = 'true'; // Set dataset flag to 'true'  
    addNewCalendarCategory(userCategoriesContainer);
  });
}



// ===============================================
//  Handle New Category Button Click
// ===============================================

// Creates category element and appends to container in sidebar.
// Creates object to store details added to category.

function addNewCalendarCategory(userCategoriesContainer) {
  // Create new calendar category, add class and append to container
  const calendarCategoryElement = createNewCategoryElement();
  calendarCategoryElement.classList.add('user-added-category');
  userCategoriesContainer.appendChild(calendarCategoryElement);

  // Create an object containing elements within the category element
  const categoryElementsObject = createElementsObject(userCategoriesContainer, calendarCategoryElement);

  // Differentiate between categories created by clicking new category button, and the default one added upon first load
  handleDatasetFlag(categoryElementsObject);

  // Add highlight class to category element when added
  addHighlight(calendarCategoryElement, userCategoriesContainer);

  // Generate clickable color icons to personalize categories
  generateColorIcons(categoryElementsObject);
  
  // Create object to store category details
  const categoryDetailsObject = createCategoryDetailsObject(categoryElementsObject);

  // Handle window click and Enter key event listeners
  windowEventListeners(categoryElementsObject, categoryDetailsObject);

  // Add category to local storage
  addCategoryToLocalStorage(categoryDetailsObject);
}


function createElementsObject(userCategoriesContainer, calendarCategoryElement) {
  return {
    userCategoriesContainer,
    calendarCategoryElement,
    calendarCategoryButton: calendarCategoryElement.querySelector('.calendar-category'),
    categoryNameInput: calendarCategoryElement.querySelector('.category-name-input'),
    categoryNameElement: calendarCategoryElement.querySelector('.calendar-category-name'),
    categorySettingsElement: calendarCategoryElement.querySelector('.calendar-category-settings'),
    colorIconContainer: calendarCategoryElement.querySelector('.color-icon-container'),
    categoryDeleteButton: calendarCategoryElement.querySelector('.delete-category-button')
  }
}



// ===============================================
//  Create New Calendar Category
// ===============================================

// Builds DOM element for category from template.
// Adds tick icon to tickbox.

function createNewCategoryElement() {
  // Create category button from template
  const template = document.querySelector('.calendar-category-template').content.cloneNode(true);
  const calendarCategory = template.querySelector('.calendar-category-wrapper');
  
  // Select tickbox
  const tickbox = calendarCategory.querySelector('.tickbox');

  // Add 'tick' SVG to tickbox (Parameters are icon, container, strokeColor, fillColor)
  addSvgIcon('tickIcon', tickbox, '#ffffff', 'none');

  return calendarCategory;
}



// ===============================================
//  Handle Dataset Flag
// ===============================================

// Use dataset flag to handle which elements are visible when category is created.
// When default category is created on initial load, input is hidden and name is displayed.
// When subsequent categories are added, name is hidden and input is displayed.

function handleDatasetFlag(categoryElementsObject) {
  const { userCategoriesContainer, calendarCategoryButton, categoryNameInput, categoryNameElement } = categoryElementsObject;

  if (userCategoriesContainer.dataset.hasContent === 'false') { // Set dataset flag to 'false'
    categoryNameInput.classList.add('hide'); // Hide name element on load
    calendarCategoryButton.classList.add('highlight'); // Add highlight class to button
  }
  else {
    categoryNameInput.focus(); // Focus (add text cursor) on load
    categoryNameElement.classList.add('hide'); // Hide name element on load
  }
}



// ===============================================
//  Create New Calendar Category Object
// ===============================================

// Create object to store category details.
// Add default information to new categories.

function createCategoryDetailsObject(categoryElementsObject) {
  // Create object to store category details
  const categoryDetailsObject = {};

  // Add details to new categories
  handleCategoryObjectValues(categoryElementsObject, categoryDetailsObject);
  return categoryDetailsObject;
}



// ===============================================
//  Toggle Element Classes
// ===============================================

// Toggle 'hide' class on name input and name element .
// Reverses the order and shows one / hides the other.

function toggleElementClasses(categoryElementsObject) {
  const { categoryNameInput, categoryNameElement } = categoryElementsObject;

  categoryNameInput.classList.toggle('hide');
  categoryNameElement.classList.toggle('hide');
}



// ===============================================
//  Generate Color Icons
// ===============================================

// Generate color icons that can be clicked to change the category theme color.

function generateColorIcons(categoryElementsObject) {
  const { colorIconContainer } = categoryElementsObject;

  // Clear the container to prevent duplication
  colorIconContainer.innerHTML = '';

  Object.entries(eventCategoryColorsObject).forEach(([key, { highlight }]) => {
    // Create color element, add class, and add main color as dataset value
    const colorIcon = document.createElement('div'); 
    colorIcon.classList.add('color-icon');
    colorIcon.dataset.colorPaletteKey = key; // Set color name as dataset value

    // Add main color as background color value
    colorIcon.style.backgroundColor = `#${highlight}`;

    // Append colorIcons to settings element
    colorIconContainer.appendChild(colorIcon);
  });
}



// ===============================================
//  Add Highlight
// ===============================================

// Adds 'highlight' class to clicked category button and removes class from all others.

function addHighlight(calendarCategoryElement, userCategoriesContainer) {
  const allCalendarCategoryButtons = userCategoriesContainer.querySelectorAll('.calendar-category');

  // Remove highlight class from all category elements and add to one that is clicked
  allCalendarCategoryButtons.forEach(element => element.classList.remove('highlight'));
  const calendarCategoryButton = calendarCategoryElement.querySelector('.calendar-category');
  calendarCategoryButton.classList.add('highlight');
}



// ===============================================
//  Window Event Listeners
// ===============================================

// Handles the change in classes on newly added category elements when window is clicked or 'Enter' key pressed.
// Updates category in local storage.

function windowEventListeners(categoryElementsObject, categoryDetailsObject) {
  const { userCategoriesContainer, categoryNameInput, categoryNameElement } = categoryElementsObject;

  if (userCategoriesContainer.dataset.hasContent === 'true') {
    // Set up event listener functionality for window click
    window.addEventListener('click', handleWindowClick);
    window.addEventListener('keydown', handleEnterKeyPress);
  }

  function handleWindowClick(e) {
    // Conditional checks for window click
    const isCategoryNameInput = e.target !== categoryNameInput;
    const isSettingsButton = e.target.classList.contains('settings-button');
    const isNewCalendarButton = e.target.classList.contains('new-calendar-button');

    if ((isCategoryNameInput || isSettingsButton) && !isNewCalendarButton) {
      // Call shared functions if window is clicked
      sharedEventListenerFunctions();
    }
  }

  // Call shared functions if 'Enter' key is pressed
  function handleEnterKeyPress(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
      // Call shared functions
      sharedEventListenerFunctions();
    }
  }

  function sharedEventListenerFunctions() {
    // Set name element text to 'Untitled' if input left blank, else add input value (category name) to name element
    if (categoryNameInput.value === '') {
      categoryNameElement.textContent = 'Untitled'; 
    } else {
      categoryNameElement.textContent = categoryNameInput.value;
    }
    // Hide input and show name element
    toggleElementClasses(categoryElementsObject);
    
    // Add calendar category object to local storage
    updateCategoryInLocalStorage(categoryDetailsObject);

    // Remove both event listeners once one is carried out
    window.removeEventListener('click', handleWindowClick);
    window.removeEventListener('keydown', handleEnterKeyPress);
  }
}



export {
  addCalendarCategories,
  createNewCategoryElement,
  createElementsObject,
  createCategoryDetailsObject,
  handleCategoryObjectValues,
  toggleElementClasses,
  generateColorIcons,
  windowEventListeners,
  addCategoryToLocalStorage
}