// Full main.js with editable dropdowns, modal management, checkbox editing, and JSON export

let dropdownOptions = {};
let checkboxCategories = {};
let randomizedCheckboxes = {};
let selectedCheckboxes = getStoredJson('selectedCheckboxes', {});
let selectedDropdowns = getStoredJson('selectedDropdowns', {});
let lockedDropdowns = getStoredJson('lockedDropdowns', {});
let lockedCheckboxGroups = getStoredJson('lockedCheckboxGroups', {});
let dropdownOrder = [];
let draggedKey = null;
let currentProfileName = null; // null until user saves or loads
let structure;
let selectedFolder = null;
let renameCallback = null;
let activeFieldTab = localStorage.getItem('activeFieldTab') || 'all';
let activeFieldSearch = '';

const fieldTabs = {
  all: null,
  subject: [
    'prompt_intent',
    'subject_type',
    'subject_action',
    'pose_body_language',
    'facial_expression'
  ],
  style: [
    'image_medium',
    'style',
    'render_style',
    'artist_style',
    'director_style',
    'realism_level',
    'surrealism_level',
    'mood_atmosphere'
  ],
  scene: [
    'environment',
    'background_setting',
    'environment_density',
    'time_of_day',
    'season',
    'weather'
  ],
  cameraLight: [
    'shot_size',
    'camera_angle',
    'composition',
    'lens_focal_length',
    'depth_of_field',
    'lighting_quality',
    'lighting_direction',
    'lighting_contrast',
    'lighting_color',
    'aspect_ratio'
  ],
  finish: [
    'color_palette',
    'accent_color',
    'color_grading',
    'material_texture',
    'detail_level',
    'output_quality',
    'seed'
  ]
};

const checkboxTabs = {
  all: null,
  subject: [
    'Subject Details',
    'Wardrobe & Props'
  ],
  style: [
    'Texture & Material Details'
  ],
  scene: [
    'Environment Details',
    'Atmosphere & Motion'
  ],
  cameraLight: [
    'Composition Aids',
    'Lighting Effects',
    'Lens & Camera Overlays'
  ],
  finish: [
    'Post-Processing',
    'Negative Constraints'
  ]
};

if (fieldTabs[activeFieldTab] === undefined) {
  activeFieldTab = 'all';
  localStorage.setItem('activeFieldTab', activeFieldTab);
}

const checkboxButtonLabels = {
  "Subject Details": "👤 Subject Details",
  "Wardrobe & Props": "🧥 Wardrobe & Props",
  "Environment Details": "🏙 Environment Details",
  "Composition Aids": "📐 Composition Aids",
  "Lighting Effects": "💡 Lighting Effects",
  "Atmosphere & Motion": "🌫 Atmosphere & Motion",
  "Lens & Camera Overlays": "📷 Lens & Camera Overlays",
  "Texture & Material Details": "🧱 Texture & Material Details",
  "Post-Processing": "🎞 Post-Processing",
  "Negative Constraints": "🚫 Negative Constraints"
  // New entries will default to plain group name
};

