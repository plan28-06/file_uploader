import { prisma } from "./prisma";

async function createUser(username, password) {
    await prisma.user.create({
        data: {
            username,
            password,
        },
    });
}

module.exports = { createUser };
