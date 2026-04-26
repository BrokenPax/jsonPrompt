// Full main.js with editable dropdowns, modal management, checkbox editing, and JSON export

let dropdownOptions = {};
let checkboxCategories = {};
let randomizedCheckboxes = {};
let selectedCheckboxes = JSON.parse(localStorage.getItem('selectedCheckboxes')) || {};
let dropdownOrder = [];
let draggedKey = null;
let currentProfileName = null; // null until user saves or loads
let structure;
let selectedFolder = null;
let renameCallback = null;

const checkboxButtonLabels = {
  "Background Options": "🖼 Background Options",
  "Damage Effects": "💥 Damage Effects",
  "SFX": "🔊 SFX",
  "Camera Overlays": "📷 Camera Overlays",
  "Lighting Effects": "💡 Lighting Effects",
  "Water Details": "🌊 Water Details",
  "Composition Aids": "📐 Composition Aids",
  "Post-Processing": "🎞 Post-Processing",
  "Season": "🗓️ Season"
  // New entries will default to plain group name
};

// Force all modals hidden immediately (before anything renders)
window.addEventListener('load', () => {
  document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
});


// ✅ Only use DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  // 🧼 Force-hide Load Profile Modal
  const loadModal = document.getElementById('loadProfileModal');
  if (loadModal) {
    loadModal.classList.remove('show');
    loadModal.style.display = 'none';
    console.log('🧼 Load Profile Modal forcibly hidden on load');
  }

  // 🧼 Force-hide Manage Profile Modal
  const manageModal = document.getElementById('manageProfileModal');
  if (manageModal) {
    manageModal.classList.remove('show');
    manageModal.style.display = 'none';
    console.log('🧼 Manage Profile Modal forcibly hidden on load');
  }

  try {
    dropdownOptions = await window.electronAPI.readDropdowns();   
    dropdownOptions = await window.electronAPI.readDropdowns();

// 🧠 Full sync: add new keys, remove stale ones
const storedOrder = JSON.parse(localStorage.getItem('dropdownOrder')) || [];
const currentKeys = Object.keys(dropdownOptions);

// Step 1: Add new keys
let syncedOrder = [...storedOrder];
currentKeys.forEach(key => {
  if (!syncedOrder.includes(key)) {
    syncedOrder.push(key);
  }
});

// Step 2: Remove deleted keys
syncedOrder = syncedOrder.filter(key => currentKeys.includes(key));

localStorage.setItem('dropdownOrder', JSON.stringify(syncedOrder));
dropdownOrder = syncedOrder;
 
await window.electronAPI.writeDropdownOrder(syncedOrder);
      
      
// 🧠 Fix ends

// ✅ This fallback is still fine to keep
if (!Array.isArray(dropdownOrder) || dropdownOrder.length === 0) {
  dropdownOrder = Object.keys(dropdownOptions);
}


    if (!Array.isArray(dropdownOrder) || dropdownOrder.length === 0) {
      dropdownOrder = Object.keys(dropdownOptions);
    }

    console.log("📋 Loaded dropdown order:", dropdownOrder);
    console.log("✅ readDropdowns result:", dropdownOptions);

    checkboxCategories = await window.electronAPI.readCheckboxes();
    console.log("✅ readCheckboxes result:", checkboxCategories);

    renderFields();
    renderButtonBar();  
    populateLoadProfileSubmenu();

  } catch (err) {
    console.error("❌ Renderer failed to load dropdowns/checkboxes:", err);
  }
    
    // ✅ Add this after try/catch block
  try {
  const stored = localStorage.getItem('favoriteProfiles');
  favoriteProfiles = stored && typeof stored === 'string'
    ? JSON.parse(stored)
    : {};
} catch (err) {
  console.warn("⚠️ Failed to parse favoriteProfiles from localStorage, resetting.");
  favoriteProfiles = {};
  localStorage.removeItem('favoriteProfiles');
}



  // ⌨️ CMD+L or CTRL+L opens Manage Profile Modal (repurposed)
document.addEventListener('keydown', e => {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  if ((isMac && e.metaKey && e.key.toLowerCase() === 'l') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'l')) {
    e.preventDefault();
    openManageProfileModal();
  }
});
});


const excludedAnalyzeKeys = [
  "meme_reference",
  "starter_pack_accessories",
  "Background Options",
  "Damage Effects",
  "SFX",
  "Camera Overlays",
  "Lighting Effects",
  "Water Details",
  "Composition Aids",
  "Post-Processing",
  "Season"
];


function renderFields() {
  console.log("✅ renderFields() triggered"); 
  const container = document.getElementById('mainFields');
  container.innerHTML = '';

  // 🔽 Dropdowns
  const orderedKeys = dropdownOrder.length ? dropdownOrder : Object.keys(dropdownOptions);
for (const key of orderedKeys) {

    const row = document.createElement('div');
    row.className = 'field-row';

    const label = document.createElement('label');
    label.textContent = key.replace(/_/g, ' ');

    const select = document.createElement('select');
    select.id = key;
    dropdownOptions[key].forEach(option => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = option;
      select.appendChild(opt);
    });

    const manageBtn = document.createElement('button');
    manageBtn.textContent = '✏️';
    manageBtn.style.marginLeft = '6px';
    manageBtn.onclick = () => openEditDropdownModal(key);

    row.appendChild(label);
    row.appendChild(select);
    row.appendChild(manageBtn);
    container.appendChild(row);
  }
    
}
    
function renderButtonBar() {
  const buttonBar = document.querySelector('.button-bar');
  if (!buttonBar) {
    console.error("❌ .button-bar not found in DOM");
    return;
  }

  buttonBar.innerHTML = ''; // clear old buttons

  Object.keys(checkboxCategories).forEach(key => {
    const btn = document.createElement('button');
    btn.textContent = getButtonLabel(key);
    btn.onclick = () => openDialog(key);
    buttonBar.appendChild(btn);
  });
}

function getButtonLabel(key) {
  const emojiMap = {
    "Background Options": "🖼",
    "Damage Effects": "💥",
    "SFX": "🔊",
    "Camera Overlays": "📷",
    "Lighting Effects": "💡",
    "Water Details": "🌊",
    "Composition Aids": "📐",
    "Post-Processing": "🎞"
  };
  return checkboxButtonLabels[key] || `➕ ${key}`;
}

