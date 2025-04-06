import { createElementsObject, toggleElementClasses } from "./addNewCalendarCategory.js";
import { getCategoriesFromLocalStorage, updateCategoryInLocalStorage } from "./eventCategoriesLocalStorage.js";
import { handleCategoryObjectValues, updateCategoryColorProfile, updateCalendarButtonColors } from "./handleCategoryObjectValues.js";
import { hideAndShowCategories } from "./hideAndShowCategories.js";
import { updateSearchResults } from "../search-form/searchbarFunctionality.js";


// =============================================
//  Edit Calendar Categories
// =============================================

// Enables various methods of editing events.
// Allows name and color profile change.

function editCalendarCategories() {
  const categoriesContainer = document.querySelector('.calendar-categories');
  attachEventListeners(categoriesContainer);
}


// =============================================
//  Categories Container Event Listeners
// =============================================

// Attaches event listeners to categories container.
// Handles 'click', 'dblclick', 'mouseOver' & 'mouseOut' behaviour.

function attachEventListeners(categoriesContainer) {
  categoriesContainer.addEventListener('dblclick', (e) => handleDblClick(e, categoriesContainer));
  categoriesContainer.addEventListener('click', (e) => handleClick(e, categoriesContainer));
  categoriesContainer.addEventListener('mouseover', handleMouseOver);
  categoriesContainer.addEventListener('mouseout', handleMouseOut);
}


// Attach event listener to category container to allow for dynamically added items.
function handleDblClick(e, categoriesContainer) {
  if (e.target.matches('.calendar-category, .calendar-category-name')) {

    // Handle double click event listener
    handleCategoryNameDblClick(e, categoriesContainer);
  }
}


function handleClick(e, categoriesContainer) {
  // Load newly updated list of calendar categories from localStorage
  const savedCalendarCategories = getCategoriesFromLocalStorage();

  // Add highlight on click
  if (e.target.closest('.calendar-category-wrapper') && !e.target.closest('.calendar-category-settings')) {
    addHighlightOnClick(e, categoriesContainer);
  }

  // Toggle category visibility when clicking tick box
  if (e.target.closest('.tickbox')) {
    hideAndShowCategories(e, savedCalendarCategories);

    // Update search results element results if it is open
    updateSearchResults();
  }

  // Handle settings button click
  if (e.target.matches('.settings-button')) {
    handleSettingsButtonClick(e);
    toggleClickedClass(e);
  }

  // Handle color icon click
  if (e.target.classList.contains('color-icon')) {
    handleColorIconClick(e, savedCalendarCategories);
  }

  // Handle 'rename' button click
  if (e.target.classList.contains('rename-category-button')) {
    handleRenameButtonClick(e, categoriesContainer, savedCalendarCategories);
  }
}


// Show setting menu button when hovering over category button.
function handleMouseOver(e) {
  if (e.target.closest('.calendar-category-wrapper')) {
    const categoryElement = e.target.closest('.calendar-category-wrapper');
    const settingsButton = categoryElement.querySelector('.settings-button');
    settingsButton.classList.add('hover');
  }
}


// Hide setting menu button when mouse leaves category button.
function handleMouseOut(e) {
  if (e.target.closest('.calendar-category-wrapper')) {
    const categoryElement = e.target.closest('.calendar-category-wrapper');
    const settingsButton = categoryElement.querySelector('.settings-button');
    settingsButton.classList.remove('hover');
  }
}



// =============================================
//  Get Matching Category Object
// =============================================

// Gets matching category details object from category element dataset ID.

function getMatchingCategoryObject(e, savedCalendarCategories) {
  // Select parent of clicked item for dataset access
  const calendarCategoryElement = e.target.closest('.calendar-category-wrapper');

  // Select unique category ID from element dataset
  const categoryId = calendarCategoryElement.dataset.categoryId; 
  
  // Find object in saved calendar categories array that has matching category ID to clicked element
  return savedCalendarCategories.find(object => object.categoryId === categoryId);
}



// =============================================
//  Settings Button Click
// =============================================

// Toggles category settings menu when button is clicked.

