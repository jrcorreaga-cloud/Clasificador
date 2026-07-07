import React from 'react'
import ReactDOM from 'react-dom/client'
import HomeView from './views/HomeView.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HomeView />
    </ErrorBoundary>
  </React.StrictMode>,
)