function updateSelectedCheckbox(category, value, isChecked) {
  if (!selectedCheckboxes[category]) selectedCheckboxes[category] = [];
  if (isChecked && !selectedCheckboxes[category].includes(value)) {
    selectedCheckboxes[category].push(value);
  } else if (!isChecked) {
    selectedCheckboxes[category] = selectedCheckboxes[category].filter(v => v !== value);
  }
  localStorage.setItem('selectedCheckboxes', JSON.stringify(selectedCheckboxes));
}

function openEditDialog(category) {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<h3>Edit ${category}</h3>`;

  const ul = document.createElement('ul');
  ul.id = 'edit-list';

  checkboxCategories[category].forEach((value, index) => {
    const li = document.createElement('li');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;

    const del = document.createElement('button');
    del.textContent = '❌';
    del.onclick = () => {
      checkboxCategories[category].splice(index, 1);
      openEditDialog(category); // re-render
    };

    li.appendChild(input);
    li.appendChild(del);
    ul.appendChild(li);
  });

  // ⬇️ Wrap the list in a scrollable container
  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'subdialog-scroll';
  scrollWrapper.appendChild(ul);

  const add = document.createElement('button');
  add.textContent = 'Add Item';
  add.onclick = () => {
    checkboxCategories[category].push('');
    openEditDialog(category);

    // Wait for DOM update before scroll + focus
    setTimeout(() => {
      const wrapper = document.querySelector('.subdialog-scroll');
      const inputs = wrapper?.querySelectorAll('input');
      const lastInput = inputs?.[inputs.length - 1];

      if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
      if (lastInput) lastInput.focus();
    }, 0);
  };

  const save = document.createElement('button');
  save.textContent = 'Save';
  save.onclick = async () => {
    const inputs = ul.querySelectorAll('input');
    checkboxCategories[category] = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
    await window.electronAPI.saveCheckboxes(checkboxCategories);
    closeDialog();
  };

  const buttons = document.createElement('div');
  buttons.className = 'dialog-buttons';
  buttons.appendChild(add);
  buttons.appendChild(save);
  buttons.appendChild(Object.assign(document.createElement('button'), {
    textContent: 'Close',
    onclick: () => closeDialog()
  }));

  modal.appendChild(scrollWrapper);
  modal.appendChild(buttons);
  modal.classList.add('show', 'manage-profiles-modal');
}


function closeDialog() {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
  modal.classList.remove('manage-profiles');
  modal.innerHTML = ''; // fully wipe content
}

function addDropdownCategory() {
  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <h3>Add New Dropdown Category</h3>

    <div class="field-row">
      <label for="newDropdownKey">Key name:</label>
      <input id="newDropdownKey" type="text" />
    </div>

    <div class="field-row">
      <label for="newDropdownValues">Values:</label>
      <input id="newDropdownValues" type="text" class="config-values" />
    </div>

    <div class="dialog-buttons">
      <button onclick="saveNewDropdown()">OK</button>
      <button onclick="closeDialog()">Cancel</button>
    </div>
  `;

  modal.classList.add('config-modal');
  modal.classList.add('show');
}

async function saveNewDropdown() {
  const key = document.getElementById('newDropdownKey').value.trim();
  const raw = document.getElementById('newDropdownValues').value.trim();
  if (!key || !raw) return;

  dropdownOptions[key] = raw.split(',').map(v => v.trim()).filter(Boolean);
  await window.electronAPI.saveDropdowns(dropdownOptions);
  renderFields();
  closeDialog();
}

function addCheckboxGroup() {
  const modal = document.getElementById('modal');
  modal.innerHTML = `
    <h3>Add New Subdialog Group</h3>

    <div class="field-row">
      <label for="newCheckboxKey">Group:</label>
      <input id="newCheckboxKey" type="text" />
    </div>

    <div class="field-row">
      <label for="newCheckboxValues">Values:</label>
      <input id="newCheckboxValues" type="text" class="config-values" />
    </div>

    <div class="dialog-buttons">
      <button onclick="saveNewCheckboxGroup()">OK</button>
      <button onclick="closeDialog()">Cancel</button>
    </div>
  `;

  modal.classList.add('config-modal');
  modal.classList.add('show');
}

async function saveNewCheckboxGroup() {
  const key = document.getElementById('newCheckboxKey').value.trim();
  const raw = document.getElementById('newCheckboxValues').value.trim();
  if (!key || !raw) return;

  checkboxCategories[key] = raw.split(',').map(v => v.trim()).filter(Boolean);
await window.electronAPI.saveCheckboxes(checkboxCategories);
closeDialog();
renderButtonBar();
openDialog(key); // now the category definitely exists

}

function openDialog(name) {
  if (checkboxCategories[name]) {
    openCheckboxSelectionModal(name); // <- use this for checkbox selections
  } else {
    alert(`Unknown category: "${name}"`);
  }
}

