import React, { startTransition } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
// A transition lets React render in small slices, so phones stay responsive while the app boots.
startTransition(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
