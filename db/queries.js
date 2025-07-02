const prisma = require("./prisma");

async function createUser(username, password) {
    try {
        await prisma.user.create({
            data: {
                username,
                password,
            },
        });
    } catch (error) {
        throw error;
    }
}

module.exports = { createUser };