const presetModes = {
  photoreal: {
    tab: 'cameraLight',
    fields: {
      prompt_intent: 'final artwork',
      image_medium: 'photograph',
      style: 'cinematic realism',
      render_style: 'photorealistic',
      realism_level: 'photorealistic',
      shot_size: 'medium shot',
      camera_angle: 'eye-level',
      lens_focal_length: '50mm natural perspective',
      depth_of_field: 'shallow depth of field',
      lighting_quality: 'natural daylight',
      lighting_contrast: 'balanced contrast',
      color_grading: 'film emulation',
      detail_level: 'high detail',
      output_quality: 'high resolution',
      aspect_ratio: '3:2'
    },
    checkboxes: {
      'Lens & Camera Overlays': ['film grain', 'halation'],
      'Post-Processing': ['cinematic sharpening', 'subtle film grain'],
      'Negative Constraints': ['text', 'watermark', 'low resolution']
    }
  },
  cinematic: {
    tab: 'cameraLight',
    fields: {
      prompt_intent: 'cinematic frame',
      image_medium: 'photograph',
      style: 'cinematic realism',
      render_style: 'stylized realism',
      shot_size: 'wide shot',
      camera_angle: 'low angle',
      composition: 'strong leading lines',
      lens_focal_length: '35mm documentary',
      depth_of_field: 'medium depth of field',
      lighting_quality: 'cinematic key light',
      lighting_direction: 'three-quarter lighting',
      lighting_contrast: 'high contrast',
      color_grading: 'cinematic teal and orange',
      mood_atmosphere: 'mysterious',
      output_quality: 'production concept art',
      aspect_ratio: '16:9'
    },
    checkboxes: {
      'Composition Aids': ['leading lines', 'depth layering'],
      'Lighting Effects': ['soft rim light', 'ambient bloom'],
      'Post-Processing': ['tone curve', 'cinematic sharpening']
    }
  },
  character: {
    tab: 'subject',
    fields: {
      prompt_intent: 'character design sheet',
      subject_type: 'single person',
      subject_action: 'standing still',
      pose_body_language: 'confident',
      facial_expression: 'neutral',
      image_medium: 'digital illustration',
      render_style: 'stylized realism',
      shot_size: 'full body',
      camera_angle: 'eye-level',
      background_setting: 'plain seamless background',
      lighting_quality: 'soft studio light',
      detail_level: 'high detail',
      aspect_ratio: '2:3'
    },
    checkboxes: {
      'Subject Details': ['clear subject silhouette', 'expressive eyes', 'visible hands'],
      'Wardrobe & Props': ['layered clothing', 'boots'],
      'Negative Constraints': ['extra fingers', 'extra limbs', 'bad anatomy']
    }
  },
  environment: {
    tab: 'scene',
    fields: {
      prompt_intent: 'environment design',
      subject_type: 'landscape',
      image_medium: 'digital illustration',
      style: 'fantasy',
      render_style: 'painterly',
      environment: 'surreal dreamscape',
      background_setting: 'natural landscape',
      environment_density: 'richly detailed',
      time_of_day: 'golden hour',
      weather: 'clear',
      shot_size: 'establishing shot',
      camera_angle: 'eye-level',
      lens_focal_length: '24mm wide',
      depth_of_field: 'deep focus',
      lighting_quality: 'natural daylight',
      detail_level: 'intricate detail',
      aspect_ratio: '16:9'
    },
    checkboxes: {
      'Environment Details': ['foreground plants', 'distant skyline', 'visible horizon line'],
      'Composition Aids': ['leading lines', 'layered foreground and background'],
      'Atmosphere & Motion': ['floating dust motes']
    }
  },
  product: {
    tab: 'subject',
    fields: {
      prompt_intent: 'product mockup',
      subject_type: 'object still life',
      subject_action: 'standing still',
      image_medium: 'photograph',
      render_style: 'photorealistic',
      background_setting: 'plain seamless background',
      environment_density: 'minimal',
      shot_size: 'close-up',
      camera_angle: 'eye-level',
      lens_focal_length: '85mm portrait',
      depth_of_field: 'shallow depth of field',
      lighting_quality: 'soft studio light',
      lighting_contrast: 'soft contrast',
      material_texture: 'glossy',
      detail_level: 'high detail',
      output_quality: 'commercial campaign quality',
      aspect_ratio: '4:5'
    },
    checkboxes: {
      'Lighting Effects': ['specular highlights', 'soft rim light'],
      'Texture & Material Details': ['transparent glass', 'wet reflections'],
      'Negative Constraints': ['text', 'watermark', 'blurry subject']
    }
  },
  logo: {
    tab: 'style',
    fields: {
      prompt_intent: 'final artwork',
      subject_type: 'logo or emblem',
      image_medium: 'vector art',
      style: 'minimalist surrealism',
      render_style: 'flat graphic',
      background_setting: 'plain seamless background',
      environment_density: 'minimal',
      composition: 'centered composition',
      lighting_quality: 'flat illustration lighting',
      color_palette: 'limited two-color palette',
      detail_level: 'intentionally simplified',
      realism_level: 'symbolic',
      output_quality: 'clean final image',
      aspect_ratio: '1:1'
    },
    checkboxes: {
      'Composition Aids': ['center frame', 'strong silhouette'],
      'Post-Processing': ['clean vector polish'],
      'Negative Constraints': ['watermark', 'blurry subject', 'muddy colors']
    }
  },
  illustration: {
    tab: 'style',
    fields: {
      prompt_intent: 'editorial illustration',
      image_medium: 'digital illustration',
      style: 'storybook surrealism',
      render_style: 'painterly',
      realism_level: 'stylized',
      surrealism_level: 'subtle surrealism',
      color_palette: 'pastel palette',
      lighting_quality: 'flat illustration lighting',
      material_texture: 'paper grain',
      detail_level: 'clean detail',
      output_quality: 'gallery quality',
      aspect_ratio: '4:5'
    },
    checkboxes: {
      'Texture & Material Details': ['paper grain', 'brush strokes'],
      'Lighting Effects': ['soft rim light'],
      'Post-Processing': ['soft bloom', 'tone curve']
    }
  }
};

function isEmptyChoice(value) {
  return !value || ['null', 'none', 'n/a'].includes(String(value).trim().toLowerCase());
}

