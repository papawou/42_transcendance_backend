import prisma from "./prismaClient"

export const populateUsers = async () => {	

	const users = await prisma.user.findMany();
	if (users.length > 0) {
		return;
	}
	for (let i = 0; i < 5; i++) {
		await prisma.user.create({
			data: {
				name: `Randôm-${i}`
			},
		})
	}
}

const populate = async () => {
	console.log("POPULATE DATABASE")
	await populateUsers();
}

export default populate;