function openCheckboxSelectionModal(category) {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<h3>${category}</h3>`;

  const checkboxes = checkboxCategories[category] || [];
  const selected = selectedCheckboxes[category] || [];

  const wrapper = document.createElement('div');
  wrapper.className = 'checkbox-group';

  checkboxes.forEach(value => {
    const label = document.createElement('label');
    label.className = 'checkbox-item';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = value;
    input.checked = selected.includes(value);

    input.onchange = () => {
      updateSelectedCheckbox(category, value, input.checked);
    };

    label.appendChild(input);
    label.append(` ${value}`);
    wrapper.appendChild(label);
  });

  const buttons = document.createElement('div');
  buttons.className = 'dialog-buttons';

  const editBtn = document.createElement('button');
  editBtn.textContent = '✏️ Edit Group';
  editBtn.onclick = () => openEditDialog(category);

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.onclick = () => closeDialog();

  buttons.appendChild(editBtn);
  buttons.appendChild(close);

  // ✅ Wrap the checkbox list in a scrollable container
const scrollWrapper = document.createElement('div');
scrollWrapper.className = 'subdialog-scroll';
scrollWrapper.appendChild(wrapper);

modal.appendChild(scrollWrapper);
modal.appendChild(buttons);
modal.classList.add('show');

}

function openEditDropdownModal(key) {
  const modal = document.getElementById('modal');
  modal.innerHTML = `<h3>Edit ${key.replace(/_/g, ' ')}</h3>`;

  const ul = document.createElement('ul');
  ul.id = 'dropdown-edit-list';

  dropdownOptions[key].forEach((value, index) => {
    const li = document.createElement('li');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;

    const del = document.createElement('button');
    del.textContent = '❌';
    del.onclick = () => {
      dropdownOptions[key].splice(index, 1);
      openEditDropdownModal(key); // Re-render the modal
    };

    li.appendChild(input);
    li.appendChild(del);
    ul.appendChild(li);
  });

  // ✅ Scrollable wrapper for the list
  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'subdialog-scroll';
  scrollWrapper.appendChild(ul);

  // ✅ Footer buttons (static)
  const add = document.createElement('button');
  add.textContent = 'Add Item';
  add.onclick = () => {
    dropdownOptions[key].push('');
    openEditDropdownModal(key);
      
  // Wait for DOM to update before scrolling/focusing
  setTimeout(() => {
    const wrapper = document.querySelector('.subdialog-scroll');
    const inputs = wrapper?.querySelectorAll('input');
    const lastInput = inputs?.[inputs.length - 1];
    
    if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
    if (lastInput) lastInput.focus();
  }, 0);
};

  const save = document.createElement('button');
  save.textContent = 'Save';
  save.onclick = async () => {
    const inputs = ul.querySelectorAll('input');
    dropdownOptions[key] = Array.from(inputs).map(i => i.value.trim()).filter(v => v);
    await window.electronAPI.saveDropdowns(dropdownOptions);
    renderFields();
    closeDialog();
  };

  const buttons = document.createElement('div');
  buttons.className = 'dialog-buttons';
  buttons.appendChild(add);
  buttons.appendChild(save);
  buttons.appendChild(Object.assign(document.createElement('button'), {
    textContent: 'Close',
    onclick: () => closeDialog()
  }));

  // ✅ Rebuild modal layout
  modal.appendChild(scrollWrapper);
  modal.appendChild(buttons);
  modal.classList.add('show');
}

function openReorderDropdownModal() {
  const modal = document.getElementById('modal');
  modal.innerHTML = '<h3>Reorder Dropdown Categories</h3>';

  const ul = document.createElement('ul');
  ul.id = 'reorder-list';
  ul.className = 'reorder-list';

  const keys = dropdownOrder.length ? dropdownOrder : Object.keys(dropdownOptions);
  keys.forEach(key => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="drag-handle">≡</span><span class="label-text">${key}</span>`;
    li.draggable = true;
    li.ondragstart = e => {
      draggedKey = key;    
      e.dataTransfer.setData('text/plain', key);
      e.dataTransfer.effectAllowed = 'move';
      li.classList.add('dragging');    
    };
    li.ondragend = () => {
      draggedKey = null;
      document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
      document.querySelectorAll('.drag-target').forEach(el => el.classList.remove('drag-target'));
      document.querySelectorAll('.insertion-line').forEach(el => el.remove());

    };
  
    li.ondragover = e => {
      e.preventDefault();
      if (key !== draggedKey) {
      document.querySelectorAll('.drag-target').forEach(el => el.classList.remove('drag-target'));
      document.querySelectorAll('.insertion-line').forEach(el => el.remove());

      li.classList.add('drag-target');

    const line = document.createElement('div');
    line.className = 'insertion-line';
    li.parentNode.insertBefore(line, li);
  }
};
    
    li.ondrop = e => {
      e.preventDefault();
      const dragged = e.dataTransfer.getData('text/plain');
      const fromIndex = dropdownOrder.indexOf(dragged);
      const toIndex = dropdownOrder.indexOf(key);
      dropdownOrder.splice(fromIndex, 1);
      dropdownOrder.splice(toIndex, 0, dragged);
      openReorderDropdownModal(); // rerender updated list
    };
    ul.appendChild(li);
  });

  const save = document.createElement('button');
  save.textContent = 'Save Order';
  save.onclick = async () => {
    await window.electronAPI.saveDropdownOrder(dropdownOrder); // 🛠 we’ll define this
    renderFields();
    closeDialog();
  };

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.onclick = () => closeDialog();

  const buttons = document.createElement('div');
  buttons.className = 'dialog-buttons';
  buttons.appendChild(save);
  buttons.appendChild(close);

  const scrollWrapper = document.createElement('div');
  scrollWrapper.style.maxHeight = '400px';
  scrollWrapper.style.overflowY = 'auto';
  scrollWrapper.style.marginBottom = '12px';
  scrollWrapper.appendChild(ul);

  modal.appendChild(scrollWrapper);
  modal.appendChild(buttons);
  modal.classList.add('show');
}

function copyJSON() {
  const obj = {};
  let preamble = document.getElementById('preamble').value.trim();
const prefix = "Use the following JSON parameters to generate an image of ";

if (preamble && !preamble.startsWith(prefix)) {
  preamble = prefix + preamble;
}

if (preamble) obj.preamble = preamble;


  for (const key in dropdownOptions) {
    const el = document.getElementById(key);
    if (el && el.value) obj[key] = el.value;
  }

  for (const cat in checkboxCategories) {
    const values = selectedCheckboxes[cat] || [];
    if (values.length) obj[cat] = values.join(', ');
  }

  navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
  alert('Copied JSON to clipboard!');
}

