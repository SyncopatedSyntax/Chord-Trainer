import React from 'react'
import ReactDOM from 'react-dom/client'
import Editor from './editor/Editor.jsx'
// Register the service worker here too, so opening /editor.html directly pulls
// new versions (autoUpdate reloads the page when a fresh build is available).
// Without this, the editor relied on the trainer page to refresh the SW cache.
import './pwa.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>,
)
