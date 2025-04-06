import { getEventsFromLocalStorage, removeEventFromLocalStorage } from "../calendar-events/user-added-events/userEventsLocalStorage.js";
import { getSingleCategoryFromLocalStorage, removeCategoryFromLocalStorage } from "./eventCategoriesLocalStorage.js";
import { monthEventPositioning } from "../calendar-events/monthEventPositioning.js";


// =============================================
//  Delete Calendar Category
// =============================================

// Attaches event listeners to allow user to delete whole categories by clicking opttion button in menu.
// All events under that category will be deleted with it.

export function deleteCalendarCategory() {
  const categoriesContainer = document.querySelector('.calendar-categories');

  // Group variables into object
  const messageElementsObject = getMessageElementsObject();
  const { fullPageOverlay, warningMessageContainer, cancelDeleteButton } = messageElementsObject;

  categoriesContainer.addEventListener('click', (e) => {
    settingsDeleteButtonClick(e, messageElementsObject, categoriesContainer);
  });

  cancelDeleteButton.addEventListener('click', () => {
    // Hide the warning message when 'cancel' button is pressed
    fullPageOverlay.classList.remove('show');
    warningMessageContainer.classList.remove('show');
  });
}


function getMessageElementsObject() {
  return {
    fullPageOverlay: document.querySelector('.full-page-overlay'),
    warningMessageContainer: document.querySelector('.full-page-overlay .warning-message-container'),
    warningTitle: document.querySelector('.warning-heading'),
    warningMessage: document.querySelector('.full-page-overlay .warning-message'),
    confirmDeleteButton: document.querySelector('.full-page-overlay .confirm-button'),
    cancelDeleteButton: document.querySelector('.full-page-overlay .cancel-button')
  }
}


// =============================================
//  Settings Delete Button Click
// =============================================

// Gets category from local storage and opens warning message before delete is finalized.
// Hides settings menu element.
// Prevents user from deleting category if there is only one there.

function settingsDeleteButtonClick(e, messageElementsObject, categoriesContainer) {
  const { confirmDeleteButton } = messageElementsObject;

  // Handle 'delete' button click
  if (!e.target.matches('.delete-category-button')) return;

  // If only one calendar category remains, hide 'delete' button
  disableDeleteLastCategory(e, categoriesContainer);

  // Get target category element from click event
  const targetCategoryElement = e.target.closest('.user-added-category');

  // Get dataset categoryId and get target category from local storage
  const categoryToDelete = getCategoryToDelete(targetCategoryElement);

  // Select and remove 'show' class from settings menu element
  hideCategorySettingsMenu(e);

  // Cover page with overlay and display confirmation message before category is deleted
  handleWarningDisplay(messageElementsObject, categoryToDelete);

  // Add an event listener for confirmation with the current category as argument
  confirmDeleteButton.addEventListener('click', () => {
    handleDeleteCategory(targetCategoryElement, messageElementsObject, categoriesContainer);
  }, { once: true });    
}


function getCategoryToDelete(targetCategoryElement) {
  const categoryId = targetCategoryElement.dataset.categoryId;
  return getSingleCategoryFromLocalStorage(categoryId);
}


function hideCategorySettingsMenu(e) {
  const categorySettingsElement = e.target.closest('.calendar-category-settings');
  categorySettingsElement.classList.remove('show');
}


function handleWarningDisplay(messageElementsObject, categoryToDelete) {
  const { fullPageOverlay, warningMessageContainer, warningTitle } = messageElementsObject;

  // Add 'show' class to display warning message and overlay
  fullPageOverlay.classList.add('show');
  setTimeout(() => warningMessageContainer.classList.add('show'), 200);

  // Add text to title
  warningTitle.innerHTML = `Are you sure you want to delete the calendar “${categoryToDelete.name}”?`;
}



// =============================================
//  Handle Delete Category
// =============================================

// Calls functions to remove category and its events from local storage.
// Removes overlay and confirmation / warning message after comfirm delete button is clicked.

