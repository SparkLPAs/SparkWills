// Seeds a joint-tenants project so the severance sub-flow can be tested.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({
  where: { email: "jason@example.com" },
});
if (!user) {
  console.error("Register jason@example.com first.");
  process.exit(1);
}

const data = {
  coupleType: "married",
  person1: {
    fullName: "Alan Peter Hughes",
    dateOfBirth: "1955-01-10",
    address: "3 Maple Close, Cardiff, CF1 4XY",
    occupation: "Retired",
  },
  person2: {
    fullName: "Carol Anne Hughes",
    dateOfBirth: "1957-05-22",
    address: "3 Maple Close, Cardiff, CF1 4XY",
    occupation: "Retired",
  },
  property: {
    address: "3 Maple Close, Cardiff, CF1 4XY",
    titleNumber: "WA987654",
    estimatedValue: "£300,000",
    ownershipType: "joint_tenants",
    person1SharePct: 50,
    person2SharePct: 50,
  },
  severanceConfirmed: false,
  executorsP1: [],
  executorsP2: [],
  trusteeAppointment: "executors_serve",
  trusteesP1: [],
  trusteesP2: [],
  trustConfig: {
    terminateOnRemarriage: false,
    terminateOnCare: false,
    lifeInterestScope: "property_only",
    vestingAge: 18,
  },
  beneficiaries: [],
  bequests: [],
  hasMinorChildren: false,
  guardians: [],
  funeralWishesP1: "",
  funeralWishesP2: "",
  accuracyConfirmed: false,
};

const project = await prisma.willProject.create({
  data: {
    userId: user.id,
    title: "Hughes — Protective Property Trust Wills",
    status: "draft",
    coupleType: "married",
    ownershipType: "joint_tenants",
    severanceRequired: true,
    severanceConfirmed: false,
    lastCompletedStep: 2,
    data,
  },
});

console.log("Seeded JT project:", project.id);
await prisma.$disconnect();
