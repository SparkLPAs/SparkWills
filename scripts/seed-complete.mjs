// Seeds one complete mirror-will project for the test user.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const data = {
  willType: "mirror",
  coupleType: "married",
  person1: {
    fullName: "John William Smith",
    dateOfBirth: "1958-04-12",
    address: "14 Elm Avenue, Bristol, BS1 2AB",
    occupation: "Retired teacher",
  },
  person2: {
    fullName: "Margaret Jane Smith",
    dateOfBirth: "1960-09-03",
    address: "14 Elm Avenue, Bristol, BS1 2AB",
    occupation: "Retired nurse",
  },
  executorChoice: "own",
  executorsP1: [
    { fullName: "Margaret Jane Smith", address: "14 Elm Avenue, Bristol, BS1 2AB" },
    { fullName: "Sarah Louise Smith", address: "7 Oak Road, Bath, BA2 3CD" },
  ],
  executorsP2: [
    { fullName: "John William Smith", address: "14 Elm Avenue, Bristol, BS1 2AB" },
    { fullName: "Sarah Louise Smith", address: "7 Oak Road, Bath, BA2 3CD" },
  ],
  hasMinorChildren: false,
  guardians: [],
  bequests: [{ id: "g1", item: "My wedding ring", recipient: "Sarah Louise Smith" }],
  residueToPartner: true,
  survivorshipDays: 30,
  beneficiaries: [
    { id: "b1", fullName: "Sarah Louise Smith", relationship: "daughter", dateOfBirth: "1985-06-20", sharePercentage: 50, substituteFor: "" },
    { id: "b2", fullName: "David John Smith", relationship: "son", dateOfBirth: "1988-11-02", sharePercentage: 50, substituteFor: "" },
  ],
  vestingAge: 18,
  funeralWishesP1: "I should like to be cremated, with a simple service.",
  funeralWishesP2: "",
  accuracyConfirmed: true,
};

const user = await prisma.user.findUnique({ where: { email: "jason@example.com" } });
if (!user) {
  console.error("Register jason@example.com first.");
  process.exit(1);
}

const project = await prisma.willProject.create({
  data: {
    userId: user.id,
    title: "Smith — Mirror Wills",
    status: "draft",
    coupleType: "married",
    lastCompletedStep: 7,
    data,
  },
});

console.log("Seeded project:", project.id);
await prisma.$disconnect();
