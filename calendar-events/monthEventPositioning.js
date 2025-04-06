import { getEventsFromLocalStorage } from "./user-added-events/userEventsLocalStorage.js";


// ===============================================
//  Month Event Positioning
// ===============================================

// Handles the repositioning of all event elements in a grid layout as new events are added and dates / times on existing events are changed.
// Creates row map of all event containers in calendar layout and calculates the number of grid rows they need.
// Finds groups of overlapping event elements (with no empty dates between) and adds them to grouped arrays.
// Arranges grouped arrays in a layout based on event length and time.
// Takes an optional 'eventId' parameter for when a new event is added and it's positioned temporarily at the top of the stack.

export function monthEventPositioning(classElement, eventId = null) {
  const dateElements = [...classElement.querySelectorAll('.date-element')]; // Select all date elements
  const eventContainers = [...classElement.querySelectorAll('.calendar-event-container')]; // Create array from event containers

  // Create map of event containers from each date element row
  const calendarRowMap = createRowMap(dateElements);

  // Get user-added events from local storage
  const savedEvents = getSavedEvents(dateElements);

  // Calculate the number of grid rows are needed in event containers by finding the one with highest amount
  calendarRowMap.forEach(array => calculateGridRows(array));  

  // Find individual groups of adjacent event elements with overlapping dates
  const eventElementClusters = getEventElementGroups(dateElements);

  // Sort eventElementClusters into nested arrays, grouping event elements by their shared event ID
  const nestedEventElementArrays = createEventElementArrays(eventElementClusters);

  // Loops through nested grouped arrays, sorts by length, and positions in a grid layout
  nestedEventElementArrays.forEach(groupedArray => {
    handleNestedEventArrays(eventContainers, groupedArray, savedEvents, eventId);
  });
}



// ===============================================
//  Get Saved Events
// ===============================================

// Retrieves events that have been saved into the local storage.

function getSavedEvents(dateElements) {
  const calendarYearsArray = dateElements.map((dateObject) => dateObject.getAttribute('data-year').toString());
  const uniqueYearsArray = [...new Set(calendarYearsArray)];

  // Get user-added events from local storage
  const userAddedEvents = getEventsFromLocalStorage(uniqueYearsArray);

  return userAddedEvents;
}



// ===============================================
//  Create Row Map
// ===============================================

// Loop throught date elements and create map of event containers divided by their dataset row number.
// Used to calculate the grid row number.

function createRowMap(dateElements) {
  // Create a Map
  const calendarRowMap = new Map();

  dateElements.forEach(element => {
    // Get dataset value
    const rowNumber = element.dataset.rowNumber;

    // Get event container from date element
    const calendarEventContainer = element.querySelector('.calendar-event-container');

    // Initialize an empty array if key doesn't exist
    if (!calendarRowMap.has(rowNumber)) {
      calendarRowMap.set(rowNumber, []);
    }

    // Push the element into the corresponding array
    calendarRowMap.get(rowNumber).push(calendarEventContainer);
  });

  return calendarRowMap;
}



// ===============================================
//  Calculate Grid Rows
// ===============================================

// Calculate the number of grid rows are needed in event containers by finding the one with highest amount.

function calculateGridRows(eventContainers) {
  // Select all calendar event containers and find one with the most non-hidden children
  const mostChildren = Math.max(...eventContainers.map(eventContainer => {
    // Filter out children with the 'hide' class
    const visibleChildren = Array.from(eventContainer.children).filter(child => !child.classList.contains('hide'));
    return visibleChildren.length;
  }));

  // Use mostChildren value to calculate grid rows
  eventContainers.forEach(eventContainer => {
    eventContainer.style.gridTemplateRows = `repeat(${mostChildren}, 18px)`;
  });
}



// ===============================================
//  Get Event Element Groups
// ===============================================

// Find individual groups of overlapping / adjacent event elements.
// Collects a nested array of event elements from each date element and then flattens them into a single array.

function getEventElementGroups(dateElements) {
  // Create temporary array to store groups of event elements and results array to store them
  let tempArray = [];
  const resultArray = [];

  dateElements.forEach((dateElement, index) => {
    // Select all event elements in each date element
    const eventElements = dateElement.querySelectorAll('.calendar-event-element');

    // If any event elements exist, push them to tempArray
    if (eventElements.length > 0) {
      tempArray.push(Array.from(eventElements));

    // When loop reaches a date element containing no event elements, push tempArray to results and reset tempArray to []
    } else if (tempArray.length > 0) {
      resultArray.push(tempArray.flat()); //
      tempArray = [];
    }

    // If the end of the loop is reached and the date element contains no event elements, push tempArray to resultsArray
    if (index === dateElements.length - 1 && tempArray.length > 0) {
      resultArray.push(tempArray.flat());
    }
  });

  return resultArray;
}



// ===============================================
//  Create Event Element Arrays
// ===============================================

