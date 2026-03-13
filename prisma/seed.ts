import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import taxonomyData from '../lib/taxonomy-data.json'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter } as any)

async function seedTaxonomy() {
  // TODO: Add IndustryTaxonomy model to schema.prisma before enabling actual upserts.
  // The model should include fields for: id, industry, subsectors (Json), functions (Json),
  // companyStages (Json), seniorityLevels (Json), signalFamilies (Json), marketTemplates (Json).
  //
  // When the model exists, replace the console.log calls below with actual prisma upserts, e.g.:
  //   await prisma.industryTaxonomy.upsert({
  //     where: { industry: industryName },
  //     update: { subsectors: taxonomyData.subsectors[industryName] ?? [] },
  //     create: { industry: industryName, subsectors: taxonomyData.subsectors[industryName] ?? [] },
  //   })

  console.log('Seeding taxonomy data...')
  console.log(`Would seed ${taxonomyData.industries.length} industries`)
  console.log(`Would seed ${Object.keys(taxonomyData.subsectors).length} subsector groups`)
  console.log(`Would seed ${taxonomyData.marketTemplates.length} market templates`)
}

async function main() {
  console.log('Seeding database...')

  await seedTaxonomy()

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@bdintelligence.ai' },
    update: {},
    create: {
      email: 'demo@bdintelligence.ai',
      name: 'Demo Recruiter',
      password: hashedPassword,
      company: 'Elite Life Sciences Search',
      accountType: 'recruiter',
    },
  })
  console.log('Created demo user:', user.email)

  // Create market profile
  const marketProfile = await prisma.marketProfile.upsert({
    where: { id: 'profile_demo' },
    update: {},
    create: {
      id: 'profile_demo',
      userId: user.id,
      name: 'US Biotech - Clinical Stage',
      geography: ['US - Boston', 'US - San Francisco', 'US - San Diego'],
      sector: 'Biotech',
      subsector: 'Oncology',
      companyStages: ['Series B', 'Series C', 'Growth'],
      functionFocus: ['Clinical Operations', 'Regulatory Affairs', 'Commercial'],
      modalities: ['Small Molecule', 'Biologics'],
      investorFocus: [],
      isDefault: true,
    },
  })
  console.log('Created market profile:', marketProfile.name)

  // Create investors
  const investor1 = await prisma.investor.upsert({
    where: { id: 'inv_1' },
    update: {},
    create: {
      id: 'inv_1',
      name: 'HealthVentures Capital',
      geography: 'Boston, MA',
      stageFocus: ['Series A', 'Series B'],
      sectorFocus: ['Biotech', 'MedTech', 'Diagnostics'],
      website: 'https://healthventures.example.com',
      activitySummary: 'Top-tier life sciences VC with $2B AUM',
      aum: 2000000000,
    },
  })

  const investor2 = await prisma.investor.upsert({
    where: { id: 'inv_2' },
    update: {},
    create: {
      id: 'inv_2',
      name: 'Orbis BioFund',
      geography: 'San Francisco, CA',
      stageFocus: ['Series B', 'Series C', 'Growth'],
      sectorFocus: ['Biotech', 'Genomics', 'Cell Therapy'],
      website: 'https://orbis-bio.example.com',
      activitySummary: 'Specialist biotech fund focused on clinical-stage companies',
      aum: 1200000000,
    },
  })
  console.log('Created investors')

  // Create companies
  const companies = await Promise.all([
    prisma.company.upsert({
      where: { id: 'comp_1' },
      update: {},
      create: {
        id: 'comp_1',
        name: 'BioNova Therapeutics',
        sector: 'Biotech',
        subsector: 'Oncology',
        stage: 'Series C',
        geography: 'Boston, MA',
        website: 'https://bionova.example.com',
        modality: 'Small Molecule',
        lifecycleStage: 'Clinical Stage',
        summary: 'BioNova is developing next-generation targeted therapies for solid tumors with a focus on KRAS-driven cancers.',
        employeeCount: 180,
        fundingTotal: 145000000,
        lastFundingDate: new Date('2025-11-15'),
      },
    }),
    prisma.company.upsert({
      where: { id: 'comp_2' },
      update: {},
      create: {
        id: 'comp_2',
        name: 'DiagnostiX Labs',
        sector: 'Diagnostics',
        subsector: 'Liquid Biopsy',
        stage: 'Series B',
        geography: 'San Francisco, CA',
        website: 'https://diagnostix.example.com',
        modality: 'Molecular Diagnostics',
        lifecycleStage: 'Commercial Stage',
        summary: 'DiagnostiX is commercializing a liquid biopsy platform for early cancer detection.',
        employeeCount: 95,
        fundingTotal: 78000000,
        lastFundingDate: new Date('2025-09-20'),
      },
    }),
    prisma.company.upsert({
      where: { id: 'comp_3' },
      update: {},
      create: {
        id: 'comp_3',
        name: 'ClinPath Solutions',
        sector: 'CRO/CDMO',
        subsector: 'Clinical Research',
        stage: 'Growth',
        geography: 'Raleigh, NC',
        website: 'https://clinpath.example.com',
        modality: 'Services',
        lifecycleStage: 'Commercial Stage',
        summary: 'ClinPath is a specialized CRO focused on oncology and rare disease trials.',
        employeeCount: 450,
        fundingTotal: 220000000,
        lastFundingDate: new Date('2025-07-10'),
      },
    }),
    prisma.company.upsert({
      where: { id: 'comp_4' },
      update: {},
      create: {
        id: 'comp_4',
        name: 'GenVec Bio',
        sector: 'Biotech',
        subsector: 'Gene Therapy',
        stage: 'Series A',
        geography: 'San Diego, CA',
        website: 'https://genvec.example.com',
        modality: 'Gene Therapy',
        lifecycleStage: 'Preclinical',
        summary: 'GenVec Bio is developing AAV-based gene therapies for rare pediatric neurological disorders.',
        employeeCount: 45,
        fundingTotal: 35000000,
        lastFundingDate: new Date('2026-01-05'),
      },
    }),
    prisma.company.upsert({
      where: { id: 'comp_5' },
      update: {},
      create: {
        id: 'comp_5',
        name: 'MedTech Innovations',
        sector: 'MedTech',
        subsector: 'Surgical Robotics',
        stage: 'Pre-IPO',
        geography: 'Chicago, IL',
        website: 'https://medtech-innov.example.com',
        modality: 'Medical Device',
        lifecycleStage: 'Commercial Stage',
        summary: 'MedTech Innovations has developed a next-gen robotic surgery platform for minimally invasive procedures.',
        employeeCount: 620,
        fundingTotal: 380000000,
        lastFundingDate: new Date('2025-06-30'),
      },
    }),
  ])
  console.log('Created companies')

  // Create company-investor relationships
  await prisma.companyInvestor.upsert({
    where: { companyId_investorId: { companyId: 'comp_1', investorId: 'inv_2' } },
    update: {},
    create: {
      companyId: 'comp_1',
      investorId: 'inv_2',
      round: 'Series C',
      amount: 85000000,
      investmentDate: new Date('2025-11-15'),
    },
  })

  await prisma.companyInvestor.upsert({
    where: { companyId_investorId: { companyId: 'comp_4', investorId: 'inv_1' } },
    update: {},
    create: {
      companyId: 'comp_4',
      investorId: 'inv_1',
      round: 'Series A',
      amount: 35000000,
      investmentDate: new Date('2026-01-05'),
    },
  })

  // Create signals
  const signals = await Promise.all([
    prisma.marketSignal.upsert({
      where: { id: 'sig_1' },
      update: {},
      create: {
        id: 'sig_1',
        signalType: 'funding',
        title: 'BioNova Therapeutics Closes $85M Series C Round',
        summary: 'BioNova Therapeutics announced the closing of an $85 million Series C financing led by Orbis BioFund.',
        whyItMatters: 'Series C funding of this size typically signals an 18-24 month runway to key clinical milestones and a significant hiring push.',
        companyId: 'comp_1',
        investorId: 'inv_2',
        sourceName: 'BioSpace',
        publishedAt: new Date('2025-11-15'),
        relevanceScore: 92,
        impactedFunctions: ['Clinical Operations', 'Regulatory Affairs', 'Business Development'],
        tags: ['Series C', 'Oncology', 'KRAS'],
        bdAngle: 'Post-funding hiring surge expected. Target VP Clinical Operations and Chief Medical Officer.',
        geography: 'Boston, MA',
        sector: 'Biotech',
      },
    }),
    prisma.marketSignal.upsert({
      where: { id: 'sig_2' },
      update: {},
      create: {
        id: 'sig_2',
        signalType: 'hiring',
        title: 'DiagnostiX Labs Posts 15+ Senior Positions Including Chief Commercial Officer',
        summary: 'DiagnostiX Labs has posted over 15 new positions on LinkedIn including a Chief Commercial Officer.',
        whyItMatters: 'The hiring of a CCO signals transition from product development to market capture. Prime window for executive search.',
        companyId: 'comp_2',
        sourceName: 'LinkedIn',
        publishedAt: new Date('2026-02-20'),
        relevanceScore: 88,
        impactedFunctions: ['Commercial', 'Sales', 'Market Access'],
        tags: ['Hiring Surge', 'Commercial Build-out', 'Diagnostics'],
        bdAngle: 'Ideal moment to pitch retained executive search for CCO role.',
        geography: 'San Francisco, CA',
        sector: 'Diagnostics',
      },
    }),
    prisma.marketSignal.upsert({
      where: { id: 'sig_3' },
      update: {},
      create: {
        id: 'sig_3',
        signalType: 'leadership',
        title: 'ClinPath Solutions Appoints New CEO from Covance',
        summary: 'ClinPath Solutions announced the appointment of Dr. Sarah Chen as CEO, joining from Covance.',
        whyItMatters: 'New CEO appointments signal organizational transformation. New leaders typically rebuild their executive teams within 90-180 days.',
        companyId: 'comp_3',
        sourceName: 'ClinicalTrials.gov News',
        publishedAt: new Date('2026-01-10'),
        relevanceScore: 85,
        impactedFunctions: ['Executive Leadership', 'Business Development', 'Clinical Operations'],
        tags: ['CEO Appointment', 'Leadership Change', 'CRO'],
        bdAngle: 'Engage Dr. Chen in first 30 days. New CEOs building teams are receptive to executive search partnerships.',
        geography: 'Raleigh, NC',
        sector: 'CRO/CDMO',
      },
    }),
    prisma.marketSignal.upsert({
      where: { id: 'sig_6' },
      update: {},
      create: {
        id: 'sig_6',
        signalType: 'clinical',
        title: 'BioNova Reports Positive Phase 2 Data for KRAS Inhibitor BNV-401',
        summary: 'BioNova announced positive topline data from its Phase 2 study, showing 42% overall response rate.',
        whyItMatters: 'Positive Phase 2 data is a key catalyst for Phase 3 investment. Expect significant expansion of clinical teams.',
        companyId: 'comp_1',
        sourceName: 'ASCO Press Release',
        publishedAt: new Date('2026-03-01'),
        relevanceScore: 94,
        impactedFunctions: ['Clinical Operations', 'Biostatistics', 'Medical Affairs', 'Regulatory'],
        tags: ['Phase 2', 'Positive Data', 'NSCLC', 'KRAS'],
        bdAngle: 'Phase 3 transition creates massive hiring need. Target CSO, CMO, and VP Biostatistics.',
        geography: 'Boston, MA',
        sector: 'Biotech',
      },
    }),
  ])
  console.log('Created signals')

  // Create opportunities
  await Promise.all([
    prisma.opportunity.upsert({
      where: { id: 'opp_1' },
      update: {},
      create: {
        id: 'opp_1',
        companyId: 'comp_1',
        userId: user.id,
        linkedSignals: ['sig_1', 'sig_6'],
        opportunityScore: 94,
        momentumScore: 92,
        timingWindow: 'Act Now (30 days)',
        recommendedStakeholder: 'Chief Scientific Officer',
        likelyHiringNeed: 'VP Clinical Operations, VP Regulatory Affairs, Chief Medical Officer',
        outreachAngle: 'Congratulate on Phase 2 data and position as go-to partner for Phase 3 team build.',
        lifecycleContext: 'BioNova is at a critical inflection point following positive Phase 2 data.',
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp_2' },
      update: {},
      create: {
        id: 'opp_2',
        companyId: 'comp_2',
        userId: user.id,
        linkedSignals: ['sig_2'],
        opportunityScore: 89,
        momentumScore: 86,
        timingWindow: 'Act Now (30 days)',
        recommendedStakeholder: 'CEO / Co-founder',
        likelyHiringNeed: 'Chief Commercial Officer, VP Sales, Director Market Access',
        outreachAngle: 'Position as commercial talent specialists for diagnostics companies.',
        lifecycleContext: 'DiagnostiX is transitioning from R&D to commercial in full build-out mode.',
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp_3' },
      update: {},
      create: {
        id: 'opp_3',
        companyId: 'comp_3',
        userId: user.id,
        linkedSignals: ['sig_3'],
        opportunityScore: 87,
        momentumScore: 84,
        timingWindow: 'Next 60 Days',
        recommendedStakeholder: 'CEO (Dr. Sarah Chen)',
        likelyHiringNeed: 'New C-suite as new CEO rebuilds team: CFO, CBO, CPO',
        outreachAngle: 'Engage new CEO directly. Reference Covance background.',
        lifecycleContext: 'New CEO + major pharma partnership creates a dual hiring catalyst.',
      },
    }),
  ])
  console.log('Created opportunities')

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
