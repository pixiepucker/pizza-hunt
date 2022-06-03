// var to hold idb connection
let db;
//est connection to IndexedDB called 'pizza-hunt' and set to version 1
const request = indexedDB.open('pizza-hunt', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts
  db.createObjectStore('new_pizza', { autoIncrement: true });
};

// upon success
request.onsuccess = function (event) {
  //when db successfully created w obj store
  db = event.target.result;

  // check if app is online, if yes run uploadPizza() function to send
  // all local db data to api
  if (navigator.onLine) {
    uploadPizza();
  }
};

request.onerror = function (event) {
  //log err here
  console.log(event.target.errorCode);
};

//this function executes when we try to submit w no internet connection
function saveRecord(record) {
  //open new transaction with the db with read and write permissions
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  //access the obj store for 'new_pizza'
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  //add record to store w add method
  pizzaObjectStore.add(record);
}

function uploadPizza() {
  //open transaction to db
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  //access obj store
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  //get all records from store and set to a var
  const getAll = pizzaObjectStore.getAll();

  //upon success of getAll() run this
  getAll.onsuccess = function () {
    // if there's data in IDB store, send to api server
    if (getAll.result.length > 0) {
      fetch('/api/pizzas', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response = response.json()))
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          //open one more transaction
          const transaction = db.transaction(['new_pizza', 'readwrite']);
          //access obj store
          const pizzaObjectStore = transaction.objectStore('new_pizza');
          //clear all items
          pizzaObjectStore.clear();

          alert('All saved pizza have been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

//listen for app coming back online
window.addEventListener('online', uploadPizza);