function handleSettingsButtonClick(e) {
  const calendarCategoryElement = e.target.closest('.calendar-category-wrapper');

  // Add elements to object for passing into functions
  const categoryElementsObject = {
    calendarCategoryElement,
    categoryNameInput: calendarCategoryElement.querySelector('.category-name-input'),
    categoryNameElement: calendarCategoryElement.querySelector('.calendar-category-name'),
    categoriesContainer: document.querySelector('.calendar-categories'),
    categorySettingsButton: calendarCategoryElement.querySelector('.settings-button')
  }

  // Select all calendar categories within container
  const allCalendarCategoryElements = categoryElementsObject.categoriesContainer.querySelectorAll('.calendar-category-wrapper');

  // Open category settings menu when menu buttons are clicked
  toggleCategorySettings(categoryElementsObject);

  // Handle window click and Enter key event listeners
  settingsWindowEventListeners(allCalendarCategoryElements);
}


function toggleCategorySettings(categoryElementsObject) {
  const { calendarCategoryElement } = categoryElementsObject;

  // Select group of all category settings elements 
  const allCategorySettingsElements = document.querySelectorAll('.calendar-category-settings');

  // Select current target category settings element
  const categorySettingsElement = calendarCategoryElement.querySelector('.calendar-category-settings');

  // Check if settings element already has 'show' class
  const isCurrentlyShown = categorySettingsElement.classList.contains('show');
  
  // Remove the 'show' class from all elements
  allCategorySettingsElements.forEach(element => element.classList.remove('show'));

  // Toggle the 'show' class only if it was not already shown
  if (!isCurrentlyShown) {
    categorySettingsElement.classList.add('show');
  }
}


function toggleClickedClass(e) {
  if (e.target.closest('.settings-button')) {
    // Preemtively remove 'clicked' class from all settings buttons
    removeClassFromAllButtons();

    // Select target button
    const settingsButton = e.target.closest('.settings-button');

    // Add classes 'clicked' (keeps button visible) and 'no click' (prevents 'clicked' class being re-added when closing menu with button)
    settingsButton.classList.add('clicked', 'no-click');

    // Add the window event listener only when a settings button is clicked
    window.addEventListener('click', removeClickedClass);
  }
}


function removeClickedClass(e) {
  // If the click is outside any '.settings-button' or '.calendar-category-settings', remove the `click` class and the listener
  if (!e.target.closest('.settings-button') && !e.target.classList.contains('calendar-category-settings')) {

    // Remove 'clicked' and 'no-click' class from all settings buttons
    removeClassFromAllButtons();

    // Remove the click event listener after it fires
    window.removeEventListener('click', removeClickedClass);
  }
}


function removeClassFromAllButtons() {
  const settingsButtons = document.querySelectorAll('.settings-button');
  settingsButtons.forEach(button => button.classList.remove('clicked', 'no-click'));
}



// =============================================
//  Add Highlight On Click
// =============================================

// Adds 'highlight' class to category button on single click.

function addHighlightOnClick(e, categoriesContainer) {
  // Check event listener does not take place on tickbox
  if (e.target.classList.contains('tickbox')) return;

  const calendarCategoryElement = e.target.closest('.calendar-category-wrapper');
  const allCalendarCategoryButtons = categoriesContainer.querySelectorAll('.calendar-category');

  // Remove highlight class from all category elements and add to one that is clicked
  allCalendarCategoryButtons.forEach(element => element.classList.remove('highlight'));
  const calendarCategoryButton = calendarCategoryElement.querySelector('.calendar-category');
  calendarCategoryButton.classList.add('highlight');
}



// =============================================
//  Handle Color Icon Click
// =============================================

// Changes category color profile when color icons in menu are clicked.
// Updates caelendar event button colors and saves to local storage.

function handleColorIconClick(e, savedCalendarCategories) {
  const colorIcon = e.target; // Select color icon from event target
  const categorySettingsElement = colorIcon.closest('.calendar-category-settings');

  // Get matching category details object from category element dataset ID
  const matchingCategoryObject = getMatchingCategoryObject(e, savedCalendarCategories);

  updateCategoryColorProfile(colorIcon, matchingCategoryObject); // Update color values in category object
  updateCalendarButtonColors(matchingCategoryObject); // Update event button colors
  updateCategoryInLocalStorage(matchingCategoryObject); // Replace object in local storage with newly edited one

  // Update search results element results if it is open
  updateSearchResults();

  // Hide settings window
  categorySettingsElement.classList.remove('show');
}



// =============================================
//  Handle Rename Button Click
// =============================================

// Allows user to rename category when clicking button in settings menu.

