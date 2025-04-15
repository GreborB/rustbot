export async function login(username, password) {
    const response = await fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
}
