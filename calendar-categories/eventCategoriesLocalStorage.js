// =============================================
//  Add Category To Local Storage
// =============================================

// Gets array of calendar categories from local storage and adds new category to it.
// Updates array in local storage when finished.

function addCategoryToLocalStorage(categoryDetailsObject) {
  // Retrieve calendar categories from localStorage
  const calendarCategoriesArray = getLocalStorageCategoryArray();

  // Push object to array 
  calendarCategoriesArray.push(categoryDetailsObject);

  // Re-upload the updated category array back into localStorage
  localStorage.setItem('calendarCategories', JSON.stringify(calendarCategoriesArray));
}



// =============================================
//  Update Category In Local Storage
// =============================================

// Finds category in local storage with matching ID and update with new details.

function updateCategoryInLocalStorage(matchingCategoryObject) {
  // Retrieve calendar categories from localStorage
  const calendarCategoriesArray = getLocalStorageCategoryArray();

  calendarCategoriesArray.map(categoryObject => {
    if (matchingCategoryObject.categoryId === categoryObject.categoryId) {

      // Update object properties using Object.assign
      Object.assign(categoryObject, matchingCategoryObject);

      return categoryObject;
    }
  });

  // Re-upload the updated category array back into localStorage
  localStorage.setItem('calendarCategories', JSON.stringify(calendarCategoriesArray));
}



// =============================================
//  Get Categories From Local Storage
// =============================================

// Returns complete list of event categories from locak storage.

function getCategoriesFromLocalStorage() {
  try {
    // Retrieve calendar categories from localStorage
    const calendarCategoriesArray = getLocalStorageCategoryArray();

    if (calendarCategoriesArray) {
      return calendarCategoriesArray;
    }
  }
  catch (error) {
    console.error("Error accessing localStorage", error); // Return empty array if not found
    return [];
  }
}


// Returns single category from local storage based on category ID.

function getSingleCategoryFromLocalStorage(datasetCategoryId) {
  try {
    // Retrieve calendar categories from localStorage
    const calendarCategoriesArray = getLocalStorageCategoryArray();

    if (calendarCategoriesArray) {
      // Find category from array that matches the name property in the userEventObject
      return calendarCategoriesArray.find(object => object.categoryId === datasetCategoryId);
    }
  }
  catch (error) {
    console.error("Error accessing localStorage", error); // Return empty array if not found
    return [];
  }
}



// =============================================
//  Remove Category From Local Storage
// =============================================

// Removes category from local storage.

function removeCategoryFromLocalStorage(categoryIdToRemove) {
  // Retrieve calendar categories from localStorage
  let calendarCategoriesArray = getLocalStorageCategoryArray();

  // Filter target category object to remove from array and reassign to variable
  calendarCategoriesArray = calendarCategoriesArray.filter(object => object.categoryId !== categoryIdToRemove);
  
  // Re-upload the updated category array back into localStorage
  localStorage.setItem('calendarCategories', JSON.stringify(calendarCategoriesArray));
}



// =============================================
//  Get Local Storage Category Array
// =============================================

// Helper function to get calendarCategories array from local storage.

function getLocalStorageCategoryArray() {
  // Retrieve calendar categories from localStorage
  const localStorageCategoryString = localStorage.getItem('calendarCategories');

  // If a local storage event string exists, parse it into a JavaScript object, otherwise create an empty array
  return localStorageCategoryString ? JSON.parse(localStorageCategoryString) : [];
}



export {
  addCategoryToLocalStorage,
  updateCategoryInLocalStorage,
  getCategoriesFromLocalStorage,
  getSingleCategoryFromLocalStorage,
  removeCategoryFromLocalStorage
}