function handleDeleteCategory(targetCategoryElement, messageElementsObject, categoriesContainer) {
  const { fullPageOverlay, warningMessageContainer } = messageElementsObject;

  // Get dataset categoryId value from target category
  const datasetCategoryId = targetCategoryElement.dataset.categoryId;

  // Remove category object from local storage and its element from sidebar menu
  categoryObjectRemoval(targetCategoryElement, datasetCategoryId, categoriesContainer);

  // Remove relevant events from local storage and their event elements from layout
  eventObjectAndElementRemoval(datasetCategoryId);

  // Hide the warning message after category deletion
  fullPageOverlay.classList.remove('show');
  warningMessageContainer.classList.remove('show');
}



// =============================================
//  Handle Category Removal
// =============================================

// Removes event category from local storage and the element from the sidebar menu.

function categoryObjectRemoval(targetCategoryElement, datasetCategoryId, categoriesContainer) {
  // Delete category from local storage and delete event element
  removeCategoryFromLocalStorage(datasetCategoryId);
  targetCategoryElement.remove();

  // Target first remaining calendar button and add 'highlight' class
  const userAddedCategories = categoriesContainer.querySelectorAll('.user-added-category');
  if (userAddedCategories.length > 0) {
    userAddedCategories[0].querySelector('.calendar-category').classList.add('highlight');
  }
}



// =============================================
//  Handle Event Removal
// =============================================

// Removes event objects from local storage and HTML elements from the calendar display if they match the category being deleted.
// Reshuffles layout to ensure correct order after event elements are deleted.

function eventObjectAndElementRemoval(datasetCategoryId) {
  // Get all events from local storage
  const allSavedEvents = getEventsFromLocalStorage();

  // Remove all events with selected category and remove HTML elements
  allSavedEvents.forEach(userEventObject => {
    removeSavedCategoryEvents(userEventObject, datasetCategoryId);
    removeCategoryEventElements(datasetCategoryId);
  });
}


function removeSavedCategoryEvents(userEventObject, datasetCategoryId) {
  const { eventId, dates: { startDate: { year } }, categoryId } = userEventObject;

  // Remove each event from local storage
  if (categoryId === datasetCategoryId) {
    removeEventFromLocalStorage(eventId, year);
  }
}


function removeCategoryEventElements(categoryId) {
  // Select calendar class content element
  const classElement = document.querySelector('.calendar-class-content').firstChild;

  // Find all event elements that have the same categoryId
  const matchingEventElements = classElement.querySelectorAll(`.calendar-event-element[data-category-id="${categoryId}"]`);
  
  // Remove every matching event element from calendar layout
  matchingEventElements.forEach(element => element.remove());

  // Reshuffle event elements to fit grid layout
  monthEventPositioning(classElement, null);
}



// =============================================
//  Disable Delete Last Category
// =============================================

// Prevents last category being deleted by removing the delete button if there are no others there to take its place as default.

function disableDeleteLastCategory(e, categoriesContainer) {
  const userAddedCategories = categoriesContainer.querySelectorAll('.user-added-category');
  const isSingleElement = categoriesContainer.dataset.singleElement === 'true';
  
  if (userAddedCategories.length === 1) { // Only run if there is one category remaining
    categoriesContainer.dataset.singleElement = 'true';
    
    // Select delete button and divider
    const deleteButton = e.currentTarget.querySelector('.delete-category-button');
    const firstDivider = deleteButton.nextElementSibling;

    // Add 'hide' class to both
    deleteButton.classList.add('hide');
    firstDivider.classList.add('hide');
  } 

  else if (userAddedCategories.length > 1 && isSingleElement) { // Only run if there is more than one category
    categoriesContainer.dataset.singleElement = 'false';

    // Select delete buttons and dividers
    const deleteButtons = e.currentTarget.querySelectorAll('.delete-category-button');
    const dividers = e.currentTarget.querySelectorAll('.button-divide');

    // Remove 'hide' class from all
    deleteButtons.forEach(button => button.classList.remove('hide'));
    dividers.forEach(divider => divider.classList.remove('hide'));
  }
}