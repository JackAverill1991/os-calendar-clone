import { getCategoriesFromLocalStorage, updateCategoryInLocalStorage } from "./eventCategoriesLocalStorage.js";
import { setInputValues, setObjectValues, assignObjectID, eventCategoryColorsObject } from "../utils.js";


// ===============================================
//  Handle Category Object Values
// ===============================================

// Handles details for newly added calendar categories, as well as pre-existing ones that are being loaded or edited.
// New event details are added to object in local storage, and for previously added categories, object properties are added to elements.

function handleCategoryObjectValues(categoryElementsObject, categoryDetailsObject) {
  const { calendarCategoryElement, categoryNameInput } = categoryElementsObject;

  // Assign category object ID
  handleCategoryId(calendarCategoryElement, categoryDetailsObject);
  
  // Add name input value to object
  setObjectValues(categoryNameInput, 'name', categoryDetailsObject);

  // Add object name value to input on load
  setInputValues(categoryNameInput, 'name', categoryDetailsObject);

  // Handle instances in which name input is left blank
  handleBlankNameProperty(categoryElementsObject, categoryDetailsObject);

  // Set default category color value, or load existing value from object and add to tickbox
  setDefaultColorProfiles(calendarCategoryElement, categoryDetailsObject);

  // Set category visibility value, setting 'true' as default
  categoryDetailsObject.visible = categoryDetailsObject.visible ?? true;

  // If visibility is falsy, add 'hide' class to category button
  tickIconVisibility(calendarCategoryElement, categoryDetailsObject);

  return categoryDetailsObject;
}



// ===============================================
//  Handle Category ID
// ===============================================

// Assigns a unique ID to a calendar category element.
// If API category, default API ID is given.

function handleCategoryId(calendarCategoryElement, categoryDetailsObject) {
  if (!calendarCategoryElement.matches('.api-calendar-category')) {
    assignObjectID(calendarCategoryElement, categoryDetailsObject, 'categoryId');
  }
  else {
    categoryDetailsObject.categoryId = 'apiCategoryObject';
    calendarCategoryElement.dataset.categoryId = 'apiCategoryObject';
  }
}



// ===============================================
//  Handle Blank Name Property
// ===============================================

// Assigns a default name to a category if its input field is empty.
// Updates in both category object and menu element.

function handleBlankNameProperty(categoryElementsObject, categoryDetailsObject) {
  const { userCategoriesContainer, calendarCategoryElement, categoryNameInput, categoryNameElement } = categoryElementsObject;

  if (categoryNameInput.value === '') {
    // Set default user-added category object name to 'My Events'
    if (userCategoriesContainer.dataset.hasContent === 'false' && calendarCategoryElement.matches('.user-added-category')) {
      categoryDetailsObject.name = 'My Events';

    // Set API category object name to 'National Holidays'
    } else if (categoryDetailsObject.categoryId === 'apiCategoryObject') {
      categoryDetailsObject.name = 'National Holidays';

    // Set object names for dynamically added categories to "Untitled"
    } else {
      categoryDetailsObject.name = 'Untitled';
    }
  }

  // Add category names to name elements on load
  categoryNameElement.textContent = categoryDetailsObject.name;
}



// ===============================================
//  Manage Color Values
// ===============================================

// Set default color profiles for API and user-added categories.

function setDefaultColorProfiles(calendarCategoryElement, categoryDetailsObject) {
  // Pull default category colors from categoryDetailsObject
  const defaultColorObject = eventCategoryColorsObject['deepPurple'];
  const defaultApiColorObject = eventCategoryColorsObject['skyBlue'];

  // Build default color palettes
  const defaulColorPalette = {
    name: 'deepPurple',
    colors: defaultColorObject
  }
  const defaultApiColorPalette = {
    name: 'skyBlue',
    colors: defaultApiColorObject
  }

  // Set API category default color value
  if (categoryDetailsObject.categoryId === 'apiCategoryObject') {
    categoryDetailsObject.colorPalette = categoryDetailsObject.colorPalette || defaultApiColorPalette;
  
  // Set user-added category default color value
  } else {
    categoryDetailsObject.colorPalette = categoryDetailsObject.colorPalette || defaulColorPalette;
  }  

  // Select tickbox and update color to color object property
  const categoryTickbox = calendarCategoryElement.querySelector('.tickbox');
  categoryTickbox.style.backgroundColor = `#${categoryDetailsObject.colorPalette.colors.highlight}`;
}



// ===============================================
//  Settings Color Button Event Listeners
// ===============================================

// Updates calendar category color profile in object.
// Updates tickbox to the new color.

function updateCategoryColorProfile(colorIcon, categoryDetailsObject) {
  // Select color palette key dataset
  const dataColorValue = colorIcon.dataset.colorPaletteKey;
  const colorPalette = eventCategoryColorsObject[dataColorValue];

  // Assign the key and the corresponding color object to colorPalette
  categoryDetailsObject.colorPalette = {
    name: dataColorValue,
    colors: colorPalette
  };

  // Destructure highlight color
  const { colorPalette: { colors: { highlight } } } = categoryDetailsObject;

  // Select tickbox from current category element and update to chosen color
  const categoryTickBox = colorIcon.closest('.calendar-category-wrapper').querySelector('.tickbox');
  categoryTickBox.style.backgroundColor = `#${highlight}`;
}


