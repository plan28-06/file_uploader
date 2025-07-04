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

async function createFolder(parentId, name, isFolder, userId) {
    try {
        await prisma.node.create({
            data: {
                parentId,
                name,
                isFolder,
                userId,
            },
        });
    } catch (error) {
        throw error;
    }
}

async function getFolderContents(userId, pathSegments) {
    const parentId = pathSegments.at(-1) || null;
    try {
        return await prisma.node.findMany({
            where: {
                parentId,
                userId,
            },
        });
    } catch (err) {
        console.error("Error in getFolderContents:", err);
        return [];
    }
}

module.exports = { createUser, getFolderContents, createFolder };
