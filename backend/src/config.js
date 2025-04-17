module.exports = {
    web: {
        port: process.env.PORT || 3000
    },
    rust: {
        ip: process.env.RUST_SERVER_IP || '',
        port: process.env.RUST_SERVER_PORT || 28082
    }
}; 