function copyMidjourneyPrompt() {
  const obj = {};
  let preamble = document.getElementById('preamble').value.trim();
  const prefix = "Use the following JSON parameters to generate an image of ";
  if (preamble.startsWith(prefix)) {
    preamble = preamble.slice(prefix.length);
  }

  // Core structure
  const base = preamble;
  const baseDescriptors = [
    getVal('character_substrate_base'),
    getVal('character_substrate_coating'),
    getVal('body_language'),
    getVal('body_response')
  ].filter(Boolean).join(', ');

  const environment = [
    getVal('environment'),
    getVal('environmental_density')
  ].filter(Boolean).join(', ');

  const artStyle = [
    getVal('style'),
    `style of ${getVal('artist_style')}`,
    getVal('director_style') ? `directed by ${getVal('director_style')}` : null
  ].filter(Boolean).join(', ');

  const lighting = [
    getVal('lighting_type'),
    getVal('lighting_direction'),
    getVal('lighting_intensity'),
    getVal('lighting_accent_colors') ? `rim light: ${getVal('lighting_accent_colors')}` : null
  ].filter(Boolean).join(', ');

  const background = [
    getVal('background_color'),
    getVal('background_texture')
  ].filter(Boolean).join(', ');

  const color = [
    getVal('color_scheme_primary'),
    getVal('color_scheme_secondary'),
    getVal('color_scheme_highlights') ? `highlights: ${getVal('color_scheme_highlights')}` : null
  ].filter(Boolean).join(', ');

  const surface = [
    getVal('surface_texture'),
    getVal('shadow_style'),
    getVal('highlight_profile')
  ].filter(Boolean).join(', ');

  const linework = [
    getVal('ink_weight'),
    getVal('linework_density'),
    getVal('Post-Processing')
  ].filter(Boolean).join(', ');

  const composition = getVal('Composition Aids');
  const seed = getVal('seed') || Math.floor(Math.random() * 10000);
  const aspect = getVal('aspect_ratio') || '1:1';

  const prompt = [
    base,
    baseDescriptors && `— ${baseDescriptors}`,
    environment && `— ${environment}`,
    artStyle && `— ${artStyle}`,
    lighting && `— ${lighting}`,
    background && `— ${background}`,
    color && `— ${color}`,
    surface && `— ${surface}`,
    linework && `— ${linework}`,
    composition && `— ${composition}`,
    `--ar ${aspect}`,
    `--style raw`,
    `--seed ${seed}`,
    `--v 7`
  ].filter(Boolean).join(' ');

  navigator.clipboard.writeText(prompt);
  alert("📸 MidJourney prompt copied to clipboard!");
}

// Helper to safely fetch values
function getVal(key) {
  const el = document.getElementById(key);
  return el && el.value ? el.value.trim() : null;
}
    
function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
  const label = document.querySelector('#darkModeToggle span');
  label.textContent = document.body.classList.contains('light-mode') ? 'Dark Mode' : 'Light Mode';
}
   
function copyAnalyzeThis() {
  const instructionLine = "analyze this image and create a new JSON filling in the key values below\n\n";

  const obj = {
    preamble: "create a preamble for this JSON when you are analyzing it. Once written, wrap it like this: 'Use the following JSON parameters to generate an image of ${preamble}'"
  };

  for (const key of Object.keys(dropdownOptions)) {
    if (!excludedAnalyzeKeys.includes(key)) {
      obj[key] = "";
    }
  }

  for (const cat of Object.keys(checkboxCategories)) {
    if (!excludedAnalyzeKeys.includes(cat)) {
      obj[cat] = "";
    }
  }

  const output = instructionLine + JSON.stringify(obj, null, 2);
  navigator.clipboard.writeText(output);
  alert('Analyze THIS template copied to clipboard!');
}


function randomizeFields() {
  for (const key in dropdownOptions) {
    const el = document.getElementById(key);
    const opts = dropdownOptions[key];
    if (el && opts.length) {
      const random = opts[Math.floor(Math.random() * opts.length)];
      el.value = random;
    }
  }

  randomizedCheckboxes = {};
  selectedCheckboxes = {};
  for (const cat in checkboxCategories) {
    const values = checkboxCategories[cat];
    if (values.length) {
      const chosen = values[Math.floor(Math.random() * values.length)];
      randomizedCheckboxes[cat] = [chosen];
      selectedCheckboxes[cat] = [chosen];
    }
  }

  localStorage.setItem('selectedCheckboxes', JSON.stringify(selectedCheckboxes));
  window.scrollTo({ top: 0, behavior: 'smooth' });
if (document.activeElement && typeof document.activeElement.blur === 'function') {
  document.activeElement.blur();
}

}

function clearCheckboxes() {
  randomizedCheckboxes = {};
  selectedCheckboxes = {};
  localStorage.setItem('selectedCheckboxes', JSON.stringify(selectedCheckboxes));
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
  alert('All checkboxes cleared.');
}

function newProfile() {
  if (!confirm("Start a new profile? Unsaved changes will be lost.")) return;

  // Clear preamble
  document.getElementById('preamble').value = '';

  // Reset dropdowns
  for (const key in dropdownOptions) {
    const select = document.getElementById(key);
    if (select && select.options.length > 0) {
      select.selectedIndex = 0; // or select.value = ''; if empty is default
    }
  }

  // Reset checkboxes
  selectedCheckboxes = {};
  localStorage.setItem('selectedCheckboxes', JSON.stringify(selectedCheckboxes));
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);

  // ✅ Reset current profile tracker
  currentProfileName = null;
    
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Optional: set temporary unsaved name
  currentProfileName = null;
  updateProfileLabel();    

  alert("🆕 New profile created. Don’t forget to save!");
}

function updateProfileLabel() {
  const label = document.getElementById('currentProfileLabel');
  if (!label) return;

  label.textContent = currentProfileName ? currentProfileName : '[unsaved]';
}

