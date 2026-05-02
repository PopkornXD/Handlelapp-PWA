const STORAGE_KEY = 'handlelapp.items.v1'

const form = document.getElementById('addForm')
const input = document.getElementById('itemInput')
const listEl = document.getElementById('list')
const clearBtn = document.getElementById('clearBtn')
const countEl = document.getElementById('count')

let items = []

function saveItems() {
  try {
    const data = JSON.stringify(items)
    localStorage.setItem(STORAGE_KEY, data)
  } catch (err) {
  console.warn('Kunne ikke lagre til localStorage:', err)
  }
}

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      items = []
      return
    }
    items = JSON.parse(raw)
    if (!Array.isArray(items)) items = []
  } catch (err) {
  items = []
  console.warn('Kunne ikke lese fra localStorage:', err)
  }
}

function render() {
  listEl.innerHTML = ''

  items.forEach(item => {
    const li = createListItemElement(item)
    listEl.appendChild(li)
  })

  const countText = items.length === 1 ? '1 vare' : items.length + ' varer'
  countEl.textContent = countText
}

function createListItemElement(item) {
  const li = document.createElement('li')
  li.dataset.id = item.id

  if (item.checked) {
    li.classList.add('checked')
  }

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = !!item.checked
  checkbox.setAttribute('aria-label', 'Kryss av vare')
  checkbox.addEventListener('change', () => toggleItemChecked(item.id))

  const label = document.createElement('div')
  label.className = 'item-label'
  label.textContent = item.text

  const removeBtn = document.createElement('button')
  removeBtn.className = 'remove-btn'
  removeBtn.title = 'Fjern vare'
  removeBtn.textContent = 'x'
  removeBtn.addEventListener('click', () => removeItem(item.id))

  li.appendChild(checkbox)
  li.appendChild(label)
  li.appendChild(removeBtn)

  return li
}

function addItem(text) {
  const trimmed = (text || '').trim()
  if (trimmed === '') return

  const newItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: trimmed,
    checked: false
  }

  items.unshift(newItem)
  saveItems()
  render()
}

function toggleItemChecked(id) {
  const index = items.findIndex(i => i.id === id)
  if (index === -1) return
  items[index].checked = !items[index].checked
  saveItems()
  render()
}

function removeItem(id) {
  items = items.filter(i => i.id !== id)
  saveItems()
  render()
}

function clearAllItems() {
  if (items.length === 0) return
  const ok = confirm('Vil du fjerne alle varer?')
  if (!ok) return
  items = []
  saveItems()
  render()
}

form.addEventListener('submit', function (e) {
  e.preventDefault()
  addItem(input.value)
  input.value = ''
  input.focus()
})

clearBtn.addEventListener('click', function () {
  clearAllItems()
})

loadItems()
render()


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register("/sw.js");
}
