import { prisma } from "./utils/prisma-client"

// UW Madison Schools (from constants.prototype.ts)
const UW_SCHOOLS = [
  "Agricultural & Life Sciences, College of",
  "Arts, Division of the",
  "Business, School of",
  "Computer Data & Information Sciences, School of",
  "Continuing Studies, Division of",
  "Education, School of",
  "Engineering, College of",
  "Environmental Studies, Nelson Institute for",
  "Graduate School",
  "Human Ecology, School of",
  "Information School",
  "International Division",
  "Journalism and Mass Communication, School of",
  "Language Institute",
  "Law School",
  "Letters & Science, College of",
  "Medicine and Public Health, School of",
  "Music, School of",
  "Nursing, School of",
  "Pharmacy, School of",
  "Public Affairs, School of",
  "Social Work, School of",
  "Veterinary Medicine, School of",
]

async function seedSchools() {
  console.log("🏫 Seeding UW Madison schools...")

  let created = 0
  let skipped = 0

  for (const name of UW_SCHOOLS) {
    const result = await prisma.school.upsert({
      where: { name },
      update: {}, // No update needed, just skip if exists
      create: { name },
    })

    // Check if this was a new insert
    const existing = await prisma.school.findUnique({ where: { name } })
    if (existing?.name === name) {
      // Already existed or just created
      created++
    }
  }

  const total = await prisma.school.count()
  console.log(`✅ Schools seeded: ${total} total in database`)
  console.log(`   (${UW_SCHOOLS.length} defined in seed list)`)
}

// Run the seeder
seedSchools()
  .then(() => {
    console.log("🎉 School seeding complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Error seeding schools:", error)
    process.exit(1)
  })