// Fine tunes eventElementClusters arrays by sorting them into nested arrays, grouping single and multiple date event elements by their shared event ID.
// Each individual single/multiple date array is nested inside a parent array keeping it organized with other events with overlapping dates.

function createEventElementArrays(eventElementClusters) {
  // Empty array to store child arrays
  const resultArray = [];

  // Run function for every group of events
  eventElementClusters.forEach(array => {
    const groupedElements = array.reduce((object, element) => {
      // const eventId = element.getAttribute('eventid');
      const eventId = element.dataset.eventId;

      // If eventId is not already a key in the accumulator object, create one and assign it an empty array
      if (!object[eventId]) {
        object[eventId] = [];
      }

      // If element does not have class 'hide', push into matching eventId array
      if (!element.classList.contains('hide')) {
        object[eventId].push(element);
      }

      return object;
    }, {});

    // Convert the object into an array
    const groupedArray = Object.values(groupedElements);

    // Push each array from loop into resultArray
    resultArray.push(groupedArray);
  });

  return resultArray;
}



// ===============================================
//  Handle Nested Event Arrays
// ===============================================

// Grouped arrays are arrays of events clustered together with no empty dates between them.
// Each grouped array contains nested arrays that contain every event element from an individual event. 
// For example, a grouped array with a single date event and a multiple date event might look like this: [Array(1), Array(3)] - the numbers being the event elements.

// 'handleNestedEventArrays' loops through each nested array and creates Map to track row occupancy.
// Events are sorted by length and time, and 'all-day' value.
// Once sorted, events are positioned in the grid rows according to availability.

function handleNestedEventArrays(eventContainers, groupedArray, savedEvents, eventId = null) {
  // Create a map to store the row occupancy for each event container
  const containerRowMap = new Map();

  // Extract grid template rows from CSS data and initialize them with "false" value in containerMap to signify no content
  eventContainers.forEach(eventContainer => initializeGridRows(eventContainer, containerRowMap));

  // Sort event elements by length, event type (user or API), and whether they are all-day events
  sortEventsByCriteria(groupedArray, savedEvents);

  // If an eventId is provided, find the matching grouped array and (temporarily) position event element at the top
  if (eventId) addNewEventToGroupedArray(groupedArray, eventId);

  // Loop through all grouped arrays and position their elements 
  groupedArray.forEach(eventArray => positionEventElements(eventArray, containerRowMap));
}



// ===============================================
//  Initialize Grid Rows
// ===============================================

// Extracts number of grid rows from each event container's CSS, creates an array representing row occupancy (initialized as false).
// Stores each eventContainer as a key in containerRowMap with an array of grid rows for tracking row usage.
// Each row in rowContent array is preset to 'false', and will be updated to 'true' as events are added (see 'addCalendarEventToGrid').

function initializeGridRows(eventContainer, containerRowMap) {
  // Get complete list of CSS rules and select 'grid-template-rows'
  const computedStyle = window.getComputedStyle(eventContainer);
  const gridTemplateRows = computedStyle.getPropertyValue('grid-template-rows');

  // Split the grid-template-rows value by whitespace and count the parts
  const gridRows = gridTemplateRows.split(' ').length;

  // Initialize array with 'false'
  const rowContent = Array(gridRows).fill(false);
  
  // Store the row occupancy in the map
  containerRowMap.set(eventContainer, rowContent);
}



// ===============================================
//  Sort Events By Criteria
// ===============================================

// The events in the grouped arrays are sorted by length, their 'all-day' value (true or false) and their start time.

function sortEventsByCriteria(groupedArray, savedEvents) {
  groupedArray.sort((a, b) => {
    // Sort by array length (descending)
    const lengthDifference = b.length - a.length;
    if (lengthDifference !== 0) return lengthDifference;

    // Get allDay values for the first event in each group
    const allDayA = savedEvents.find(event => event.eventId === checkIfElement(a[0]))?.allDay;
    const allDayB = savedEvents.find(event => event.eventId === checkIfElement(b[0]))?.allDay;

    // Check if array item contains an element (skips over empty items)
    function checkIfElement(item) {
      if (item instanceof Element) return item.dataset.eventId;
    }
  
    // Sort by allDay value (allDay events come first)
    if (allDayA !== allDayB) return allDayA ? -1 : 1;
  
    // Sort by timestamp for non-allDay events
    const timestampA = getTimeData(a, savedEvents);
    const timestampB = getTimeData(b, savedEvents);
    return timestampA - timestampB;
  });
}


function getTimeData(array, savedEvents) {
  // Check if the array is non-empty
  if (!array || array.length === 0) {
    return Infinity; // Return a large value to ensure empty arrays are sorted last
  }
  
  const eventId = array[0].dataset.eventId;
  const matchingEvent = savedEvents.find(event => event.eventId === eventId);
  
  if (matchingEvent) {
    const startHour = matchingEvent.time.startTime.hours;
    const startMinute = matchingEvent.time.startTime.minutes;

    // Returns timestamp in milliseconds
    const date = new Date();
    date.setHours(startHour, startMinute, 0, 0);
    return date.getTime();
  }
}



