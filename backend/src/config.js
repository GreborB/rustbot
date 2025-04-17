export default {
    web: {
        port: process.env.PORT || 3001
    },
    rust: {
        ip: process.env.RUST_SERVER_IP || '',
        port: process.env.RUST_SERVER_PORT || 28082
    }
}; 