async function populateLoadProfileSubmenu() {
  const submenu = document.getElementById('loadProfileSubmenu');
  submenu.innerHTML = '';

  try {
    const structure = await window.electronAPI.getProfileStructure();
    if (!structure || Object.keys(structure).length === 0) {
      const item = document.createElement('li');
      item.textContent = '(No profiles)';
      submenu.appendChild(item);
      return;
    }

    // Inject "★ Favorites" at the top
if (favoriteProfiles && Object.keys(favoriteProfiles).length > 0) {
  const favItem = document.createElement('li');
  favItem.classList.add('has-submenu');

  const span = document.createElement('span');
  span.textContent = '★ Favorites ▸';
  favItem.appendChild(span);

  const nested = document.createElement('ul');
  nested.classList.add('submenu', 'nested-submenu');

  Object.keys(favoriteProfiles).forEach(path => {
    const profile = path.split('/').pop();
    const li = document.createElement('li');
    li.textContent = profile;
    li.onclick = () => loadProfile(path);
    nested.appendChild(li);
  });

  favItem.appendChild(nested);
  submenu.appendChild(favItem);
}
  
      
    for (const folder in structure) {
      const profiles = structure[folder];

      if (folder === '(Root Profiles)') {
        profiles.forEach(profile => {
          const li = document.createElement('li');
          li.textContent = profile;
          li.onclick = () => loadProfile(profile);
          submenu.appendChild(li);
        });
      } else {
        const folderItem = document.createElement('li');
        folderItem.classList.add('has-submenu');

        const span = document.createElement('span');
        span.textContent = `${folder} ▸`;
        folderItem.appendChild(span);

        const nested = document.createElement('ul');
        nested.classList.add('submenu', 'nested-submenu');

        profiles.forEach(profile => {
          const li = document.createElement('li');
          li.textContent = profile;
          li.onclick = () => loadProfile(`${folder}/${profile}`);
          nested.appendChild(li);
        });

        folderItem.appendChild(nested);
        submenu.appendChild(folderItem);
      }
    }
  } catch (err) {
    console.error('Failed to fetch profile structure:', err);
    const item = document.createElement('li');
    item.textContent = '(Error loading profiles)';
    submenu.appendChild(item);
  }
}

/* ======================
   LOAD PROFILE MODAL FUNCTIONS (Retired 2025-05-26)
   ====================== */

// let selectedProfileToLoad = null;

// function closeLoadProfileModal() {
//   console.log("🟥 closeLoadProfileModal CALLED");
//   const modal = document.getElementById('loadProfileModal');
//   if (modal) {
//     modal.classList.remove('show');
//     modal.style.display = '';
//   }
//   selectedProfileToLoad = null;
//   document.querySelectorAll('#loadFolderList li.selected, #loadProfileResults li.selected')
//     .forEach(el => el.classList.remove('selected'));
// }

// async function openLoadProfileModal() {
//   console.trace('🕵️‍♂️ openLoadProfileModal() CALLED (async)');
//   const modal = document.getElementById('loadProfileModal');
//   if (!modal) return;

//   if (modal.classList.contains('show')) {
//     closeLoadProfileModal();
//     return;
//   }

//   modal.classList.add('show');
//   modal.style.display = '';
//   document.getElementById('loadProfileSearch').value = '';
//   selectedProfileToLoad = null;

//   try {
//     structure = await window.electronAPI.getProfileStructure();
//     const folderList = document.getElementById('loadFolderList');
//     if (!folderList) return;
//     folderList.innerHTML = '';

//     Object.keys(structure).forEach(folder => {
//       const li = document.createElement('li');
//       li.textContent = folder;
//       li.onclick = () => {
//         const alreadySelected = li.classList.contains('selected');
//         document.querySelectorAll('#loadFolderList li').forEach(item => item.classList.remove('selected'));
//         if (!alreadySelected) {
//           li.classList.add('selected');
//           filterProfiles(folder);
//         } else {
//           filterProfiles();
//         }
//       };
//       folderList.appendChild(li);
//     });
//   } catch (err) {
//     console.error('Failed to load profile structure:', err);
//     alert('Error loading profiles');
//   }
// }

// function filterProfiles(folder = null) {
//   const searchInput = document.getElementById('loadProfileSearch');
//   const resultsList = document.getElementById('loadProfileResults');
//   if (!searchInput || !resultsList || !structure) return;

//   const searchTerm = searchInput.value.toLowerCase();
//   resultsList.innerHTML = '';
//   const selectedFolder = folder || document.querySelector('#loadFolderList li.selected')?.textContent;
//   const foldersToSearch = selectedFolder ? [selectedFolder] : Object.keys(structure);

//   foldersToSearch.forEach(folderName => {
//     const profiles = structure[folderName] || [];
//     profiles.forEach(profile => {
//       if (profile.toLowerCase().includes(searchTerm)) {
//         const li = document.createElement('li');
//         li.textContent = selectedFolder ? profile : `${folderName}/${profile}`;
//         li.onclick = () => {
//           document.querySelectorAll('#loadProfileResults li').forEach(item => item.classList.remove('selected'));
//           li.classList.add('selected');
//           selectedProfileToLoad = folderName === '(Root Profiles)' 
//             ? profile 
//             : `${folderName}/${profile}`;
//         };
//         resultsList.appendChild(li);
//       }
//     });
//   });
// }

// function confirmLoadProfile() {
//   if (selectedProfileToLoad) {
//     loadProfile(selectedProfileToLoad);
//     closeLoadProfileModal();
//   } else {
//     alert('Please select a profile to load');
//   }
// }

// window.openLoadProfileModal = openLoadProfileModal;
// window.closeLoadProfileModal = closeLoadProfileModal;
// window.confirmLoadProfile = confirmLoadProfile;


 
    
// ======================
// MANAGE PROFILE MODAL FUNCTIONS
// ======================

let selectedManageProfile = null;
let selectedManageFolder = null;
let favoriteProfiles = JSON.parse(localStorage.getItem('favoriteProfiles') || '{}');

async function openManageProfileModal() {
  const modal = document.getElementById('manageProfileModal');
  if (!modal) return;

  // ✅ Load profile structure
  try {
    structure = await window.electronAPI.getProfileStructure();
  } catch (err) {
    console.error("❌ Failed to fetch profile structure for Manage modal:", err);
    alert("Could not load profiles.");
    return;
  }

  modal.classList.add('show');
  modal.style.display = '';

  document.getElementById('manageProfileSearch').value = '';
  selectedManageProfile = null;
  selectedManageFolder = null;

  renderManageFolders();
  filterManageProfiles();
}

function closeManageProfileModal() {
  const modal = document.getElementById('manageProfileModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none'; // 💥 THE LINE
  }
  selectedManageProfile = null;
  selectedManageFolder = null;
}

function renderManageFolders() {
  const folderList = document.getElementById('manageFolderList');
  folderList.innerHTML = '';

  // ✅ Sort folders: Root first, then alphabetical
  const folders = Object.keys(structure).sort((a, b) => {
    if (a === '(Root Profiles)') return -1;
    if (b === '(Root Profiles)') return 1;
    return a.localeCompare(b);
  });

  folders.forEach(folder => {
    const li = document.createElement('li');
    li.textContent = folder;

    li.onclick = () => {
      const alreadySelected = li.classList.contains('selected');
      document.querySelectorAll('#manageFolderList li').forEach(item => item.classList.remove('selected'));

      if (!alreadySelected) {
        li.classList.add('selected');
        selectedManageFolder = folder;
        filterManageProfiles(folder);
      } else {
        selectedManageFolder = null;
        filterManageProfiles();
      }
    };

    folderList.appendChild(li);
  });
}