function normalizeOptionList(options) {
  const seen = new Set();
  return options.filter(option => {
    const normalized = String(option).trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function isDropdownLocked(key) {
  return !!lockedDropdowns[key];
}

function isCheckboxGroupLocked(key) {
  return !!lockedCheckboxGroups[key];
}

function persistRandomizerLocks() {
  localStorage.setItem('lockedDropdowns', JSON.stringify(lockedDropdowns));
  localStorage.setItem('lockedCheckboxGroups', JSON.stringify(lockedCheckboxGroups));
}

function toggleDropdownLock(key) {
  lockedDropdowns[key] = !lockedDropdowns[key];
  if (!lockedDropdowns[key]) delete lockedDropdowns[key];
  persistRandomizerLocks();
  renderFields();
}

function toggleCheckboxGroupLock(key) {
  lockedCheckboxGroups[key] = !lockedCheckboxGroups[key];
  if (!lockedCheckboxGroups[key]) delete lockedCheckboxGroups[key];
  persistRandomizerLocks();
  renderButtonBar();
}

function unlockAllRandomizerLocks() {
  lockedDropdowns = {};
  lockedCheckboxGroups = {};
  persistRandomizerLocks();
  renderFields();
  renderButtonBar();
}

function captureDropdownSelections() {
  const selections = {};
  for (const key in dropdownOptions) {
    const el = document.getElementById(key);
    if (el) selections[key] = el.value;
  }
  return selections;
}

function getDropdownValue(key) {
  const el = document.getElementById(key);
  return el ? el.value : selectedDropdowns[key];
}

function updateSelectedDropdown(key, value) {
  selectedDropdowns[key] = value;
  localStorage.setItem('selectedDropdowns', JSON.stringify(selectedDropdowns));
  updatePreview();
}

function setDropdownValue(key, value, { onlyEmpty = true } = {}) {
  if (!dropdownOptions[key] || isEmptyChoice(value)) return false;
  if (onlyEmpty && !isEmptyChoice(getDropdownValue(key))) return false;

  if (!dropdownOptions[key].includes(value)) {
    dropdownOptions[key].push(value);
  }

  selectedDropdowns[key] = value;
  const select = document.getElementById(key);
  if (select) {
    ensureSelectOption(key, value);
    select.value = value;
  }
  return true;
}

function addCheckboxValues(category, values, { onlyEmpty = true } = {}) {
  if (!checkboxCategories[category] || !Array.isArray(values)) return false;
  if (onlyEmpty && getSelectedValues(category).length) return false;

  const existing = selectedCheckboxes[category] || [];
  const next = [...existing];

  values.forEach(value => {
    if (!checkboxCategories[category].includes(value)) {
      checkboxCategories[category].push(value);
    }
    if (!next.includes(value)) next.push(value);
  });

  if (!next.length) return false;
  selectedCheckboxes[category] = next;
  return true;
}

async function applyPresetMode() {
  const select = document.getElementById('presetMode');
  const preset = presetModes[select?.value];
  if (!preset) {
    alert('Choose a preset mode first.');
    return;
  }

  let changedFields = 0;
  let changedGroups = 0;
  let dropdownsChanged = false;
  let checkboxesChanged = false;

  Object.entries(preset.fields || {}).forEach(([key, value]) => {
    const before = dropdownOptions[key]?.length || 0;
    if (setDropdownValue(key, value, { onlyEmpty: true })) changedFields += 1;
    if ((dropdownOptions[key]?.length || 0) !== before) dropdownsChanged = true;
  });

  Object.entries(preset.checkboxes || {}).forEach(([category, values]) => {
    const before = checkboxCategories[category]?.length || 0;
    if (addCheckboxValues(category, values, { onlyEmpty: true })) changedGroups += 1;
    if ((checkboxCategories[category]?.length || 0) !== before) checkboxesChanged = true;
  });

  localStorage.setItem('selectedDropdowns', JSON.stringify(selectedDropdowns));
  localStorage.setItem('selectedCheckboxes', JSON.stringify(selectedCheckboxes));

  if (dropdownsChanged) await window.electronAPI.saveDropdowns(dropdownOptions);
  if (checkboxesChanged) await window.electronAPI.saveCheckboxes(checkboxCategories);

  if (preset.tab) setFieldTab(preset.tab);
  renderFields();
  renderButtonBar();
  updatePreview();

  alert(`Applied preset to ${changedFields} fields and ${changedGroups} groups.`);
}

function getVisibleDropdownKeys() {
  const orderedKeys = dropdownOrder.length ? dropdownOrder : Object.keys(dropdownOptions);
  if (activeFieldSearch) {
    return orderedKeys.filter(key => dropdownMatchesSearch(key, activeFieldSearch));
  }

  const tabKeys = fieldTabs[activeFieldTab];
  if (!tabKeys) return orderedKeys;
  const allowed = new Set(tabKeys);
  return orderedKeys.filter(key => allowed.has(key));
}

function getVisibleCheckboxCategoryKeys() {
  const keys = Object.keys(checkboxCategories);
  if (activeFieldSearch) {
    return keys.filter(key => checkboxCategoryMatchesSearch(key, activeFieldSearch));
  }

  const tabKeys = checkboxTabs[activeFieldTab];
  if (!tabKeys) return keys;
  const allowed = new Set(tabKeys);
  return keys.filter(key => allowed.has(key));
}

function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/_/g, ' ');
}

function dropdownMatchesSearch(key, searchTerm) {
  const haystack = [
    key,
    key.replace(/_/g, ' '),
    selectedDropdowns[key],
    ...(dropdownOptions[key] || [])
  ].map(normalizeSearchText).join(' ');
  return haystack.includes(searchTerm);
}

function checkboxCategoryMatchesSearch(key, searchTerm) {
  const haystack = [
    key,
    ...(selectedCheckboxes[key] || []),
    ...(checkboxCategories[key] || [])
  ].map(normalizeSearchText).join(' ');
  return haystack.includes(searchTerm);
}

function setFieldSearch(value) {
  activeFieldSearch = normalizeSearchText(value).trim();
  renderFields();
  renderButtonBar();
}

function clearFieldSearch() {
  const input = document.getElementById('fieldSearch');
  if (input) input.value = '';
  setFieldSearch('');
}

function setFieldTab(tab) {
  activeFieldTab = fieldTabs[tab] === undefined ? 'all' : tab;
  localStorage.setItem('activeFieldTab', activeFieldTab);
  renderFieldTabs();
  renderFields();
  renderButtonBar();
}

function renderFieldTabs() {
  document.querySelectorAll('.field-tab').forEach(button => {
    button.classList.toggle('active', button.dataset.fieldTab === activeFieldTab);
  });
}

function getStoredJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

// Force all modals hidden immediately (before anything renders)
window.addEventListener('load', () => {
  document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
});


// ✅ Only use DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  const preamble = document.getElementById('preamble');
  if (preamble) preamble.addEventListener('input', updatePreview);

  const previewFormat = document.getElementById('previewFormat');
  if (previewFormat) previewFormat.addEventListener('change', updatePreview);

  const fieldSearch = document.getElementById('fieldSearch');
  if (fieldSearch) fieldSearch.addEventListener('input', () => setFieldSearch(fieldSearch.value));

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

// 🧠 Full sync: add new keys, remove stale ones
const persistedOrder = await window.electronAPI.readDropdownOrder();
const storedOrder = Array.isArray(persistedOrder) && persistedOrder.length
  ? persistedOrder
  : getStoredJson('dropdownOrder', []);
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

    renderFieldTabs();
    renderFields();
    renderButtonBar();  
    populateLoadProfileSubmenu();
    updatePreview();

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
  "seed"
];


