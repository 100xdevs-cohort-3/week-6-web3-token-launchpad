import React from 'react';
import './App.css';  // Assuming some styling exists
import { TokenLaunchpadWithPool } from './components/TokenLaunchpadWithPool';  // Import the component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to the Solana Token Launchpad</h1>
      </header>

      <main>
        {/* Render the TokenLaunchpadWithPool component */}
        <TokenLaunchpadWithPool />
      </main>
    </div>
  );
}

export default App;