function filterManageProfiles(folder = null) {
  const searchInput = document.getElementById('manageProfileSearch');
  const resultsList = document.getElementById('manageProfileResults');
  if (!searchInput || !resultsList || !structure) return;

  const searchTerm = searchInput.value.toLowerCase();
  resultsList.innerHTML = '';

  // ✅ Determine which folders to search
  const foldersToSearch = (folder || selectedManageFolder)
    ? [folder || selectedManageFolder]
    : Object.keys(structure);

  const allProfiles = [];

  foldersToSearch.forEach(folderName => {
    const profiles = structure[folderName] || [];

    profiles.forEach(profile => {
      const fullPath = folderName === '(Root Profiles)' ? profile : `${folderName}/${profile}`;
      if (profile.toLowerCase().includes(searchTerm)) {
        allProfiles.push({
          profile,
          folderName,
          fullPath,
          isFavorite: !!favoriteProfiles[fullPath],
          isRoot: folderName === '(Root Profiles)'
        });
      }
    });
  });

  // ✅ Sort logic
  const sorted = allProfiles.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return b.isFavorite - a.isFavorite;
    if (a.isRoot !== b.isRoot) return b.isRoot - a.isRoot;
    return a.profile.localeCompare(b.profile);
  });

  sorted.forEach(({ profile, folderName, fullPath, isFavorite }) => {
    const li = document.createElement('li');
    li.textContent = `${isFavorite ? '★ ' : ''}${profile}`;

    li.onclick = () => {
      document.querySelectorAll('#manageProfileResults li').forEach(item => item.classList.remove('selected'));
      li.classList.add('selected');
      selectedManageProfile = fullPath;
    };

    resultsList.appendChild(li);
  });
}



function toggleFavoriteSelectedProfile() {
  if (!selectedManageProfile) return;

  const isNowFavorite = !favoriteProfiles[selectedManageProfile];

  // Update local favorite cache
  if (isNowFavorite) {
    favoriteProfiles[selectedManageProfile] = true;
  } else {
    delete favoriteProfiles[selectedManageProfile];
  }

  localStorage.setItem('favoriteProfiles', JSON.stringify(favoriteProfiles));

  const selectedLi = document.querySelector('#manageProfileResults li.selected');
  if (selectedLi) {
    selectedLi.style.position = 'relative';

    // FAVORITE: Slide in star from left
    if (isNowFavorite) {
      const star = document.createElement('span');
      star.className = 'sparkle-star';
      star.textContent = '★';

      // Clean any existing star to avoid doubles
      if (selectedLi.firstChild && selectedLi.firstChild.nodeType === Node.TEXT_NODE) {
        selectedLi.textContent = ''; // Clear all
        selectedLi.appendChild(star);
        selectedLi.append(' ' + selectedManageProfile.split('/').pop());
      }

    } else {
      // UNFAVORITE: Star drifts upward
      const staticStarIndex = selectedLi.textContent.indexOf('★');
const nameOnly = selectedLi.textContent.replace(/^★\s*/, '');
selectedLi.textContent = ''; // Clear text

const starWrapper = document.createElement('span');
starWrapper.className = 'sparkle-drift';
starWrapper.textContent = '★';

selectedLi.appendChild(starWrapper);
selectedLi.append(' ' + nameOnly);

setTimeout(() => starWrapper.remove(), 800);

      setTimeout(() => drift.remove(), 800);
    }
  }

  const pathToPreserve = selectedManageProfile;

  // Delay re-render so animation is visible
  setTimeout(() => {
    filterManageProfiles(selectedManageFolder);

    const newLi = [...document.querySelectorAll('#manageProfileResults li')].find(li =>
      li.textContent.includes(pathToPreserve.split('/').pop())
    );

    if (newLi) {
      newLi.classList.add('selected');
    }

    renderManageFolders();
    populateLoadProfileSubmenu();
  }, 600);
}


function loadSelectedProfile() {
  console.log("🔍 Attempting to load profile:", selectedManageProfile);
  if (!selectedManageProfile) {
    alert("Please select a profile to load.");
    return;
  }

  const parts = selectedManageProfile.split('/');
  const profile = parts.pop();
  const folder = parts.join('/');

  loadProfile(profile, folder)
    .then(() => {
      console.log("✅ Loaded profile:", selectedManageProfile);
      document.getElementById('manageProfileModal').style.display = 'none';
    })
    .catch(err => {
      console.error("❌ Error loading profile:", err);
      alert("Failed to load profile.");
    });
}


function openRenameSelectedProfileModal() {
  if (!selectedManageProfile) return;

  const currentName = selectedManageProfile.split('/').pop();
  openRenameModal(currentName, async newName => {
    const folder = selectedManageProfile.includes('/')
      ? selectedManageProfile.split('/')[0]
      : '(Root Profiles)';

    const oldName = currentName;

    console.log("📦 Renaming profile:", {
      folder,
      oldName,
      newName
    });

    try {
      // ✅ Use correct backend signature
      await window.electronAPI.renameProfile(folder, oldName, newName);

      // 📁 Update path strings
      const oldPath = folder === '(Root Profiles)' ? oldName : `${folder}/${oldName}`;
      const newPath = folder === '(Root Profiles)' ? newName : `${folder}/${newName}`;

      // 🔄 Update favorites if needed
      if (favoriteProfiles[oldPath]) {
        favoriteProfiles[newPath] = true;
        delete favoriteProfiles[oldPath];
        localStorage.setItem('favoriteProfiles', JSON.stringify(favoriteProfiles));
      }

      // 🧭 Update internal state
      selectedManageProfile = newPath;
      selectedManageFolder = folder;

      // 🔄 Refresh UI
      openManageProfileModal();
      populateLoadProfileSubmenu();

      // ✨ Reselect renamed profile after short delay
      setTimeout(() => {
        const listItems = document.querySelectorAll('#manageProfileResults li');
        listItems.forEach(li => {
          if (li.textContent.includes(newName)) {
            li.classList.add('selected');
          }
        });
      }, 200);

    } catch (err) {
      alert('❌ Rename failed.');
      console.error('Rename error:', err);
    }
  });
}