// Used to update event button color values when a category color is chosen / updated in the category settings menu.
// Differentiates between pastel or highlight color depending on 'highlight' class.

function updateCalendarButtonColors(matchingCategoryObject) {
  const { categoryId, colorPalette: { name, colors: { highlight, pastel } } } = matchingCategoryObject;

  // Select all event elements with matching dataset category ID
  const matchingCategoryEventElements = document.querySelectorAll(`.calendar-event-element[data-category-id="${categoryId}"]`);

  // Select calendar class content element and get dataset value
  const classElement = document.querySelector('.calendar-class-content').firstChild;
  const calendarView = classElement.dataset.calendar;

  matchingCategoryEventElements.forEach(element => {
    if (calendarView === 'month' || calendarView === 'week' || calendarView === 'day') {
      updateColors(element);
    }
    else if (calendarView === 'year') {
      updateYearColors(element);
    }
  });

  function updateYearColors(element) {
    const colorIcon = element.querySelector('.color-icon');
    console.log(colorIcon);
    colorIcon.style.backgroundColor = `#${highlight}`;
  }

  function updateColors(element) {
    // Select calendar event button and its content elements for event name and time
    const calendarEventButton = element.querySelector('.calendar-event-button');
    const calendarEventName = calendarEventButton.querySelector('.event-button-name');

    // Update calendar event button colorPallete dataset value
    calendarEventButton.dataset.colorPalette = name;

    // Check for 'highlight' class and assign appropriate color tone
    if (calendarEventButton.classList.contains('highlight')) {
      calendarEventButton.style.backgroundColor = `#${highlight}`;
      
    } else {
      // Set button background color to category pastel tone
      calendarEventButton.style.backgroundColor = `#${pastel}`;

      // Add correct text color when calendar view is set to week or day
      if (calendarView === 'week' || calendarView === 'day') {
        calendarEventName.style.color = `#${highlight}`;
      }
    }
  }
}



// ===============================================
//  Show Hidden Category
// ===============================================

// Shows a hidden category when user adds a new event under that category or assigns it to an existing event.
// Event elements re-appear on calendar and tick icon re-appears in category element tickbox.

function showHiddenCategory(categoryElement, classElement, userEventObject) {
  // Select highlighted category and get the categoryId dataset value from its parent
  const selectedCategoryId = categoryElement.dataset.categoryId;

  // Load newly updated list of calendar categories from localStorage
  const calendarCategoriesArray = getCategoriesFromLocalStorage();

  // Find category from array that matches the name property in the userEventObject
  const matchingCalendarCategory = calendarCategoriesArray.find(object => object.categoryId === userEventObject.categoryId);

  // Only run if highlighted category has visibility set to false
  if (!matchingCalendarCategory.visible) {
    matchingCalendarCategory.visible = true; // Make category visible

    // Select matching calendar event elements and remove 'hide' class
    showMatchingEventElements(selectedCategoryId, classElement);

    // Remove 'hide' classes from the category menu button and tick icon
    resetCategoryMenuElement(selectedCategoryId);

    // Update in localStorage
    updateCategoryInLocalStorage(matchingCalendarCategory);
  }
}


function showMatchingEventElements(selectedCategoryId, classElement) {
  // Select calendar content window and find all elements with categoryId dataset (avoids menu items being targeted)
  const matchingEventElements = classElement.querySelectorAll(`[data-category-id="${selectedCategoryId}"]`);

  // Remove hide class from calendar event elements and tick icon
  matchingEventElements.forEach(element => element.classList.remove('hide'));
}


function resetCategoryMenuElement(selectedCategoryId) {
  // Select matching calendar category and subsequent tick icon
  const calendarCategoryElement = document.querySelector(`.calendar-category-wrapper[data-category-id="${selectedCategoryId}"]`);
  const categoryButton = calendarCategoryElement.querySelector('.calendar-category');
  const tickIcon = calendarCategoryElement.querySelector('.tick-icon');

  // Remove 'hide' classes from category menu button and tick icon
  categoryButton.classList.remove('hide');
  tickIcon.classList.remove('hide');
}



// ===============================================
//  Tick Icon Visibility
// ===============================================

// Sets tick icon visibility based on the visibility setting in category object.

function tickIconVisibility(calendarCategoryElement, categoryDetailsObject) {
  const calendarCategoryButton = calendarCategoryElement.querySelector('.calendar-category');
  const tickIcon = calendarCategoryElement.querySelector('.tick-icon');

  if (categoryDetailsObject.visible === false) {
    calendarCategoryButton.classList.add('hide');
    tickIcon.classList.add('hide');
  }
}


export {
  handleCategoryObjectValues,
  updateCategoryColorProfile,
  updateCalendarButtonColors,
  showHiddenCategory
}