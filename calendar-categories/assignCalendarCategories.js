import { updateEventElementColorAndData } from "../calendar-events/user-added-events/handleEventObjectValues.js";
import { updateEventInLocalStorage } from "../calendar-events/user-added-events/userEventsLocalStorage.js";
import { showHiddenCategory } from "./handleCategoryObjectValues.js";
import { getCategoriesFromLocalStorage } from "./eventCategoriesLocalStorage.js";
import { monthEventPositioning } from "../calendar-events/monthEventPositioning.js";
import { updateSearchResults } from "../search-form/searchbarFunctionality.js";
import { addSvgIcon } from "../icons/icons.js";



// ===============================================
//  Assign Calendar Categories
// ===============================================

// Creates menu within details element that allows user to change the event category.

function assignCalendarCategories(elementsObject, userEventObject) {
  const { calendarEventDetails, classElement } = elementsObject;

  // Create object for variables
  const menuElementsObject = {
    categoryMenuButton: calendarEventDetails.querySelector('.category-menu-button'),
    categoryButtonArrows: calendarEventDetails.querySelector('.arrow-icons'),
    categoryElementContainer: calendarEventDetails.querySelector('.category-menu-element-container'),
    calendarCategoriesArray: getCategoriesFromLocalStorage()
  }

  // Destructure menu element container
  const { categoryElementContainer, categoryButtonArrows } = menuElementsObject;

  // Add arrow icons to dropdown menu button
  addSvgIcon('upAndDownArrows', categoryButtonArrows, '#000000', '#000000');

  // Create elements for each category in local storage array
  createCategoryMenu(categoryElementContainer, menuElementsObject);

  // Handle event listeners on the menu button and window to handle menu open / close
  handleMenuOpenClose(menuElementsObject, calendarEventDetails);

  const allCategoryMenuElements = categoryElementContainer.querySelectorAll('.menu-category-element');
  allCategoryMenuElements.forEach(categoryElement => {
    categoryElement.addEventListener('click', () => {
      // Handle category change within event object and event elements
      handleMenuElementClick(categoryElement, menuElementsObject, classElement, userEventObject);
    });
  });
}



// ===============================================
//  Create Category Menu
// ===============================================

// Creates category menu by looping over category objects in array and building clickable elements.

function createCategoryMenu(categoryElementContainer, menuElementsObject) {
  const { calendarCategoriesArray } = menuElementsObject;
  
  // Remove API category from array
  const newCategoriesArray = calendarCategoriesArray.filter(object => object.categoryId !== 'apiCategoryObject');

  // Clear preexisting menu items when calendar event element is clicked
  categoryElementContainer.innerHTML = '';

  // Loop over array and create menu entry from each item
  newCategoriesArray.forEach(object => {
    const { categoryId, name, colorPalette: { colors: { highlight } } } = object;

    // Create element and add class
    const menuCategory = document.createElement('div');
    menuCategory.classList.add('menu-category-element');

    // Add dataset properties
    menuCategory.dataset.categoryName = name;
    menuCategory.dataset.color = highlight;
    menuCategory.dataset.categoryId = categoryId;

    // Add innerHTML
    menuCategory.innerHTML = `
      <div class="menu-category-inner">
        <div class="menu-category-color-icon" style="background-color:#${highlight}"></div>
        <div class="menu-category-name">${name}</div>
      </div>
    `;

    // Append menu item to container
    categoryElementContainer.appendChild(menuCategory);
  });  
}



// ===============================================
//  Handle Event Listeners
// ===============================================

// Attaches event listener to category button on details element that opens menu when clicked.
// Closes the category menu when the user clicks anywhere on the window outside of the details pop-up.

function handleMenuOpenClose(menuElementsObject, calendarEventDetails) {
  // Destructure elements from object
  const { categoryMenuButton, categoryElementContainer } = menuElementsObject;

  // Add 'show' class to menu container
  categoryMenuButton.addEventListener('click', () => {
    categoryElementContainer.classList.add('show');
  });

  // Ensure that clicking outside the menu closes it or handles other actions
  calendarEventDetails.addEventListener('click', (e) => {
    if (!e.target.closest('.category-menu-button')) {
      categoryElementContainer.classList.remove('show');
    }
  });

  function handleWindowClick(e) {
    // Only run if click takes place outside of details window
    if (!e.target.closest('.calendar-event-details')) {

      // Close menu container
      if (categoryElementContainer.classList.contains('show')) {
        categoryElementContainer.classList.remove('show');
      }
      // Remove the event listener once it is fired
      window.removeEventListener('click', handleWindowClick);
    }
  }

  // Hide category menu before the details element closes
  window.addEventListener('click', handleWindowClick);
}



// ===============================================
//  Handle Menu Element Click
// ===============================================

// Handle category change within event object and event elements.
// Handles color and category dataset change on event elements.

function handleMenuElementClick(categoryElement, menuElementsObject, classElement, userEventObject) {
  const { calendarCategoriesArray, categoryMenuButton } = menuElementsObject;

  // Find category that matches menu button dataset value, update object details and update in local storage
  const matchingCalendarCategory = setEventObjectCategoryId(categoryElement, calendarCategoriesArray, userEventObject);

  // Select event elements that match userEventObject eventId and update
  handleMatchingIdElements(classElement, matchingCalendarCategory, userEventObject);

  // Update button color icon to chosen category color
  updateCategoryColor(categoryMenuButton, matchingCalendarCategory);

  // Toggle category visibility on to if it is hidden
  showHiddenCategory(categoryElement, classElement, userEventObject);

  // Reorganize events according to length in month calendar view, passing in eventId to initially send new event to top
  monthEventPositioning(classElement, null);

  // Update search results element results if it is open
  updateSearchResults();
}


function setEventObjectCategoryId(categoryElement, calendarCategoriesArray, userEventObject) {
  // Find category from array that matches the dataset categoryId of the menuElement
  const matchingCalendarCategory = calendarCategoriesArray.find(object => 
    object.categoryId === categoryElement.dataset.categoryId
  );

  // Update category ID in user event object
  userEventObject.categoryId = matchingCalendarCategory.categoryId;

  // Update user event object in local storage
  updateEventInLocalStorage(userEventObject);

  return matchingCalendarCategory;
}


function handleMatchingIdElements(classElement, matchingCalendarCategory, userEventObject) {
  // Select all event elements with matching eventId
  const matchingIdEventElements = classElement.querySelectorAll(`.calendar-event-element[data-event-id="${userEventObject.eventId}"]`);

  // Update category color for all matching event elements and update color and category dataset
  matchingIdEventElements.forEach(element => {
    updateEventElementColorAndData(element, userEventObject, matchingCalendarCategory);
  });
}


// Update button color icon to chosen category color
function updateCategoryColor(categoryMenuButton, matchingCalendarCategory) {
  const categoryColorIcon = categoryMenuButton.querySelector('.category-color-icon');
  categoryColorIcon.style.backgroundColor = `#${matchingCalendarCategory.colorPalette.colors.highlight}`;
}



export { assignCalendarCategories }