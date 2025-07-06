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

async function deleteFolderRecursive(userId, folderId) {
    try {
        // First verify the folder belongs to the user
        const folder = await prisma.node.findFirst({
            where: {
                id: folderId,
                userId: userId,
                isFolder: true,
            },
        });
        if (!folder) {
            throw new Error("Folder not found or doesn't belong to user");
        }
        // Find all child nodes of this folder
        const children = await prisma.node.findMany({
            where: {
                parentId: folderId,
                userId: userId,
            },
        });
        // Recursively delete children
        for (const child of children) {
            if (child.isFolder) {
                await deleteFolderRecursive(userId, child.id);
            } else {
                await prisma.node.delete({
                    where: {
                        id: child.id,
                    },
                });
            }
        }
        // Delete the folder itself
        await prisma.node.delete({
            where: {
                id: folderId,
            },
        });
    } catch (error) {
        console.error("Error in deleteFolderRecursive:", error);
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

module.exports = {
    createUser,
    getFolderContents,
    createFolder,
    deleteFolderRecursive,
};