function deleteSelectedProfile() {
  if (!selectedManageProfile) return;
  if (!confirm(`Delete profile "${selectedManageProfile}"?`)) return;

  window.electronAPI.deleteProfile(selectedManageProfile).then(() => {
    delete favoriteProfiles[selectedManageProfile];
    localStorage.setItem('favoriteProfiles', JSON.stringify(favoriteProfiles));
    openManageProfileModal(); // Re-render after delete
  });
}

// Expose globally
window.openManageProfileModal = openManageProfileModal;
window.closeManageProfileModal = closeManageProfileModal;
window.toggleFavoriteSelectedProfile = toggleFavoriteSelectedProfile;
window.openRenameSelectedProfileModal = openRenameSelectedProfileModal;
window.deleteSelectedProfile = deleteSelectedProfile;


async function loadProfile(profileName, folderPath = '') {
  try {
    const data = await window.electronAPI.loadProfile(profileName, folderPath);

    if (data.preamble) {
      let cleanPreamble = data.preamble.trim();
      const prefix = "Use the following JSON parameters to generate an image of ";
      if (cleanPreamble.startsWith(prefix)) {
        cleanPreamble = cleanPreamble.slice(prefix.length);
      }
      document.getElementById('preamble').value = cleanPreamble;
    }

    // Handle dropdowns
    const dropdowns = data.dropdownSelections || data;
    for (const key in dropdownOptions) {
      if (dropdowns[key] && document.getElementById(key)) {
        document.getElementById(key).value = dropdowns[key];
      }
    }

    // Handle checkboxes
    const checkboxes = data.selectedCheckboxes || data;
    for (const cat in checkboxCategories) {
      selectedCheckboxes[cat] = [];
      const values = checkboxes[cat];
      if (Array.isArray(values)) {
        selectedCheckboxes[cat] = values;
      } else if (typeof values === 'string') {
        selectedCheckboxes[cat] = values.split(',').map(v => v.trim());
      }
    }

    localStorage.setItem('selectedCheckboxes', JSON.stringify(selectedCheckboxes));
    currentProfileName = profileName;
    updateProfileLabel();  
    alert(`Profile "${profileName}" loaded.`);
  } catch (err) {
    console.error('Failed to load profile:', err);
    alert('Could not load profile.');
  }
}

function openImportJsonDialog() {
  const modal = document.getElementById('importJsonModal');
  modal.classList.add('show');

  // ✅ Paste JSON Text
  const pasteBtn = document.getElementById('pasteJsonBtn');
  if (pasteBtn) {
    pasteBtn.onclick = async () => {
      try {
        const text = await navigator.clipboard.readText();
        document.getElementById('importJsonText').value = text;
      } catch (err) {
        alert("❌ Failed to read from clipboard.");
        console.error(err);
      }
    };
  }

  // ✅ From File
  const fileBtn = document.getElementById('fromFileBtn');
  if (fileBtn) {
    fileBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          document.getElementById('importJsonText').value = e.target.result;
        };
        reader.readAsText(file);
      };
      input.click();
    };
  }
}

function closeImportJsonDialog() {
  document.getElementById('importJsonModal').classList.remove('show');
}

function saveProfile() {
  if (currentProfileName) {
  confirmSaveProfile(); // ✅ Skip modal, just update file
} else {
  document.getElementById('saveProfileModal').classList.add('show');
}

}

function closeSaveProfileModal() {
  const modal = document.getElementById('saveProfileModal');
  modal.classList.remove('show');
  document.getElementById('profileNameInput').value = '';

  // Reset header back to regular Save
  const header = modal.querySelector('h3');
  if (header) header.textContent = '💾 Save Profile';
}


async function confirmSaveProfile() {
  let name = document.getElementById('profileNameInput').value.trim() || currentProfileName;
if (!name) return;

  const profileData = {
    preamble: document.getElementById('preamble').value.trim(),
    selectedCheckboxes,
    dropdownSelections: {}
  };

  for (const key in dropdownOptions) {
    const el = document.getElementById(key);
    if (el && el.value) {
      profileData.dropdownSelections[key] = el.value;
    }
  }

  try {
    await window.electronAPI.saveProfile(name, profileData);
    currentProfileName = name; // ✅ Track it going forward
    updateProfileLabel();  
    alert(`Profile "${name}" saved.`);
    closeSaveProfileModal();
    populateLoadProfileSubmenu();
  } catch (err) {
    console.error('Failed to save profile:', err);
    alert('Failed to save profile.');
  }
}

function saveAsProfile() {
  const modal = document.getElementById('saveProfileModal');
  const input = document.getElementById('profileNameInput');

  // Prefill with current name (or empty if none)
  input.value = currentProfileName || '';

  // ✏️ Update modal header
  const header = modal.querySelector('h3');
  if (header) header.textContent = '✏️ Save Profile As...';

  // Clear current profile name to force new save
  currentProfileName = null;

  modal.classList.add('show');
}



let selectedLoadProfile = null;



                  
async function importJsonAsProfile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const data = JSON.parse(e.target.result);

      // STEP 1: Apply preamble
      document.getElementById('preamble').value = preamble || data.preamble || '';


      // STEP 2: Add dropdown values
      for (const key in dropdownOptions) {
        if (key in data && typeof data[key] === 'string' && data[key].trim()) {
          const val = data[key].trim();
          if (!dropdownOptions[key].includes(val)) {
            dropdownOptions[key].push(val);
          }
        }
      }

      // STEP 3: Add checkbox values
      for (const key in checkboxCategories) {
        if (key in data) {
          const raw = data[key];
          const newValues = Array.isArray(raw)
            ? raw
            : typeof raw === 'string'
              ? raw.split(',').map(v => v.trim())
              : [];

          newValues.forEach(v => {
            if (v && !checkboxCategories[key].includes(v)) {
              checkboxCategories[key].push(v);
            }
          });
        }
      }

      // STEP 4: Save updated configs
      await window.electronAPI.saveDropdowns(dropdownOptions);
      await window.electronAPI.saveCheckboxes(checkboxCategories);

      // STEP 5: Re-render everything
      renderFields();
      renderButtonBar();

      alert("✅ JSON imported successfully as a profile!");
    } catch (err) {
      console.error("❌ Failed to import JSON:", err);
      alert("Invalid JSON format or data.");
    }
  };

  reader.readAsText(file);
}