function handleRenameButtonClick(e, categoriesContainer, savedCalendarCategories) {
  e.stopPropagation(); // Prevent window click bubbling up to 'rename' button
  
  // Select parent of clicked item for dataset access
  const calendarCategoryElement = e.target.closest('.calendar-category-wrapper');

  // Get matching category details object from category element dataset ID
  const matchingCategoryObject = getMatchingCategoryObject(e, savedCalendarCategories);

  // Create object of HTML elements
  const categoryElementsObject = createElementsObject(categoriesContainer, calendarCategoryElement);
  const { categoryNameInput, categorySettingsElement } = categoryElementsObject;

  // Hide input and show name element
  toggleElementClasses(categoryElementsObject);

  categoryNameInput.focus();
  categorySettingsElement.classList.remove('show');

  // Add details to new categories
  handleCategoryObjectValues(categoryElementsObject, matchingCategoryObject);

  // Handle window click behaviour for name input double click
  nameInputWindowEventListeners(categoryElementsObject, matchingCategoryObject);
}



// =============================================
//  Category Name Input Double Click
// =============================================

// Allows name change when double clicking category element.
// Gets matching category object and updates in local storage.

function handleCategoryNameDblClick(e, categoriesContainer) {  
  // Check event listener does not take place on tickbox
  if (e.target.classList.contains('tickbox')) return;

  // Load newly updated list of calendar categories from localStorage
  const savedCalendarCategories = getCategoriesFromLocalStorage();

  // Select parent of clicked item for dataset access
  const calendarCategoryElement = e.target.closest('.calendar-category-wrapper');
  
  // Get matching category details object from category element dataset ID
  const matchingCategoryObject = getMatchingCategoryObject(e, savedCalendarCategories);

  // Create object of HTML elements
  const categoryElementsObject = createElementsObject(categoriesContainer, calendarCategoryElement);

  // Hide input and show name element
  toggleElementClasses(categoryElementsObject);

  // Highlight text on load
  categoryElementsObject.categoryNameInput.select();

  // Add details to new categories
  handleCategoryObjectValues(categoryElementsObject, matchingCategoryObject);

  // Handle window click and Enter key event listeners
  nameInputWindowEventListeners(categoryElementsObject, matchingCategoryObject);
}



// =============================================
//  Name Input Window Event Listeners
// =============================================

// Handles the change in classes on newly added category elements when window is clicked or 'Enter' key pressed.
// Updates category in local storage.

function nameInputWindowEventListeners(categoryElementsObject, matchingCategoryObject) {
  // Set up event listener functionality for window click and Enter keydown
  window.addEventListener('click', handleWindowClick);
  window.addEventListener('keydown', handleEnterKeyPress);

  // Destructure variables from object
  const { categoryNameInput, categoryNameElement } = categoryElementsObject;

  // Call shared functions if window is clicked
  function handleWindowClick(e) {
    if (e.target !== categoryNameInput) { // Only run code if user clicks outside of input
      sharedEventListenerFunctions();
    }
  }
  // Call shared functions if 'Enter' key is pressed
  function handleEnterKeyPress(e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
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

    toggleElementClasses(categoryElementsObject); // Hide input and show name element
    updateCategoryInLocalStorage(matchingCategoryObject); // Replace object in local storage with newly edited one

    // Remove both event listeners once one is carried out
    window.removeEventListener('click', handleWindowClick);
    window.removeEventListener('keydown', handleEnterKeyPress);
  }
}



// =============================================
//  Settings Menu Window Event Listeners
// =============================================

// Closes category settings menu when clicking window.

function settingsWindowEventListeners(allCalendarCategoryElements) {
  // Set up event listener functionality for window click
  window.addEventListener('click', handleWindowClick);

  function handleWindowClick(e) {
    // Check that click event is taking place outside of settings menu button or container
    if (!e.target.classList.contains('settings-button') && !e.target.closest('.calendar-category-settings')) {

      // Remove 'show' class from calendar category settings elements
      removeClasses(allCalendarCategoryElements);

      // Remove event listener once carried out
      window.removeEventListener('click', handleWindowClick);
    }
  }
}

function removeClasses(allCalendarCategoryElements) {
  allCalendarCategoryElements.forEach((element) => {
    const categorySettingsElement = element.querySelector('.calendar-category-settings');
    categorySettingsElement.classList.remove('show');
  });  
}



export {
  editCalendarCategories,
  updateCategoryInLocalStorage
}