function renderFields() {
  console.log("✅ renderFields() triggered"); 
  const container = document.getElementById('mainFields');
  const currentSelections = captureDropdownSelections();
  selectedDropdowns = { ...selectedDropdowns, ...currentSelections };
  container.innerHTML = '';

  // 🔽 Dropdowns
  const visibleKeys = getVisibleDropdownKeys();
  if (!visibleKeys.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-search-results';
    empty.textContent = activeFieldSearch
      ? 'No fields matched your search.'
      : 'No fields in this tab yet.';
    container.appendChild(empty);
    return;
  }

  for (const key of visibleKeys) {

    const row = document.createElement('div');
    row.className = 'field-row';
    if (isDropdownLocked(key)) row.classList.add('is-locked');

    const label = document.createElement('label');
    label.textContent = key.replace(/_/g, ' ');

    const select = document.createElement('select');
    select.id = key;
    dropdownOptions[key].forEach(option => {
      const opt = document.createElement('option');
      opt.value = opt.textContent = option;
      select.appendChild(opt);
    });
    const currentValue = selectedDropdowns[key];
    if (currentValue && dropdownOptions[key].includes(currentValue)) {
      select.value = currentValue;
    }
    select.addEventListener('change', () => updateSelectedDropdown(key, select.value));

    const manageBtn = document.createElement('button');
    manageBtn.textContent = '✏️';
    manageBtn.style.marginLeft = '6px';
    manageBtn.onclick = () => openEditDropdownModal(key);

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lock-toggle';
    lockBtn.type = 'button';
    lockBtn.textContent = isDropdownLocked(key) ? '🔒' : '🔓';
    lockBtn.title = isDropdownLocked(key)
      ? `Unlock ${key.replace(/_/g, ' ')} for randomize`
      : `Lock ${key.replace(/_/g, ' ')} during randomize`;
    lockBtn.setAttribute('aria-label', lockBtn.title);
    lockBtn.onclick = () => toggleDropdownLock(key);

    row.appendChild(label);
    row.appendChild(select);
    row.appendChild(lockBtn);
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

  const visibleKeys = getVisibleCheckboxCategoryKeys();
  if (!visibleKeys.length && activeFieldSearch) {
    const empty = document.createElement('div');
    empty.className = 'empty-search-results compact';
    empty.textContent = 'No matching groups.';
    buttonBar.appendChild(empty);
    return;
  }

  visibleKeys.forEach(key => {
    const group = document.createElement('div');
    group.className = 'button-lock-group';
    if (isCheckboxGroupLocked(key)) group.classList.add('is-locked');

    const btn = document.createElement('button');
    btn.textContent = getButtonLabel(key);
    btn.onclick = () => openDialog(key);

    const lockBtn = document.createElement('button');
    lockBtn.className = 'lock-toggle';
    lockBtn.type = 'button';
    lockBtn.textContent = isCheckboxGroupLocked(key) ? '🔒' : '🔓';
    lockBtn.title = isCheckboxGroupLocked(key)
      ? `Unlock ${key} for randomize`
      : `Lock ${key} during randomize`;
    lockBtn.setAttribute('aria-label', lockBtn.title);
    lockBtn.onclick = () => toggleCheckboxGroupLock(key);

    group.appendChild(btn);
    group.appendChild(lockBtn);
    buttonBar.appendChild(group);
  });
}

function getButtonLabel(key) {
  const emojiMap = {
    "Subject Details": "👤",
    "Wardrobe & Props": "🧥",
    "Environment Details": "🏙",
    "Composition Aids": "📐",
    "Lighting Effects": "💡",
    "Atmosphere & Motion": "🌫",
    "Lens & Camera Overlays": "📷",
    "Texture & Material Details": "🧱",
    "Post-Processing": "🎞",
    "Negative Constraints": "🚫"
  };
  return checkboxButtonLabels[key] || `${emojiMap[key] || '+'} ${key}`.trim();
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
  modal.classList.remove('manage-profiles-modal');
  modal.classList.remove('config-modal');
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
  if (!dropdownOrder.includes(key)) {
    dropdownOrder.push(key);
    localStorage.setItem('dropdownOrder', JSON.stringify(dropdownOrder));
    await window.electronAPI.writeDropdownOrder(dropdownOrder);
  }
  await window.electronAPI.saveDropdowns(dropdownOptions);
  renderFields();
  updatePreview();
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
updatePreview();
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
      updatePreview();
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
    localStorage.setItem('dropdownOrder', JSON.stringify(dropdownOrder));
    await window.electronAPI.writeDropdownOrder(dropdownOrder);
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
  navigator.clipboard.writeText(buildPreviewOutput('json'));
  alert('Copied JSON to clipboard!');
}

function copyMidjourneyPrompt() {
  navigator.clipboard.writeText(buildPreviewOutput('midjourney'));
  alert("MidJourney prompt copied to clipboard!");
}

function copyPreview() {
  const format = document.getElementById('previewFormat')?.value || 'json';
  navigator.clipboard.writeText(buildPreviewOutput(format));
  alert('Preview copied to clipboard!');
}

function buildPromptObject() {
  const obj = {};
  let preamble = document.getElementById('preamble').value.trim();
  const prefix = "Use the following JSON parameters to generate an image of ";
  if (preamble && !preamble.startsWith(prefix)) {
    preamble = prefix + preamble;
  }

  if (preamble) obj.preamble = preamble;

  for (const key in dropdownOptions) {
    const value = getDropdownValue(key);
    if (!isEmptyChoice(value)) obj[key] = value;
  }

  for (const cat in checkboxCategories) {
    const values = getSelectedValues(cat);
    if (values.length) obj[cat] = values.join(', ');
  }

  return obj;
}

function getCleanPreamble() {
  let preamble = document.getElementById('preamble').value.trim();
  const prefix = "Use the following JSON parameters to generate an image of ";
  if (preamble.startsWith(prefix)) {
    preamble = preamble.slice(prefix.length);
  }
  return preamble;
}

function getPromptSections() {
  const sectionDefs = [
    ['Subject', ['subject_type', 'subject_action', 'pose_body_language', 'facial_expression']],
    ['Style', ['prompt_intent', 'image_medium', 'style', 'render_style', 'artist_style', 'director_style']],
    ['Setting', ['environment', 'background_setting', 'environment_density', 'time_of_day', 'season', 'weather']],
    ['Camera', ['shot_size', 'camera_angle', 'composition', 'lens_focal_length', 'depth_of_field']],
    ['Lighting', ['lighting_quality', 'lighting_direction', 'lighting_contrast', 'lighting_color']],
    ['Color', ['color_palette', 'accent_color', 'color_grading']],
    ['Finish', ['material_texture', 'detail_level', 'realism_level', 'surrealism_level', 'mood_atmosphere', 'output_quality']]
  ];

  return sectionDefs
    .map(([label, keys]) => {
      const values = keys
        .map(key => {
          const value = getVal(key);
          return value ? `${key.replace(/_/g, ' ')}: ${value}` : null;
        })
        .filter(Boolean);
      return values.length ? { label, text: values.join('; ') } : null;
    })
    .filter(Boolean);
}

function getCheckboxSections(includeNegative = true) {
  return Object.keys(checkboxCategories)
    .filter(category => includeNegative || category !== 'Negative Constraints')
    .map(category => {
      const values = getSelectedValues(category);
      return values.length ? { label: category, text: values.join(', ') } : null;
    })
    .filter(Boolean);
}

function buildMidjourneyPrompt() {
  // Core structure
  const base = getCleanPreamble();
  const baseDescriptors = [
    getVal('subject_type'),
    getVal('subject_action'),
    getVal('pose_body_language'),
    getVal('facial_expression')
  ].filter(Boolean).join(', ');

  const environment = [
    getVal('environment'),
    getVal('background_setting'),
    getVal('environment_density'),
    getVal('time_of_day'),
    getVal('weather')
  ].filter(Boolean).join(', ');

  const artStyle = [
    getVal('image_medium'),
    getVal('style'),
    getVal('render_style'),
    getVal('artist_style') ? `style of ${getVal('artist_style')}` : null,
    getVal('director_style') ? `directed by ${getVal('director_style')}` : null
  ].filter(Boolean).join(', ');

  const lighting = [
    getVal('lighting_quality'),
    getVal('lighting_direction'),
    getVal('lighting_contrast'),
    getVal('lighting_color') ? `lighting color: ${getVal('lighting_color')}` : null
  ].filter(Boolean).join(', ');

  const color = [
    getVal('color_palette'),
    getVal('color_grading'),
    getVal('accent_color') ? `accent color: ${getVal('accent_color')}` : null
  ].filter(Boolean).join(', ');

  const surface = [
    getVal('material_texture'),
    getVal('detail_level'),
    getVal('realism_level'),
    getVal('surrealism_level')
  ].filter(Boolean).join(', ');

  const camera = [
    getVal('shot_size'),
    getVal('camera_angle'),
    getVal('lens_focal_length'),
    getVal('depth_of_field')
  ].filter(Boolean).join(', ');

  const finish = [
    getVal('mood_atmosphere'),
    getVal('output_quality')
  ].filter(Boolean).join(', ');

  const composition = getSelectedValues('Composition Aids').join(', ');
  const post = getSelectedValues('Post-Processing').join(', ');
  const negative = getSelectedValues('Negative Constraints').join(', ');
  const seed = getVal('seed') || Math.floor(Math.random() * 10000);
  const aspect = getVal('aspect_ratio') || '1:1';

  return [
    base,
    baseDescriptors && `— ${baseDescriptors}`,
    environment && `— ${environment}`,
    artStyle && `— ${artStyle}`,
    lighting && `— ${lighting}`,
    color && `— ${color}`,
    surface && `— ${surface}`,
    camera && `— ${camera}`,
    finish && `— ${finish}`,
    composition && `— ${composition}`,
    post && `— ${post}`,
    negative && `--no ${negative}`,
    `--ar ${aspect}`,
    `--style raw`,
    `--seed ${seed}`,
    `--v 7`
  ].filter(Boolean).join(' ');
}

function buildBriefPrompt() {
  const lines = [];
  const preamble = buildPromptObject().preamble;

  if (preamble) lines.push(preamble);

  getPromptSections().forEach(section => lines.push(`${section.label}: ${section.text}`));
  getCheckboxSections().forEach(section => lines.push(`${section.label}: ${section.text}`));

  return lines.join('\n');
}

function buildOpenAIImagePrompt() {
  const lines = [];
  const preamble = getCleanPreamble();

  lines.push('Create an image using this creative brief.');
  if (preamble) lines.push(`Primary subject: ${preamble}`);

  getPromptSections().forEach(section => lines.push(`${section.label}: ${section.text}`));
  getCheckboxSections(false).forEach(section => lines.push(`${section.label}: ${section.text}`));

  const negative = getSelectedValues('Negative Constraints');
  if (negative.length) {
    lines.push(`Avoid: ${negative.join(', ')}`);
  }

  const aspect = getVal('aspect_ratio');
  if (aspect) lines.push(`Aspect ratio: ${aspect}`);

  return lines.join('\n');
}

function buildSdxlPrompt() {
  const positiveParts = [
    getCleanPreamble(),
    ...getPromptSections().map(section => section.text),
    ...getCheckboxSections(false).map(section => section.text)
  ].filter(Boolean);

  const negative = getSelectedValues('Negative Constraints');
  const seed = getVal('seed');
  const aspect = getVal('aspect_ratio');

  return [
    `Positive prompt:\n${positiveParts.join(', ')}`,
    negative.length ? `Negative prompt:\n${negative.join(', ')}` : null,
    aspect ? `Aspect ratio: ${aspect}` : null,
    seed ? `Seed: ${seed}` : null
  ].filter(Boolean).join('\n\n');
}

function buildAnalyzeTemplate() {
  const instructionLine = "Analyze this image and create a new JSON filling in the key values below.\n\n";
  const obj = {
    preamble: "Create a preamble for this JSON. Once written, wrap it like this: 'Use the following JSON parameters to generate an image of ${preamble}'"
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

  return instructionLine + JSON.stringify(obj, null, 2);
}

function buildPreviewOutput(format) {
  if (format === 'openai') return buildOpenAIImagePrompt();
  if (format === 'midjourney') return buildMidjourneyPrompt();
  if (format === 'sdxl') return buildSdxlPrompt();
  if (format === 'brief') return buildBriefPrompt();
  if (format === 'analyze') return buildAnalyzeTemplate();
  return JSON.stringify(buildPromptObject(), null, 2);
}

function updatePreview() {
  const preview = document.getElementById('livePreview');
  if (!preview) return;

  const format = document.getElementById('previewFormat')?.value || 'json';
  preview.textContent = buildPreviewOutput(format);
  updatePromptHealth();
}

function getPromptHealthWarnings() {
  const warnings = [];
  const preamble = getCleanPreamble();
  const subjectType = getVal('subject_type');
  const imageMedium = getVal('image_medium');
  const renderStyle = getVal('render_style');
  const realismLevel = getVal('realism_level');
  const lightingQuality = getVal('lighting_quality');
  const depthOfField = getVal('depth_of_field');
  const shotSize = getVal('shot_size');
  const colorPalette = getVal('color_palette');
  const negative = getSelectedValues('Negative Constraints');
  const selectedEffects = [
    ...getSelectedValues('Lighting Effects'),
    ...getSelectedValues('Lens & Camera Overlays'),
    ...getSelectedValues('Post-Processing')
  ];

  if (!preamble) {
    warnings.push('Add a preamble so the image has a clear core idea.');
  }

  if (!subjectType && !preamble) {
    warnings.push('Choose a subject type or describe the subject in the preamble.');
  }

  if (imageMedium === 'vector art' && ['photorealistic', 'hyperrealistic'].includes(renderStyle)) {
    warnings.push('Vector art and photorealistic render style may pull in opposite directions.');
  }

  if (renderStyle === 'flat graphic' && ['photorealistic', 'hyperrealistic'].includes(realismLevel)) {
    warnings.push('Flat graphic style usually works better with symbolic or stylized realism.');
  }

  if (subjectType === 'logo or emblem' && negative.includes('logo')) {
    warnings.push('Negative constraints include logo while the subject type is logo or emblem.');
  }

  if (subjectType === 'logo or emblem' && depthOfField && depthOfField !== 'flat 2D focus') {
    warnings.push('Logo prompts usually work best with flat 2D focus.');
  }

  if (subjectType === 'logo or emblem' && !['vector art', 'screen print'].includes(imageMedium || '')) {
    warnings.push('Logo mode tends to work best with vector art or screen print as the medium.');
  }

  if (lightingQuality === 'flat illustration lighting' && ['photograph', '3D render'].includes(imageMedium || '')) {
    warnings.push('Flat illustration lighting may soften the photographic/3D look.');
  }

  if (shotSize === 'macro shot' && subjectType === 'landscape') {
    warnings.push('Macro shot and landscape subject may conflict; consider establishing or wide shot.');
  }

  if (selectedEffects.length > 7) {
    warnings.push('Many effects are selected; the prompt may become visually noisy.');
  }

  if (colorPalette === 'monochrome' && getVal('accent_color')) {
    warnings.push('Monochrome palette plus accent color can work, but may need a clear preamble.');
  }

  return warnings;
}

function updatePromptHealth() {
  const panel = document.getElementById('promptHealth');
  if (!panel) return;

  const warnings = getPromptHealthWarnings();
  panel.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'prompt-health-title';
  title.textContent = warnings.length ? 'Prompt Health' : 'Prompt Health: Clear';
  panel.appendChild(title);

  if (!warnings.length) {
    const ok = document.createElement('div');
    ok.className = 'prompt-health-ok';
    ok.textContent = 'No obvious conflicts.';
    panel.appendChild(ok);
    return;
  }

  const list = document.createElement('ul');
  warnings.slice(0, 5).forEach(warning => {
    const item = document.createElement('li');
    item.textContent = warning;
    list.appendChild(item);
  });
  panel.appendChild(list);
}

// Helper to safely fetch values
function getVal(key) {
  const value = getDropdownValue(key);
  return !isEmptyChoice(value) ? String(value).trim() : null;
}

function getSelectedValues(category) {
  return (selectedCheckboxes[category] || []).filter(value => !isEmptyChoice(value));
}
    
function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
  const label = document.querySelector('#darkModeToggle span');
  label.textContent = document.body.classList.contains('light-mode') ? 'Dark Mode' : 'Light Mode';
}
   
function copyAnalyzeThis() {
  navigator.clipboard.writeText(buildPreviewOutput('analyze'));
  alert('Analyze THIS template copied to clipboard!');
}


function randomizeFields() {
  for (const key in dropdownOptions) {
    if (isDropdownLocked(key)) continue;

    const el = document.getElementById(key);
    const opts = dropdownOptions[key];
    if (opts.length) {
      const usableOptions = opts.filter(option => !isEmptyChoice(option));
      const pool = usableOptions.length ? usableOptions : opts;
      const random = pool[Math.floor(Math.random() * pool.length)];
      selectedDropdowns[key] = random;
      if (el) el.value = random;
    }
  }

  randomizedCheckboxes = {};
  const nextSelectedCheckboxes = {};
  for (const cat in checkboxCategories) {
    if (isCheckboxGroupLocked(cat)) {
      const existingValues = selectedCheckboxes[cat] || [];
      if (existingValues.length) {
        nextSelectedCheckboxes[cat] = existingValues;
      }
    }
  }

  for (const cat in checkboxCategories) {
    if (isCheckboxGroupLocked(cat)) continue;

    const values = checkboxCategories[cat];
    if (values.length) {
      const usableValues = values.filter(value => !isEmptyChoice(value));
      if (!usableValues.length) continue;
      const chosen = usableValues[Math.floor(Math.random() * usableValues.length)];
      randomizedCheckboxes[cat] = [chosen];
      nextSelectedCheckboxes[cat] = [chosen];
    }
  }

  selectedCheckboxes = nextSelectedCheckboxes;
  localStorage.setItem('selectedDropdowns', JSON.stringify(selectedDropdowns));
  localStorage.setItem('selectedCheckboxes', JSON.stringify(selectedCheckboxes));
  updatePreview();
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
  updatePreview();
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
  selectedDropdowns = {};
  localStorage.setItem('selectedDropdowns', JSON.stringify(selectedDropdowns));

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
  updatePreview();

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
let favoriteProfiles = getStoredJson('favoriteProfiles', {});

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

  loadProfile(folder ? `${folder}/${profile}` : profile)
    .then(() => {
      console.log("✅ Loaded profile:", selectedManageProfile);
      closeManageProfileModal();
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
    const fullProfileName = folderPath ? `${folderPath}/${profileName}` : profileName;
    const data = await window.electronAPI.loadProfile(fullProfileName);

    if (data.preamble) {
      let cleanPreamble = data.preamble.trim();
      const prefix = "Use the following JSON parameters to generate an image of ";
      if (cleanPreamble.startsWith(prefix)) {
        cleanPreamble = cleanPreamble.slice(prefix.length);
      }
      document.getElementById('preamble').value = cleanPreamble;
    }

    // Handle dropdowns
    const dropdowns = mapLegacyDropdownSelections(data.dropdownSelections || data);
    let dropdownsChanged = false;
    selectedDropdowns = {};
    for (const key in dropdownOptions) {
      if (!isEmptyChoice(dropdowns[key])) {
        if (!dropdownOptions[key].includes(dropdowns[key])) {
          dropdownOptions[key].push(dropdowns[key]);
          dropdownsChanged = true;
        }
        ensureSelectOption(key, dropdowns[key]);
        selectedDropdowns[key] = dropdowns[key];
        const select = document.getElementById(key);
        if (select) select.value = dropdowns[key];
      }
    }

    if (dropdownsChanged) {
      await window.electronAPI.saveDropdowns(dropdownOptions);
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
    localStorage.setItem('selectedDropdowns', JSON.stringify(selectedDropdowns));
    currentProfileName = fullProfileName;
    updateProfileLabel();  
    updatePreview();
    alert(`Profile "${profileName}" loaded.`);
  } catch (err) {
    console.error('Failed to load profile:', err);
    alert('Could not load profile.');
  }
}

function ensureSelectOption(key, value) {
  const select = document.getElementById(key);
  if (!select || isEmptyChoice(value)) return;

  const exists = Array.from(select.options).some(option => option.value === value);
  if (!exists) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function mapLegacyDropdownSelections(dropdowns) {
  const mapped = { ...dropdowns };
  const legacyMap = {
    character_substrate_base: 'render_style',
    character_substrate_coating: 'material_texture',
    environmental_density: 'environment_density',
    body_language: 'pose_body_language',
    color_scheme_primary: 'color_palette',
    color_scheme_secondary: 'accent_color',
    color_scheme_highlights: 'accent_color',
    color_scheme_rim_light: 'lighting_color',
    background_color: 'background_setting',
    background_texture: 'background_setting',
    camera_type: 'lens_focal_length',
    focal_length: 'lens_focal_length',
    lighting_type: 'lighting_quality',
    lighting_temperature: 'lighting_color',
    lighting_intensity: 'lighting_contrast',
    lighting_accent_colors: 'lighting_color',
    level_of_detail: 'detail_level',
    color_grading_style: 'color_grading',
    surface_texture: 'material_texture',
    surreal_element_ratio: 'surrealism_level',
    image_medium: 'image_medium'
  };

  Object.entries(legacyMap).forEach(([oldKey, newKey]) => {
    if (!isEmptyChoice(mapped[oldKey]) && isEmptyChoice(mapped[newKey])) {
      mapped[newKey] = mapped[oldKey];
    }
  });

  return mapped;
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
    const value = getDropdownValue(key);
    if (!isEmptyChoice(value)) {
      profileData.dropdownSelections[key] = value;
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
        if (!isEmptyChoice(val) && !dropdownOptions[key].includes(val)) {
          dropdownOptions[key] = normalizeOptionList([...dropdownOptions[key], val]);
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
          if (!isEmptyChoice(v) && !checkboxCategories[key].includes(v)) {
            checkboxCategories[key] = normalizeOptionList([...checkboxCategories[key], v]);
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
      if (!isEmptyChoice(data[key])) profileData.dropdownSelections[key] = data[key];
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
    updatePreview();
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
      updatePreview();
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
window.copyPreview = copyPreview;
window.randomizeFields = randomizeFields;
window.applyPresetMode = applyPresetMode;
window.clearFieldSearch = clearFieldSearch;
window.setFieldTab = setFieldTab;
window.unlockAllRandomizerLocks = unlockAllRandomizerLocks;
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