async function confirmImportJson() {
  console.log("🟩 confirmImportJson() triggered");
    
  const rawJson = document.getElementById('importJsonText').value.trim();
  const profileName = document.getElementById('importProfileName').value.trim();
  const preamble = document.getElementById('importPreamble').value.trim();


  if (!rawJson || !profileName) {
    alert("Please paste JSON and enter a profile name.");
    return;
  }

  try {
    const data = JSON.parse(rawJson);

    // ✅ Update preamble
    if (data.preamble) {
      document.getElementById('preamble').value = data.preamble;
    }

    // ✅ Merge dropdown values
for (const key in dropdownOptions) {
  if (key in data && typeof data[key] === 'string' && data[key].trim()) {
    const val = data[key].trim();
    if (
      val &&
      val.toLowerCase() !== 'none' &&
      !dropdownOptions[key].includes(val)
    ) {
      dropdownOptions[key].push(val);
    }
  }
}


    // ✅ Merge checkbox values
    for (const key in checkboxCategories) {
      if (key in data) {
        const raw = data[key];
        const values = Array.isArray(raw)
          ? raw
          : typeof raw === 'string'
            ? raw.split(',').map(v => v.trim())
            : [];

        values.forEach(v => {
          if (v && !checkboxCategories[key].includes(v)) {
            checkboxCategories[key].push(v);
          }
        });
      }
    }

    // ✅ Save config files
    await window.electronAPI.saveDropdowns(dropdownOptions);
    await window.electronAPI.saveCheckboxes(checkboxCategories);

    // ✅ Save the profile itself
    const profileData = {
  preamble: preamble || data.preamble || '',
  dropdownSelections: {},
  selectedCheckboxes: {}
};


    for (const key in dropdownOptions) {
      if (data[key]) profileData.dropdownSelections[key] = data[key];
    }

    for (const key in checkboxCategories) {
      if (data[key]) {
        const values = Array.isArray(data[key])
          ? data[key]
          : typeof data[key] === 'string'
            ? data[key].split(',').map(v => v.trim())
            : [];

        profileData.selectedCheckboxes[key] = values;
      }
    }

    await window.electronAPI.saveProfile(profileName, profileData);

    renderFields();
    renderButtonBar();
    populateLoadProfileSubmenu();
    closeImportJsonDialog();

    alert(`✅ Imported JSON and saved as profile "${profileName}"`);
  } catch (err) {
    console.error("❌ Failed to import JSON:", err);
    alert("Invalid JSON or error during import.");
  }
}


function exportDropdowns() {
  const data = JSON.stringify(dropdownOptions, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dropdown_config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function importDropdowns(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      dropdownOptions = JSON.parse(e.target.result);
      localStorage.setItem('dropdownOptions', JSON.stringify(dropdownOptions));
      renderFields();
    } catch (err) {
      alert('Invalid JSON format');
    }
  };
  reader.readAsText(file);
}

window.openDialog = openDialog;
window.addDropdownCategory = addDropdownCategory;
window.addCheckboxGroup = addCheckboxGroup;
window.copyJSON = copyJSON;
window.randomizeFields = randomizeFields;
window.clearCheckboxes = clearCheckboxes;
window.importJsonAsProfile = importJsonAsProfile;
window.confirmImportJson = confirmImportJson;
window.openImportJsonDialog = openImportJsonDialog;
window.closeImportJsonDialog = closeImportJsonDialog;
// window.manageProfiles = manageProfiles;

    

function openRenameModal(currentName, onConfirm) {
  const input = document.getElementById('renameProfileInput');
  const modal = document.getElementById('renameProfileModal');
  input.value = currentName;
  renameCallback = onConfirm;
    
  console.log('📥 Rename modal opened with current name:', currentName);
    
  modal.classList.add('show');
  setTimeout(() => input.focus(), 0);
}

function closeRenameModal() {
  const modal = document.getElementById('renameProfileModal');
  modal.classList.remove('show');
  document.getElementById('renameProfileInput').value = '';
  renameCallback = null;
}

document.getElementById('renameConfirmBtn').onclick = () => {
  const input = document.getElementById('renameProfileInput');
  const newName = input?.value?.trim();
  console.log('🔧 Rename clicked with:', newName);

  if (!newName) {
    alert("Please enter a new name.");
    return;
  }

  if (typeof renameCallback === 'function') {
    renameCallback(newName); // ✅ Pass value BEFORE modal closes
  }

  closeRenameModal(); // 🛑 Don't call this before getting the input
};




window.openRenameModal = openRenameModal;
window.closeRenameModal = closeRenameModal;



// Expose to HTML
// window.openLoadProfileModal = openLoadProfileModal; // 
// window.closeLoadProfileModal = closeLoadProfileModal; // 



// 🔽 Render folder pane
function renderFolderPane() {
  const pane = document.getElementById('profileFolderPane');
  if (!structure) return;

  pane.innerHTML = '';
  Object.keys(structure).forEach(folder => {
    const div = document.createElement('div');
    div.className = 'folder-btn';
    div.textContent = folder;
    div.onclick = () => {
      selectedFolder = folder;
      renderResultsPane();
    };
    pane.appendChild(div);
  });
}

// 🔽 Render results based on selected folder
function renderResultsPane() {
  const query = document.getElementById('profileSearchInput').value.toLowerCase();
  const pane = document.getElementById('profileResultsPane');
  pane.innerHTML = '';

  if (!structure || !selectedFolder || !structure[selectedFolder]) return;

  const profiles = structure[selectedFolder].filter(p => p.toLowerCase().includes(query));

  profiles.forEach(profile => {
    const div = document.createElement('div');
    div.className = 'profile-result';
    div.textContent = profile;
    div.onclick = () => selectLoadProfile(profile);
    pane.appendChild(div);
  });
}
