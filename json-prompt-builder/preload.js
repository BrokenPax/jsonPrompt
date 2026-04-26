// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProfileList: () => ipcRenderer.invoke('get-profile-list'),
  loadProfile: (name) => ipcRenderer.invoke('load-profile', name),
  saveProfile: (name, data) => ipcRenderer.invoke('save-profile', name, data),

  // NEW: Dropdowns and Checkboxes
  readDropdowns: () => ipcRenderer.invoke('read-dropdowns'),
  saveDropdowns: (data) => ipcRenderer.invoke('save-dropdowns', data),
  readCheckboxes: () => ipcRenderer.invoke('read-checkboxes'),
  saveCheckboxes: (data) => ipcRenderer.invoke('save-checkboxes', data),

  // ✅ Expose structured profile listing
  getProfileStructure: () => ipcRenderer.invoke('getProfileStructure'),

  // ✅ Profile file operations
  deleteProfile: (path) => ipcRenderer.invoke('delete-profile', path),
  renameProfile: (folder, oldName, newName) => ipcRenderer.invoke('rename-profile', folder, oldName, newName),

  // ✅ Reorder Dropdowns
  saveDropdownOrder: (order) => ipcRenderer.invoke('save-dropdown-order', order),
  readDropdownOrder: () => ipcRenderer.invoke('read-dropdown-order'),
  writeDropdownOrder: (data) => ipcRenderer.invoke('write-dropdown-order', data),

});