// ===============================================
//  Add New Event To Grouped Array
// ===============================================

// ***** Function is called in instances of 'monthEventPositioning' where an event ID is passed in as an argument. *****

// Finds the nested array (matchingGroupedArray) containing the specified eventId, and the newly added event element.
// If found and the array has more than one event, it moves the newly added element to the top of the stack.
// Events will be reordered according to length / time when 'monthEventPositioning' is called a second time on window click without an event Id passed in.

function addNewEventToGroupedArray(groupedArray, eventId) {
  // Find groupedArray that contains eventId from newly added event
  let result = findArrayContainingEvent(groupedArray, eventId);

  if (result) {
    const { matchingGroupedArray, matchingElement } = result;

    // If matchingGroupedArray has a length of more than one, push matching element to the top of the stack
    if (matchingGroupedArray && matchingGroupedArray.length > 1) {
      moveMatchingElementToTop(matchingGroupedArray, matchingElement);
    }
  }
}


// Loop through each groupedArray and find one that contains eventId from newly added event.
// If found, it returns an object containing the matching nested array (matchingGroupedArray) and the matchingElement.

function findArrayContainingEvent(groupedArray, eventId) {
  for (const array of groupedArray) {
    // const matchingElement = array.find(element => element.getAttribute('eventid') === eventId);
    const matchingElement = array.find(element => element.dataset.eventId === eventId);

    if (matchingElement) {
      return { matchingGroupedArray: groupedArray, matchingElement }; // Return the nested array containing the matching element
    }
  }
  return null; // Return null if no array contains the element with eventId
}


// Locates and removes a specific matchingElement from its nested array within groupedArray. 
// Removes the now-empty nested array, sorts the remaining arrays by length, and places the matchingElement in a new array at the start of groupedArray.

function moveMatchingElementToTop(groupedArray, matchingElement) {
  // Set to -1 to indicate no value has been found
  let containingArrayIndex = -1;
  let elementIndex = -1;

  // Find the nested array that contains the matching element
  for (let i = 0; i < groupedArray.length; i++) {
    elementIndex = groupedArray[i].indexOf(matchingElement);
    if (elementIndex !== -1) {
      containingArrayIndex = i;
      break;
    }
  }

  if (containingArrayIndex !== -1) {
    // Remove the specific element from the nested array
    groupedArray[containingArrayIndex].splice(elementIndex, 1);

    // Remove the nested array from groupedArray
    groupedArray.splice(containingArrayIndex, 1);

    // Sort the remaining nested arrays by length
    groupedArray.sort((a, b) => b.length - a.length);

    // Create a new array with the matching element and place it at the start of groupedArray
    const newArray = [matchingElement];
    groupedArray.unshift(newArray);
  }

  return groupedArray;
}



// ===============================================
//  Position Event Elements
// ===============================================

// Calls findHighestAvailableRow() to determine the first free row in the container.
// Calls addCalendarEventToGrid() to place events in that row.

function positionEventElements(eventArray, containerRowMap) {
  // Find highest available row with no event element inside
  let highestRow = findHighestAvailableRow(eventArray, containerRowMap);

  // Add each calendar event element to grid layout
  addCalendarEventToGrid(eventArray, highestRow, containerRowMap);
}


// Loops through the event elements to find the highest available row in their respective container.
// Uses containerRowMap to track row occupancy.

function findHighestAvailableRow(array, containerRowMap) {
  // Find the highest available row in the event container for the entire array
  let highestRow = 0;

  array.forEach(element => {
    // Select the closest event container for the first element in the array
    const eventContainer = element.closest('.calendar-event-container');

    // Get the row occupancy array from the map
    const rowContent = containerRowMap.get(eventContainer);

    for (let i = 0; i < rowContent.length; i++) {
      if (!rowContent[i]) {
        highestRow = Math.max(highestRow, i);
        break; // Exit the loop after finding the first available row
      }
    }
  }); 

  return highestRow;
}


// Assigns each event element to the determined highestRow in the grid.
// Updates containerRowMap to mark the row as occupied.

function addCalendarEventToGrid(eventArray, highestRow, containerRowMap) {
  eventArray.forEach(element => {   
    // Select the closest event container for the first element in the array
    const eventContainer = element.closest('.calendar-event-container');

    // Get the row occupancy array from the map
    const rowContent = containerRowMap.get(eventContainer);

    // Apply CSS grid position
    element.style.gridRow = highestRow + 1;

    // Mark the row as occupied
    rowContent[highestRow] = true;

    // Update the map with the new row occupancy
    containerRowMap.set(eventContainer, rowContent);
  });
}