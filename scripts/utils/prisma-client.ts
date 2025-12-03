import { PrismaClient } from "@prisma/client"
import * as dotenv from "dotenv"

// Load environment variables for standalone script execution
dotenv.config()

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect()
})
