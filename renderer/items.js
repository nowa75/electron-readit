// Modules
const fs = require('fs')
const {shell} = require('electron')

// Get readerJS content
let readerJS
fs.readFile(`${__dirname}/reader.js`, (err, data) => {
    readerJS = data.toString()
})

// DOM nodes
let items = document.getElementById('items')

// Track items in storage
exports.storage = JSON.parse(localStorage.getItem('readit-items')) || []

// Listen for "done" message from reader window
window.addEventListener('message', e => {

    // Check for correct message
    if (e.data.action === 'delete-reader-item') {

        // Delete item at given index
        this.delete(e.data.itemIndex)

        // Close the reader window
        e.source.close()
    }
})

// Persist storage
exports.save = () => {
    localStorage.setItem('readit-items', JSON.stringify(this.storage))
}

// Set item as selected
exports.select = e => {

    // Remove currently selected item class
    document.getElementsByClassName('read-item selected')[0].classList.remove('selected')

    // Add to clicked item
    e.currentTarget.classList.add('selected')
}

// Delete item
exports.delete = itemIndex => {

    // Remove item from DOM
    items.removeChild( items.childNodes[itemIndex] )

    // Remove item from storage
    this.storage.splice(itemIndex, 1)

    // Persist storage
    this.save()

    // Select previous item or new top item
    if (this.storage.length) {

        // Get new selected item index
        let newSelectedItemIndex = (itemIndex === 0) ? 0 : itemIndex - 1

        // Select item at new index
        document.getElementsByClassName('read-item')[newSelectedItemIndex].classList.add('selected')
    }
}

// Get selected item index
exports.getSelectedItem = () => {

    // Get selected node
    let currentItem = document.getElementsByClassName('read-item selected')[0]

    // Get item index
    let itemIndex = 0
    let child = currentItem
    while( (child = child.previousElementSibling) != null ) itemIndex++

    // Return selected item and index
    return { node: currentItem, index: itemIndex }
}

// Move to newly selected item
exports.changeSelection = direction => {

    // Get selected item
    let currentItem = document.getElementsByClassName('read-item selected')[0]

    // Handle up/down
    if (direction === 'ArrowUp' && currentItem.previousElementSibling) {
        currentItem.classList.remove('selected')
        currentItem.previousElementSibling.classList.add('selected')

    } else if (direction === 'ArrowDown' && currentItem.nextElementSibling) {
        currentItem.classList.remove('selected')
        currentItem.nextElementSibling.classList.add('selected')
    }
}

// Open selected item
exports.open = () => {

    // Only if we have items (in case of menu open)
    if ( !this.storage.length ) return

    // Get selected item
    let selectedItem = this.getSelectedItem()

    // Get item's url
    let contentURL = selectedItem.node.dataset.url

    // Open item in proxy BrowserWindow
    let readerWin = window.open(contentURL, '', `
    maxWidth=2000,
    maxHeight=2000,
    width=1200,
    height=800,
    backgroundColor=#DEDEDE,
    nodeIntegration=0,
    contextIsolation=1
  `)

    // Inject JavaScript with specific item index (selectedItem.index)
    readerWin.eval( readerJS.replace('{{index}}', selectedItem.index) )
}

// Open selected item in native browser
exports.openNative = () => {

    // Only if we have items (in case of menu open)
    if ( !this.storage.length ) return

    // Get selected item
    let selectedItem = this.getSelectedItem()

    // Get item's url
    let contentURL = selectedItem.node.dataset.url

    // Open in user's default system browser
    shell.openExternal(contentURL)
}

// Add new Items
exports.addItem = (item, isNew = false) => {

    // Create a new DOM node
    let itemNode = document.createElement('div')

    // Assign "read-item" class
    itemNode.setAttribute('class', 'read-item')

    // Set item url as data attribute
    itemNode.setAttribute('data-url', item.url)

    // Add inner HTML
    itemNode.innerHTML = `<img src="${item.screenshot}"><h2>${item.title}</h2>`

    // Append new node to "items"
    items.appendChild(itemNode)

    // Attach click handler to select
    itemNode.addEventListener('click', this.select)

    // Attach double-click handler to open
    itemNode.addEventListener('dblclick', this.open)

    // If this is the first item, select it
    if (document.getElementsByClassName('read-item').length === 1) {
        itemNode.classList.add('selected')
    }

    // Add item to storage and persist
    if(isNew) {
        this.storage.push(item)
        this.save()
    }
}

// Add items from storage when app loads
this.storage.forEach( item => {
    this.addItem(item)
})