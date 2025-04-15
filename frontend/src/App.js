import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './pages/Dashboard';

function App() {
    const [token, setToken] = useState(null);

    const handleLogin = (token) => {
        setToken(token);
    };

    if (token) {
        return <Dashboard />;
    } else {
        return <LoginForm onLogin={handleLogin} />;
    }
}

export default App;
