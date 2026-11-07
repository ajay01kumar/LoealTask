import { PrismaClient, ClaimCategory, ClaimStatus, StudyType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding L\'Oréal R&I Claims Database...');

  // 1. Create a flagship anti-aging product
  const product = await prisma.product.upsert({
    where: { formulaCode: 'LR-PARIS-2026-F98' },
    update: {},
    create: {
      formulaCode: 'LR-PARIS-2026-F98',
      name: 'Revitalift Laser Triple Action Pro Serum',
      brand: "L'Oréal Paris",
    },
  });

  // 2. Create the target claim
  const claim = await prisma.claim.create({
    data: {
      id: 'c4b12345-6789-4abc-9def-0123456789ab',
      productId: product.id,
      claimText: 'Reduces wrinkles by 20% in 4 weeks',
      category: ClaimCategory.ANTI_AGING,
      targetDuration: '4 weeks',
      targetMetric: 'Periorbital wrinkle depth (Rz) reduction >= 20%',
      status: ClaimStatus.PENDING_EVALUATION,
    },
  });

  // 3. Attach clinical evidence from Paris clinical evaluator
  await prisma.clinicalEvidence.create({
    data: {
      claimId: claim.id,
      protocolNumber: 'CLIN-PARIS-2026-042',
      studyType: StudyType.DOUBLE_BLIND_RCT,
      sampleSize: 45,
      duration: '28 days',
      methodology: "Primos 3D optical profilometry on periorbital crow's feet wrinkles",
      findingsText: `Study Protocol: CLIN-PARIS-2026-042
Design: Randomized, double-blind, vehicle-controlled clinical trial on 45 healthy female Caucasian and Asian volunteers (age 45-60).
Treatment: Twice-daily topical application of Formula LR-PARIS-2026-F98 for 28 consecutive days.
Results: Quantitative 3D skin roughness analysis demonstrated a mean reduction in periorbital wrinkle depth (Rz) of 21.4% at Day 28 compared to baseline (p = 0.003, 95% CI [18.2%, 24.6%]).
The vehicle control group showed a non-significant reduction of 3.1% (p = 0.41).
Tolerance: 100% skin tolerance, 0 erythema, 0 study dropouts.`,
      evaluatorName: 'Dr. Sophie Bernard',
      evaluatorRole: 'Lead Clinical Study Evaluator (Paris R&I)',
    },
  });

  console.log(`Database seeded successfully! Product ID: ${product.id}, Claim ID: ${claim.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
