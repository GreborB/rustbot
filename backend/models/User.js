class User {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    static users = new Map();

    static create(username, password) {
        const user = new User(username, password);
        this.users.set(username, user);
        return user;
    }

    static findByUsername(username) {
        return this.users.get(username);
    }
}

module.exports = User;
