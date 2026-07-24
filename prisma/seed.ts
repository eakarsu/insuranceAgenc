import { PrismaClient, UserRole, ClientType, ClientStatus, LineOfBusiness, PolicyStatus, QuoteStatus, ClaimStatus, CommissionStatus, CommissionType, CampaignType, CampaignStatus, ActivityType, DocumentType, ContactType, BillingMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function main() {
  console.log('Starting comprehensive seed...');

  // Check if database is already seeded
  const existingClients = await prisma.client.count();
  if (existingClients > 0) {
    console.log(`Database already contains ${existingClients} clients. Skipping seed.`);
    return;
  }

  // ==================== USERS (6) ====================
  const password = await bcrypt.hash(requireDemoPassword(), 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@insureflow.com' },
    update: {},
    create: {
      email: 'admin@insureflow.com',
      password: password,
      name: 'Agency Owner',
      role: UserRole.ADMIN,
      phone: '555-0100',
    },
  });

  const agents = [admin];
  console.log('Created users: 1 (Agency Owner)');

  // ==================== CARRIERS (15) ====================
  const carriersData = [
    { name: 'Safeco Insurance', code: 'SAFECO', phone: '800-555-0001', email: 'agents@safeco.com', website: 'https://www.safeco.com', commissionRates: { PERSONAL_AUTO: 12, HOMEOWNERS: 15, UMBRELLA: 15, RENTERS: 12 } },
    { name: 'Progressive Insurance', code: 'PROGRESSIVE', phone: '800-555-0002', email: 'agents@progressive.com', website: 'https://www.progressive.com', commissionRates: { PERSONAL_AUTO: 10, HOMEOWNERS: 12, COMMERCIAL_AUTO: 12 } },
    { name: 'Travelers Insurance', code: 'TRAVELERS', phone: '800-555-0003', email: 'agents@travelers.com', website: 'https://www.travelers.com', commissionRates: { PERSONAL_AUTO: 11, HOMEOWNERS: 14, COMMERCIAL_PROPERTY: 15, GENERAL_LIABILITY: 15 } },
    { name: 'The Hartford', code: 'HARTFORD', phone: '800-555-0004', email: 'agents@thehartford.com', website: 'https://www.thehartford.com', commissionRates: { COMMERCIAL_AUTO: 14, COMMERCIAL_PROPERTY: 15, WORKERS_COMP: 10, GENERAL_LIABILITY: 15 } },
    { name: 'Nationwide Insurance', code: 'NATIONWIDE', phone: '800-555-0005', email: 'agents@nationwide.com', website: 'https://www.nationwide.com', commissionRates: { PERSONAL_AUTO: 11, HOMEOWNERS: 13, LIFE: 50 } },
    { name: 'State Farm', code: 'STATEFARM', phone: '800-555-0006', email: 'agents@statefarm.com', website: 'https://www.statefarm.com', commissionRates: { PERSONAL_AUTO: 10, HOMEOWNERS: 12, LIFE: 45 } },
    { name: 'Liberty Mutual', code: 'LIBERTY', phone: '800-555-0007', email: 'agents@libertymutual.com', website: 'https://www.libertymutual.com', commissionRates: { PERSONAL_AUTO: 11, HOMEOWNERS: 13, UMBRELLA: 14 } },
    { name: 'Allstate Insurance', code: 'ALLSTATE', phone: '800-555-0008', email: 'agents@allstate.com', website: 'https://www.allstate.com', commissionRates: { PERSONAL_AUTO: 10, HOMEOWNERS: 12, RENTERS: 10 } },
    { name: 'GEICO', code: 'GEICO', phone: '800-555-0009', email: 'agents@geico.com', website: 'https://www.geico.com', commissionRates: { PERSONAL_AUTO: 8, HOMEOWNERS: 10 } },
    { name: 'USAA', code: 'USAA', phone: '800-555-0010', email: 'agents@usaa.com', website: 'https://www.usaa.com', commissionRates: { PERSONAL_AUTO: 9, HOMEOWNERS: 11, LIFE: 40 } },
    { name: 'Chubb Insurance', code: 'CHUBB', phone: '800-555-0011', email: 'agents@chubb.com', website: 'https://www.chubb.com', commissionRates: { HOMEOWNERS: 18, UMBRELLA: 20, CYBER: 15 } },
    { name: 'Cincinnati Insurance', code: 'CINCINNATI', phone: '800-555-0012', email: 'agents@cinfin.com', website: 'https://www.cinfin.com', commissionRates: { COMMERCIAL_PROPERTY: 16, GENERAL_LIABILITY: 16, WORKERS_COMP: 12 } },
    { name: 'Zurich Insurance', code: 'ZURICH', phone: '800-555-0013', email: 'agents@zurich.com', website: 'https://www.zurich.com', commissionRates: { COMMERCIAL_AUTO: 13, PROFESSIONAL_LIABILITY: 15, CYBER: 14 } },
    { name: 'CNA Insurance', code: 'CNA', phone: '800-555-0014', email: 'agents@cna.com', website: 'https://www.cna.com', commissionRates: { GENERAL_LIABILITY: 14, PROFESSIONAL_LIABILITY: 14, WORKERS_COMP: 11 } },
    { name: 'Hanover Insurance', code: 'HANOVER', phone: '800-555-0015', email: 'agents@hanover.com', website: 'https://www.hanover.com', commissionRates: { PERSONAL_AUTO: 12, HOMEOWNERS: 14, COMMERCIAL_PROPERTY: 15 } },
  ];

  const carriers = await Promise.all(
    carriersData.map((c) =>
      prisma.carrier.upsert({
        where: { code: c.code },
        update: {},
        create: c,
      })
    )
  );
  console.log('Created carriers:', carriers.length);

  // ==================== HOUSEHOLDS (15) ====================
  const householdsData = [
    { name: 'Thompson Family', address: '123 Main Street', city: 'Springfield', state: 'IL', zipCode: '62701' },
    { name: 'Garcia Family', address: '456 Oak Avenue', city: 'Chicago', state: 'IL', zipCode: '60601' },
    { name: 'Williams Family', address: '789 Pine Road', city: 'Aurora', state: 'IL', zipCode: '60505' },
    { name: 'Brown Family', address: '321 Elm Street', city: 'Naperville', state: 'IL', zipCode: '60540' },
    { name: 'Davis Family', address: '654 Maple Drive', city: 'Peoria', state: 'IL', zipCode: '61602' },
    { name: 'Miller Family', address: '987 Cedar Lane', city: 'Rockford', state: 'IL', zipCode: '61101' },
    { name: 'Wilson Family', address: '147 Birch Court', city: 'Champaign', state: 'IL', zipCode: '61820' },
    { name: 'Moore Family', address: '258 Walnut Way', city: 'Bloomington', state: 'IL', zipCode: '61701' },
    { name: 'Taylor Family', address: '369 Spruce Street', city: 'Decatur', state: 'IL', zipCode: '62521' },
    { name: 'Anderson Family', address: '741 Ash Avenue', city: 'Joliet', state: 'IL', zipCode: '60431' },
    { name: 'Jackson Family', address: '852 Oak Circle', city: 'Elgin', state: 'IL', zipCode: '60120' },
    { name: 'White Family', address: '963 Hickory Lane', city: 'Waukegan', state: 'IL', zipCode: '60085' },
    { name: 'Harris Family', address: '159 Poplar Place', city: 'Cicero', state: 'IL', zipCode: '60804' },
    { name: 'Martin Family', address: '357 Willow Way', city: 'Evanston', state: 'IL', zipCode: '60201' },
    { name: 'Robinson Family', address: '468 Sycamore Street', city: 'Schaumburg', state: 'IL', zipCode: '60173' },
  ];

  const households = await Promise.all(
    householdsData.map((h) => prisma.household.create({ data: h }))
  );
  console.log('Created households:', households.length);

  // ==================== CLIENTS (20 Personal + 15 Commercial = 35) ====================
  const personalClientsData = [
    { firstName: 'Robert', lastName: 'Thompson', email: 'robert.thompson@email.com', phone: '555-1001', dateOfBirth: new Date('1975-05-15'), city: 'Springfield', state: 'IL', zipCode: '62701', source: 'Referral', tags: ['homeowner', 'multi-policy'] },
    { firstName: 'Linda', lastName: 'Thompson', email: 'linda.thompson@email.com', phone: '555-1002', dateOfBirth: new Date('1978-08-22'), city: 'Springfield', state: 'IL', zipCode: '62701', source: 'Referral', tags: ['homeowner'] },
    { firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@email.com', phone: '555-2001', dateOfBirth: new Date('1982-03-10'), city: 'Chicago', state: 'IL', zipCode: '60601', source: 'Website', tags: ['renter'] },
    { firstName: 'James', lastName: 'Wilson', email: 'james.wilson@email.com', phone: '555-3001', dateOfBirth: new Date('1990-11-28'), city: 'Naperville', state: 'IL', zipCode: '60540', source: 'Cold Call', tags: ['prospect'] },
    { firstName: 'Patricia', lastName: 'Williams', email: 'patricia.williams@email.com', phone: '555-4001', dateOfBirth: new Date('1985-07-03'), city: 'Aurora', state: 'IL', zipCode: '60505', source: 'Social Media', tags: ['homeowner'] },
    { firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@email.com', phone: '555-5001', dateOfBirth: new Date('1970-12-18'), city: 'Naperville', state: 'IL', zipCode: '60540', source: 'Referral', tags: ['VIP', 'multi-policy'] },
    { firstName: 'Jennifer', lastName: 'Davis', email: 'jennifer.davis@email.com', phone: '555-6001', dateOfBirth: new Date('1988-04-25'), city: 'Peoria', state: 'IL', zipCode: '61602', source: 'Website', tags: ['renter', 'young-professional'] },
    { firstName: 'William', lastName: 'Miller', email: 'william.miller@email.com', phone: '555-7001', dateOfBirth: new Date('1965-09-08'), city: 'Rockford', state: 'IL', zipCode: '61101', source: 'Walk-in', tags: ['senior', 'life-insurance'] },
    { firstName: 'Elizabeth', lastName: 'Moore', email: 'elizabeth.moore@email.com', phone: '555-8001', dateOfBirth: new Date('1992-01-14'), city: 'Champaign', state: 'IL', zipCode: '61820', source: 'Advertisement', tags: ['new-driver'] },
    { firstName: 'David', lastName: 'Taylor', email: 'david.taylor@email.com', phone: '555-9001', dateOfBirth: new Date('1980-06-30'), city: 'Bloomington', state: 'IL', zipCode: '61701', source: 'Partner', tags: ['homeowner', 'umbrella'] },
    { firstName: 'Barbara', lastName: 'Anderson', email: 'barbara.anderson@email.com', phone: '555-1010', dateOfBirth: new Date('1973-02-20'), city: 'Decatur', state: 'IL', zipCode: '62521', source: 'Referral', tags: ['multi-policy'] },
    { firstName: 'Richard', lastName: 'Jackson', email: 'richard.jackson@email.com', phone: '555-1011', dateOfBirth: new Date('1968-11-05'), city: 'Joliet', state: 'IL', zipCode: '60431', source: 'Website', tags: ['classic-car'] },
    { firstName: 'Susan', lastName: 'White', email: 'susan.white@email.com', phone: '555-1012', dateOfBirth: new Date('1995-08-17'), city: 'Elgin', state: 'IL', zipCode: '60120', source: 'Social Media', tags: ['first-time-buyer'] },
    { firstName: 'Joseph', lastName: 'Harris', email: 'joseph.harris@email.com', phone: '555-1013', dateOfBirth: new Date('1960-04-12'), city: 'Waukegan', state: 'IL', zipCode: '60085', source: 'Cold Call', tags: ['senior', 'medicare'] },
    { firstName: 'Margaret', lastName: 'Martin', email: 'margaret.martin@email.com', phone: '555-1014', dateOfBirth: new Date('1983-10-29'), city: 'Cicero', state: 'IL', zipCode: '60804', source: 'Referral', tags: ['homeowner'] },
    { firstName: 'Charles', lastName: 'Robinson', email: 'charles.robinson@email.com', phone: '555-1015', dateOfBirth: new Date('1977-03-06'), city: 'Evanston', state: 'IL', zipCode: '60201', source: 'Website', tags: ['condo-owner'] },
    { firstName: 'Dorothy', lastName: 'Clark', email: 'dorothy.clark@email.com', phone: '555-1016', dateOfBirth: new Date('1955-12-01'), city: 'Schaumburg', state: 'IL', zipCode: '60173', source: 'Walk-in', tags: ['senior', 'long-term-care'] },
    { firstName: 'Thomas', lastName: 'Lewis', email: 'thomas.lewis@email.com', phone: '555-1017', dateOfBirth: new Date('1998-05-23'), city: 'Springfield', state: 'IL', zipCode: '62701', source: 'Social Media', tags: ['student', 'good-student-discount'] },
    { firstName: 'Nancy', lastName: 'Lee', email: 'nancy.lee@email.com', phone: '555-1018', dateOfBirth: new Date('1987-09-14'), city: 'Chicago', state: 'IL', zipCode: '60601', source: 'Partner', tags: ['homeowner', 'new-construction'] },
    { firstName: 'Daniel', lastName: 'Walker', email: 'daniel.walker@email.com', phone: '555-1019', dateOfBirth: new Date('1972-07-08'), city: 'Aurora', state: 'IL', zipCode: '60505', source: 'Referral', tags: ['VIP', 'high-value'] },
  ];

  const commercialClientsData = [
    { businessName: 'Chen Tech Solutions LLC', businessType: 'Technology Consulting', firstName: 'David', lastName: 'Chen', email: 'david@chentechsolutions.com', phone: '555-4001', ein: '12-3456789', yearsInBusiness: 8, numberOfEmployees: 25, annualRevenue: 2500000, city: 'Schaumburg', state: 'IL', zipCode: '60173', source: 'LinkedIn', tags: ['tech', 'professional-liability'] },
    { businessName: "Miller's Family Restaurant", businessType: 'Restaurant', firstName: 'Susan', lastName: 'Miller', email: 'susan@millerrestaurant.com', phone: '555-5001', ein: '98-7654321', yearsInBusiness: 15, numberOfEmployees: 35, annualRevenue: 1800000, city: 'Evanston', state: 'IL', zipCode: '60201', source: 'Referral', tags: ['restaurant', 'workers-comp'] },
    { businessName: 'ABC Manufacturing Inc', businessType: 'Manufacturing', firstName: 'Robert', lastName: 'Johnson', email: 'robert@abcmfg.com', phone: '555-5002', ein: '11-1111111', yearsInBusiness: 20, numberOfEmployees: 150, annualRevenue: 15000000, city: 'Joliet', state: 'IL', zipCode: '60431', source: 'Cold Call', tags: ['manufacturing', 'workers-comp', 'product-liability'] },
    { businessName: 'Downtown Medical Group', businessType: 'Healthcare', firstName: 'Sarah', lastName: 'Williams', email: 'sarah@downtownmed.com', phone: '555-5003', ein: '22-2222222', yearsInBusiness: 12, numberOfEmployees: 45, annualRevenue: 5000000, city: 'Chicago', state: 'IL', zipCode: '60601', source: 'Website', tags: ['healthcare', 'malpractice'] },
    { businessName: 'Quick Transport LLC', businessType: 'Trucking', firstName: 'Mike', lastName: 'Davis', email: 'mike@quicktransport.com', phone: '555-5004', ein: '33-3333333', yearsInBusiness: 6, numberOfEmployees: 30, annualRevenue: 3500000, city: 'Rockford', state: 'IL', zipCode: '61101', source: 'Referral', tags: ['trucking', 'commercial-auto', 'cargo'] },
    { businessName: 'Secure IT Services', businessType: 'IT Services', firstName: 'Jennifer', lastName: 'Brown', email: 'jennifer@secureit.com', phone: '555-5005', ein: '44-4444444', yearsInBusiness: 4, numberOfEmployees: 15, annualRevenue: 1200000, city: 'Naperville', state: 'IL', zipCode: '60540', source: 'LinkedIn', tags: ['tech', 'cyber', 'professional-liability'] },
    { businessName: 'Green Landscaping Co', businessType: 'Landscaping', firstName: 'Carlos', lastName: 'Martinez', email: 'carlos@greenlandscape.com', phone: '555-5006', ein: '55-5555555', yearsInBusiness: 10, numberOfEmployees: 20, annualRevenue: 800000, city: 'Aurora', state: 'IL', zipCode: '60505', source: 'Walk-in', tags: ['landscaping', 'general-liability'] },
    { businessName: 'Premier Auto Body', businessType: 'Auto Repair', firstName: 'James', lastName: 'Wilson', email: 'james@premierautobody.com', phone: '555-5007', ein: '66-6666666', yearsInBusiness: 18, numberOfEmployees: 12, annualRevenue: 950000, city: 'Springfield', state: 'IL', zipCode: '62701', source: 'Referral', tags: ['auto-repair', 'garage-keepers'] },
    { businessName: 'Elite Dental Practice', businessType: 'Dental', firstName: 'Emily', lastName: 'Taylor', email: 'emily@elitedental.com', phone: '555-5008', ein: '77-7777777', yearsInBusiness: 7, numberOfEmployees: 8, annualRevenue: 1500000, city: 'Champaign', state: 'IL', zipCode: '61820', source: 'Website', tags: ['dental', 'malpractice'] },
    { businessName: 'Metro Construction Inc', businessType: 'Construction', firstName: 'Tom', lastName: 'Anderson', email: 'tom@metroconstruction.com', phone: '555-5009', ein: '88-8888888', yearsInBusiness: 25, numberOfEmployees: 75, annualRevenue: 8000000, city: 'Peoria', state: 'IL', zipCode: '61602', source: 'Partner', tags: ['construction', 'builders-risk', 'workers-comp'] },
    { businessName: 'Sunshine Daycare Center', businessType: 'Childcare', firstName: 'Lisa', lastName: 'Moore', email: 'lisa@sunshinedaycare.com', phone: '555-5010', ein: '99-9999999', yearsInBusiness: 9, numberOfEmployees: 18, annualRevenue: 600000, city: 'Bloomington', state: 'IL', zipCode: '61701', source: 'Referral', tags: ['daycare', 'abuse-molestation'] },
    { businessName: 'City Law Partners', businessType: 'Legal Services', firstName: 'Mark', lastName: 'Jackson', email: 'mark@citylawpartners.com', phone: '555-5011', ein: '10-1010101', yearsInBusiness: 15, numberOfEmployees: 22, annualRevenue: 4500000, city: 'Chicago', state: 'IL', zipCode: '60601', source: 'LinkedIn', tags: ['legal', 'professional-liability'] },
    { businessName: 'Fresh Bites Catering', businessType: 'Catering', firstName: 'Amy', lastName: 'White', email: 'amy@freshbites.com', phone: '555-5012', ein: '20-2020202', yearsInBusiness: 5, numberOfEmployees: 10, annualRevenue: 400000, city: 'Elgin', state: 'IL', zipCode: '60120', source: 'Social Media', tags: ['catering', 'food-liability'] },
    { businessName: 'Reliable Plumbing Services', businessType: 'Plumbing', firstName: 'Steve', lastName: 'Harris', email: 'steve@reliableplumbing.com', phone: '555-5013', ein: '30-3030303', yearsInBusiness: 12, numberOfEmployees: 8, annualRevenue: 700000, city: 'Waukegan', state: 'IL', zipCode: '60085', source: 'Walk-in', tags: ['plumbing', 'contractors'] },
    { businessName: 'Peak Fitness Gym', businessType: 'Fitness Center', firstName: 'Rachel', lastName: 'Martin', email: 'rachel@peakfitness.com', phone: '555-5014', ein: '40-4040404', yearsInBusiness: 3, numberOfEmployees: 15, annualRevenue: 550000, city: 'Cicero', state: 'IL', zipCode: '60804', source: 'Website', tags: ['fitness', 'liability', 'equipment'] },
  ];

  const personalClients = await Promise.all(
    personalClientsData.map((c, i) =>
      prisma.client.create({
        data: {
          type: ClientType.PERSONAL,
          status: i < 15 ? ClientStatus.ACTIVE : ClientStatus.PROSPECT,
          ...c,
          address: `${100 + i} Client Street`,
          agentId: agents[i % agents.length].id,
          householdId: households[i % households.length].id,
        },
      })
    )
  );
  console.log('Created personal clients:', personalClients.length);

  const commercialClients = await Promise.all(
    commercialClientsData.map((c, i) =>
      prisma.client.create({
        data: {
          type: ClientType.COMMERCIAL,
          status: ClientStatus.ACTIVE,
          ...c,
          address: `${200 + i} Business Park Drive`,
          agentId: agents[i % agents.length].id,
        },
      })
    )
  );
  console.log('Created commercial clients:', commercialClients.length);

  const allClients = [...personalClients, ...commercialClients];

  // ==================== CONTACTS (20) ====================
  const contactsData = personalClients.slice(0, 20).map((client, i) => ({
    clientId: client.id,
    type: [ContactType.FAMILY, ContactType.EMERGENCY, ContactType.BUSINESS, ContactType.OTHER][i % 4],
    name: `Contact ${i + 1} for ${client.firstName}`,
    relationship: ['Spouse', 'Parent', 'Sibling', 'Friend', 'Business Partner'][i % 5],
    email: `contact${i + 1}@email.com`,
    phone: `555-9${String(i).padStart(3, '0')}`,
    isPrimary: i % 3 === 0,
  }));

  await prisma.contact.createMany({ data: contactsData });
  console.log('Created contacts:', contactsData.length);

  // ==================== LIFE EVENTS (20) ====================
  const lifeEventTypes = ['BIRTHDAY', 'MARRIAGE', 'NEW_BABY', 'NEW_HOME', 'RETIREMENT', 'BUSINESS_EXPANSION', 'NEW_VEHICLE', 'GRADUATION'];
  const lifeEventsData = personalClients.slice(0, 20).map((client, i) => ({
    clientId: client.id,
    type: lifeEventTypes[i % lifeEventTypes.length],
    title: `${lifeEventTypes[i % lifeEventTypes.length]} Event`,
    description: `Important life event for ${client.firstName} ${client.lastName}`,
    eventDate: new Date(2025, i % 12, (i % 28) + 1),
    followUpDate: new Date(2025, i % 12, Math.max(1, (i % 28) - 14)),
    isCompleted: i % 4 === 0,
  }));

  await prisma.lifeEvent.createMany({ data: lifeEventsData });
  console.log('Created life events:', lifeEventsData.length);

  // ==================== POLICIES (55 total: 30 ACTIVE, 15 CANCELLED, 5 NON_RENEWED, 3 EXPIRED, 2 PENDING) ====================
  const lineOfBusinessOptions = [
    LineOfBusiness.PERSONAL_AUTO,
    LineOfBusiness.HOMEOWNERS,
    LineOfBusiness.RENTERS,
    LineOfBusiness.UMBRELLA,
    LineOfBusiness.COMMERCIAL_AUTO,
    LineOfBusiness.COMMERCIAL_PROPERTY,
    LineOfBusiness.GENERAL_LIABILITY,
    LineOfBusiness.WORKERS_COMP,
    LineOfBusiness.PROFESSIONAL_LIABILITY,
    LineOfBusiness.CYBER,
  ];

  // Calculate dates for renewals - ensure at least 18 ACTIVE policies expire within 90 days
  const today = new Date();
  const getExpirationDate = (index: number) => {
    // First 18 policies will have expiration dates within the next 90 days
    if (index < 6) {
      // 6 policies expiring within 30 days (urgent)
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5 + (index * 4));
    } else if (index < 12) {
      // 6 policies expiring within 31-60 days (soon)
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 35 + ((index - 6) * 5));
    } else if (index < 18) {
      // 6 policies expiring within 61-90 days (upcoming)
      return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 65 + ((index - 12) * 4));
    } else {
      // Rest have varied expiration dates
      return new Date(today.getFullYear(), today.getMonth() + ((index - 18) % 12) + 1, 1);
    }
  };

  // Helper: get status for a policy based on index
  const getPolicyStatus = (index: number): PolicyStatus => {
    // First 30: ACTIVE (indices 0-29)
    if (index < 30) return PolicyStatus.ACTIVE;
    // Next 15: CANCELLED (indices 30-44)
    if (index < 45) return PolicyStatus.CANCELLED;
    // Next 5: NON_RENEWED (indices 45-49)
    if (index < 50) return PolicyStatus.NON_RENEWED;
    // Next 3: EXPIRED (indices 50-52)
    if (index < 53) return PolicyStatus.EXPIRED;
    // Last 2: PENDING (indices 53-54)
    return PolicyStatus.PENDING;
  };

  // Helper: get expiration/cancellation date for non-active policies
  const getCancelledDate = (index: number) => {
    // Cancelled/non-renewed policies were cancelled 1-12 months ago
    const monthsAgo = ((index - 30) % 12) + 1;
    return new Date(today.getFullYear(), today.getMonth() - monthsAgo, 15);
  };

  const cancellationReasons = [
    'Non-payment of premium',
    'Underwriting decision',
    'Client requested cancellation',
    'Moved out of state',
    'Found cheaper coverage elsewhere',
    'Policy not renewed by carrier',
    'Business closure',
    'Vehicle sold',
    'Property sold',
    'Risk no longer insurable',
    'Fraud investigation',
    'Multiple claims filed',
    'Coverage no longer needed',
    'Switched to competitor',
    'Carrier withdrew from market',
  ];

  const totalPolicies = 55;
  const policies = await Promise.all(
    Array.from({ length: totalPolicies }, (_, i) => i).map((i) => {
      const client = allClients[i % allClients.length];
      const status = getPolicyStatus(i);
      let expirationDate: Date;
      let effectiveDate: Date;

      if (status === PolicyStatus.ACTIVE) {
        expirationDate = getExpirationDate(i);
        effectiveDate = new Date(expirationDate);
        effectiveDate.setFullYear(effectiveDate.getFullYear() - 1);
      } else {
        // Cancelled/Non-Renewed/Expired policies have past dates
        expirationDate = getCancelledDate(i);
        effectiveDate = new Date(expirationDate);
        effectiveDate.setFullYear(effectiveDate.getFullYear() - 1);
      }

      return prisma.policy.create({
        data: {
          policyNumber: `POL-2024-${String(i + 1).padStart(5, '0')}`,
          status,
          lineOfBusiness: lineOfBusinessOptions[i % lineOfBusinessOptions.length],
          type: `${lineOfBusinessOptions[i % lineOfBusinessOptions.length].replace(/_/g, ' ')} Policy`,
          effectiveDate,
          expirationDate,
          premium: 1000 + (i * 250),
          downPayment: 100 + (i * 25),
          installments: [1, 2, 4, 6, 12][i % 5],
          billingMethod: [BillingMethod.DIRECT, BillingMethod.AGENCY, BillingMethod.PREMIUM_FINANCE][i % 3],
          coverageSummary: {
            liability: '100/300',
            deductible: 500 + (i * 100),
            ...(status === PolicyStatus.CANCELLED ? { cancellationReason: cancellationReasons[i % cancellationReasons.length] } : {}),
          },
          clientId: client.id,
          carrierId: carriers[i % carriers.length].id,
          agentId: agents[i % agents.length].id,
        },
      });
    })
  );
  console.log('Created policies:', policies.length);

  // ==================== ENDORSEMENTS (20) ====================
  const endorsementsData = policies.slice(0, 20).map((policy, i) => ({
    policyId: policy.id,
    endorsementNumber: `END-${String(i + 1).padStart(3, '0')}`,
    type: ['Add Vehicle', 'Add Driver', 'Increase Coverage', 'Add Rider', 'Change Address'][i % 5],
    description: `Endorsement ${i + 1} - ${['Added new vehicle', 'Added spouse as driver', 'Increased liability limits', 'Added jewelry rider', 'Updated mailing address'][i % 5]}`,
    effectiveDate: new Date(2024, (i % 12) + 1, 15),
    premiumChange: [-100, 50, 150, 75, 0][i % 5],
    status: i < 15 ? 'PROCESSED' : 'PENDING',
  }));

  await prisma.endorsement.createMany({ data: endorsementsData });
  console.log('Created endorsements:', endorsementsData.length);

  // ==================== QUOTES (25) ====================
  const quotes = await Promise.all(
    allClients.slice(0, 25).map((client, i) =>
      prisma.quote.create({
        data: {
          quoteNumber: `QT-2024-${String(i + 1).padStart(5, '0')}`,
          status: [QuoteStatus.DRAFT, QuoteStatus.QUOTED, QuoteStatus.PROPOSED, QuoteStatus.ACCEPTED, QuoteStatus.DECLINED, QuoteStatus.EXPIRED, QuoteStatus.BOUND][i % 7],
          lineOfBusiness: lineOfBusinessOptions[i % lineOfBusinessOptions.length],
          type: `${lineOfBusinessOptions[i % lineOfBusinessOptions.length].replace(/_/g, ' ')} Quote`,
          effectiveDate: new Date(2025, i % 12, 1),
          premium: 800 + (i * 200),
          fees: 25 + (i * 5),
          taxes: 50 + (i * 10),
          totalPremium: 875 + (i * 215),
          riskInfo: { vehicles: i, drivers: i % 3 + 1, claims: i % 2 },
          carrierQuotes: [
            { carrier: 'Safeco', premium: 900 + (i * 200), score: 85 },
            { carrier: 'Progressive', premium: 850 + (i * 200), score: 82 },
            { carrier: 'Travelers', premium: 920 + (i * 200), score: 80 },
          ],
          expiresAt: new Date(2025, i % 12, 28),
          clientId: client.id,
          carrierId: carriers[i % carriers.length].id,
          agentId: agents[i % agents.length].id,
        },
      })
    )
  );
  console.log('Created quotes:', quotes.length);

  // ==================== QUOTE FOLLOW-UPS (20) ====================
  const followUpsData = quotes.slice(0, 20).map((quote, i) => ({
    quoteId: quote.id,
    type: ['PHONE', 'EMAIL', 'TEXT', 'MEETING'][i % 4],
    scheduledAt: new Date(2025, i % 12, (i % 28) + 1),
    completedAt: i % 3 === 0 ? new Date(2025, i % 12, (i % 28) + 2) : null,
    notes: `Follow up on quote ${quote.quoteNumber}`,
  }));

  await prisma.quoteFollowUp.createMany({ data: followUpsData });
  console.log('Created quote follow-ups:', followUpsData.length);

  // ==================== CLAIMS (25) ====================
  const claimTypes = ['Auto Collision', 'Auto Comprehensive', 'Property Fire', 'Property Water Damage', 'Property Theft', 'Liability Injury', 'Workers Compensation'];
  const claimStatuses = [ClaimStatus.REPORTED, ClaimStatus.UNDER_INVESTIGATION, ClaimStatus.PENDING_DOCUMENTS, ClaimStatus.IN_REVIEW, ClaimStatus.APPROVED, ClaimStatus.DENIED, ClaimStatus.SETTLED, ClaimStatus.CLOSED];

  const claims = await Promise.all(
    policies.slice(0, 25).map((policy, i) =>
      prisma.claim.create({
        data: {
          claimNumber: `CLM-2024-${String(i + 1).padStart(5, '0')}`,
          status: claimStatuses[i % claimStatuses.length],
          type: claimTypes[i % claimTypes.length],
          dateOfLoss: new Date(2024, i % 12, (i % 28) + 1),
          description: `${claimTypes[i % claimTypes.length]} claim - ${['Minor damage', 'Major damage', 'Total loss', 'Partial damage', 'Vandalism'][i % 5]}`,
          lossLocation: `${100 + i} Loss Location Street, City, IL`,
          estimatedLoss: 1000 + (i * 500),
          deductible: 500,
          reserveAmount: 1500 + (i * 500),
          paidAmount: i % 4 === 0 ? 1000 + (i * 400) : null,
          adjusterName: `Adjuster ${i + 1}`,
          adjusterPhone: `800-555-1${String(i).padStart(3, '0')}`,
          adjusterEmail: `adjuster${i + 1}@carrier.com`,
          closedAt: i % 5 === 0 ? new Date(2024, i % 12, 28) : null,
          closedReason: i % 5 === 0 ? 'Claim settled' : null,
          // AI Fraud Detection fields (populated for ~60% of claims)
          aiClassification: i < 15 ? ['LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'SUSPICIOUS', 'LEGITIMATE'][i % 5] : null,
          aiRiskScore: i < 15 ? parseFloat((0.1 + (i % 10) * 0.09).toFixed(2)) : null,
          aiFlags: i < 15 ? {
            flags: [
              { type: ['inconsistent_timeline', 'high_claim_amount', 'multiple_claims', 'new_policy', 'suspicious_documentation'][i % 5], severity: ['LOW', 'MEDIUM', 'HIGH'][i % 3], description: 'AI-detected flag' },
            ],
            analyzedAt: new Date(2024, i % 12, (i % 28) + 2).toISOString(),
          } : undefined,
          policyId: policy.id,
          clientId: policy.clientId,
          agentId: agents[i % agents.length].id,
        },
      })
    )
  );
  console.log('Created claims:', claims.length);

  // ==================== CLAIM COMMUNICATIONS (30) ====================
  const communicationsData = claims.slice(0, 15).flatMap((claim, i) => [
    {
      claimId: claim.id,
      type: 'PHONE',
      direction: 'OUTBOUND',
      subject: 'Initial contact',
      content: 'Called insured to gather details about the claim.',
      contactName: 'Insured',
    },
    {
      claimId: claim.id,
      type: 'EMAIL',
      direction: 'INBOUND',
      subject: 'Documentation received',
      content: 'Received requested documentation from insured.',
      contactName: 'Insured',
    },
  ]);

  await prisma.claimCommunication.createMany({ data: communicationsData });
  console.log('Created claim communications:', communicationsData.length);

  // ==================== SETTLEMENTS (15) ====================
  const settlementsData = claims.slice(0, 15).map((claim, i) => ({
    claimId: claim.id,
    amount: 1000 + (i * 500),
    type: ['Payment', 'Partial Payment', 'Final Settlement'][i % 3],
    description: `Settlement payment for claim ${claim.claimNumber}`,
    paidDate: i < 10 ? new Date(2024, i % 12, 20) : null,
    checkNumber: i < 10 ? `CHK-${String(i + 1).padStart(5, '0')}` : null,
    status: ['PAID', 'PAID', 'APPROVED', 'PENDING', 'PAID', 'PROCESSING', 'PAID', 'APPROVED', 'PAID', 'PAID', 'PENDING', 'APPROVED', 'PAID', 'PENDING', 'PAID'][i],
    paymentMethod: ['CHECK', 'ACH', 'WIRE', 'CHECK', 'ACH'][i % 5],
    recipientName: `Claimant ${i + 1}`,
  }));

  await prisma.settlement.createMany({ data: settlementsData });
  console.log('Created settlements:', settlementsData.length);

  // ==================== COMMISSIONS (90 — 15 per month for last 6 months) ====================
  // Spread commissions across recent months so Statements page has data
  const commissionNow = new Date();
  const statuses = [CommissionStatus.PENDING, CommissionStatus.EARNED, CommissionStatus.PAID, CommissionStatus.REVERSED, CommissionStatus.CHARGEDBACK];
  const commTypes = [CommissionType.NEW_BUSINESS, CommissionType.RENEWAL, CommissionType.ENDORSEMENT, CommissionType.OVERRIDE, CommissionType.BONUS];
  const commissionsData = Array.from({ length: 90 }, (_, i) => {
    const monthsAgo = i % 6;
    const dayOfMonth = 3 + (i % 25);
    const earnedDate = new Date(commissionNow.getFullYear(), commissionNow.getMonth() - monthsAgo, dayOfMonth);
    const paidDate = statuses[i % 5] === CommissionStatus.PAID
      ? new Date(earnedDate.getFullYear(), earnedDate.getMonth(), Math.min(28, dayOfMonth + 14))
      : null;
    return {
      status: statuses[i % 5],
      type: commTypes[i % 5],
      amount: 100 + (i * 25) % 800,
      rate: 8 + (i % 8),
      basePremium: Number(policies[i % policies.length].premium),
      earnedDate,
      paidDate,
      statementDate: new Date(earnedDate.getFullYear(), earnedDate.getMonth(), 1),
      policyId: policies[i % policies.length].id,
      agentId: agents[i % agents.length].id,
    };
  });

  await prisma.commission.createMany({ data: commissionsData });
  console.log('Created commissions:', commissionsData.length);

  // ==================== COMMISSION SPLITS (15) ====================
  const commissions = await prisma.commission.findMany({ take: 15 });
  const splitsData = commissions.map((comm, i) => ({
    commissionId: comm.id,
    producerId: agents[i % agents.length].id,
    percentage: 50 + (i % 5) * 10,
    amount: Number(comm.amount) * (0.5 + (i % 5) * 0.1),
  }));

  await prisma.commissionSplit.createMany({ data: splitsData });
  console.log('Created commission splits:', splitsData.length);

  // ==================== CAMPAIGNS (15) ====================
  const campaignsData = Array.from({ length: 15 }, (_, i) => ({
    name: `Campaign ${i + 1} - ${['Renewal Reminder', 'Cross-Sell', 'New Product', 'Holiday Special', 'Referral Program'][i % 5]}`,
    type: [CampaignType.EMAIL, CampaignType.SMS, CampaignType.MAIL, CampaignType.RENEWAL_REMINDER, CampaignType.CROSS_SELL, CampaignType.NEWSLETTER][i % 6],
    status: [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED, CampaignStatus.SENDING, CampaignStatus.SENT, CampaignStatus.CANCELLED][i % 5],
    subject: `Special Offer ${i + 1}`,
    content: `Campaign content for ${['Renewal Reminder', 'Cross-Sell', 'New Product', 'Holiday Special', 'Referral Program'][i % 5]}`,
    scheduledAt: new Date(2025, i % 12, 10),
    sentAt: i % 3 === 0 ? new Date(2025, i % 12, 10) : null,
    recipientCount: 50 + (i * 10),
    openCount: 20 + (i * 5),
    clickCount: 10 + (i * 2),
    responseCount: 5 + i,
    createdById: agents[i % agents.length].id,
  }));

  const campaigns = await Promise.all(
    campaignsData.map((c) => prisma.campaign.create({ data: c }))
  );
  console.log('Created campaigns:', campaigns.length);

  // ==================== CAMPAIGN RECIPIENTS (30) ====================
  const recipientsData = campaigns.slice(0, 15).flatMap((campaign, i) =>
    personalClients.slice(0, 2).map((client, j) => ({
      campaignId: campaign.id,
      clientId: client.id,
      status: ['PENDING', 'SENT', 'OPENED', 'CLICKED', 'RESPONDED'][j % 5],
      sentAt: j % 3 === 0 ? new Date(2025, i % 12, 10) : null,
      openedAt: j % 4 === 0 ? new Date(2025, i % 12, 11) : null,
      clickedAt: j % 5 === 0 ? new Date(2025, i % 12, 11) : null,
    }))
  );

  // Remove duplicates before inserting
  const uniqueRecipients = recipientsData.filter((r, i, arr) =>
    arr.findIndex(x => x.campaignId === r.campaignId && x.clientId === r.clientId) === i
  );

  await prisma.campaignRecipient.createMany({ data: uniqueRecipients });
  console.log('Created campaign recipients:', uniqueRecipients.length);

  // ==================== REFERRALS (15) ====================
  const referralsData = personalClients.slice(0, 15).map((client, i) => ({
    referringClientId: client.id,
    referredClientId: personalClients[(i + 1) % personalClients.length]?.id,
    referredName: `Referral ${i + 1}`,
    referredEmail: `referral${i + 1}@email.com`,
    referredPhone: `555-8${String(i).padStart(3, '0')}`,
    status: ['PENDING', 'CONTACTED', 'QUOTED', 'CONVERTED', 'LOST'][i % 5],
    notes: `Referral from ${client.firstName} ${client.lastName}`,
    rewardGiven: i % 4 === 0,
    rewardAmount: i % 4 === 0 ? 50 : null,
  }));

  await prisma.referral.createMany({ data: referralsData });
  console.log('Created referrals:', referralsData.length);

  // ==================== DOCUMENTS (25) ====================
  // Create uploads directory
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Helper to create a placeholder text file
  const createPlaceholderFile = (fileName: string, content: string): number => {
    const filePath = path.join(uploadsDir, fileName);
    writeFileSync(filePath, content, 'utf-8');
    return Buffer.byteLength(content, 'utf-8');
  };

  const clientDocTypes = [DocumentType.ID, DocumentType.APPLICATION, DocumentType.CORRESPONDENCE, DocumentType.OTHER];
  const clientDocDescriptions = [
    'Government-issued photo identification',
    'Insurance application form - completed and signed',
    'Email correspondence regarding policy inquiry',
    'Miscellaneous supporting document',
  ];

  const documentsData = [
    ...personalClients.slice(0, 10).map((client, i) => {
      const fileName = `client_doc_${i + 1}.txt`;
      const docType = clientDocTypes[i % 4];
      const content = [
        `=== ${docType.replace(/_/g, ' ')} ===`,
        `Client: ${client.firstName} ${client.lastName}`,
        `Email: ${client.email || 'N/A'}`,
        `Phone: ${client.phone || 'N/A'}`,
        `Date: ${new Date().toLocaleDateString()}`,
        '',
        `Document Type: ${docType.replace(/_/g, ' ')}`,
        `Description: ${clientDocDescriptions[i % 4]}`,
        '',
        `--- Document Content ---`,
        `This is a sample ${docType.replace(/_/g, ' ').toLowerCase()} document for ${client.firstName} ${client.lastName}.`,
        `Generated as seed data for the InsureFlow Agency Management System.`,
        '',
        `Notes:`,
        `- Client ID: ${client.id}`,
        `- Status: ${client.status}`,
        `- Type: ${client.type}`,
      ].join('\n');
      const fileSize = createPlaceholderFile(fileName, content);
      return {
        clientId: client.id,
        type: docType,
        name: `Client Document ${i + 1}`,
        fileName,
        fileUrl: `/uploads/${fileName}`,
        fileSize,
        mimeType: 'text/plain',
        description: `${clientDocDescriptions[i % 4]} for ${client.firstName} ${client.lastName}`,
      };
    }),
    ...policies.slice(0, 10).map((policy, i) => {
      const fileName = `policy_doc_${i + 1}.txt`;
      const docType = [DocumentType.POLICY, DocumentType.ENDORSEMENT][i % 2];
      const content = [
        `=== ${docType.replace(/_/g, ' ')} ===`,
        `Policy Number: ${policy.policyNumber}`,
        `Line of Business: ${(policy.lineOfBusiness || '').replace(/_/g, ' ')}`,
        `Status: ${policy.status}`,
        `Effective Date: ${policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString() : 'N/A'}`,
        `Expiration Date: ${policy.expirationDate ? new Date(policy.expirationDate).toLocaleDateString() : 'N/A'}`,
        `Premium: $${Number(policy.premium || 0).toLocaleString()}`,
        '',
        `--- Policy Details ---`,
        docType === DocumentType.POLICY
          ? `This is the full policy declaration document for policy ${policy.policyNumber}.\nIt contains coverage details, limits, deductibles, and terms and conditions.`
          : `This is an endorsement/amendment to policy ${policy.policyNumber}.\nIt modifies the original policy terms as described below.`,
        '',
        `Coverage Summary:`,
        `- Bodily Injury Liability: $100,000 / $300,000`,
        `- Property Damage Liability: $50,000`,
        `- Comprehensive Deductible: $500`,
        `- Collision Deductible: $1,000`,
        '',
        `Generated as seed data for the InsureFlow Agency Management System.`,
      ].join('\n');
      const fileSize = createPlaceholderFile(fileName, content);
      return {
        policyId: policy.id,
        type: docType,
        name: `Policy Document ${i + 1}`,
        fileName,
        fileUrl: `/uploads/${fileName}`,
        fileSize,
        mimeType: 'text/plain',
        description: `${docType.replace(/_/g, ' ')} for policy ${policy.policyNumber}`,
      };
    }),
    ...claims.slice(0, 5).map((claim, i) => {
      const fileName = `claim_doc_${i + 1}.txt`;
      const content = [
        `=== CLAIM DOCUMENT ===`,
        `Claim Number: ${claim.claimNumber}`,
        `Status: ${claim.status}`,
        `Date of Loss: ${claim.dateOfLoss ? new Date(claim.dateOfLoss).toLocaleDateString() : 'N/A'}`,
        `Type: ${(claim.type || '').replace(/_/g, ' ')}`,
        '',
        `--- Claim Details ---`,
        `Description: ${claim.description || 'No description provided'}`,
        '',
        `Loss Location: ${claim.lossLocation || 'Not specified'}`,
        `Estimated Loss: $${Number(claim.estimatedLoss || 0).toLocaleString()}`,
        `Deductible: $${Number(claim.deductible || 0).toLocaleString()}`,
        '',
        `Adjuster Notes:`,
        `- Initial inspection completed`,
        `- Photos and documentation received`,
        `- Damage assessment in progress`,
        '',
        `Generated as seed data for the InsureFlow Agency Management System.`,
      ].join('\n');
      const fileSize = createPlaceholderFile(fileName, content);
      return {
        claimId: claim.id,
        type: DocumentType.CLAIM,
        name: `Claim Document ${i + 1}`,
        fileName,
        fileUrl: `/uploads/${fileName}`,
        fileSize,
        mimeType: 'text/plain',
        description: `Claim documentation for ${claim.claimNumber}`,
      };
    }),
  ];

  await prisma.document.createMany({ data: documentsData });
  console.log('Created documents:', documentsData.length, '(with actual files in public/uploads/)');

  // ==================== ACTIVITIES (50) ====================
  const activitiesData = [
    ...personalClients.slice(0, 15).map((client, i) => ({
      type: ActivityType.CLIENT_CREATED,
      title: 'Client created',
      description: `Created client ${client.firstName} ${client.lastName}`,
      userId: agents[i % agents.length].id,
      clientId: client.id,
    })),
    ...policies.slice(0, 15).map((policy, i) => ({
      type: ActivityType.POLICY_CREATED,
      title: 'Policy issued',
      description: `Issued policy ${policy.policyNumber}`,
      userId: agents[i % agents.length].id,
      clientId: policy.clientId,
      policyId: policy.id,
    })),
    ...quotes.slice(0, 10).map((quote, i) => ({
      type: ActivityType.QUOTE_CREATED,
      title: 'Quote created',
      description: `Created quote ${quote.quoteNumber}`,
      userId: agents[i % agents.length].id,
      clientId: quote.clientId,
      quoteId: quote.id,
    })),
    ...claims.slice(0, 10).map((claim, i) => ({
      type: ActivityType.CLAIM_REPORTED,
      title: 'Claim reported',
      description: `Reported claim ${claim.claimNumber}`,
      userId: agents[i % agents.length].id,
      clientId: claim.clientId,
      claimId: claim.id,
    })),
  ];

  await prisma.activity.createMany({ data: activitiesData });
  console.log('Created activities:', activitiesData.length);

  // ==================== NOTIFICATIONS (30) ====================
  const notificationsData = [
    ...policies.slice(0, 10).map((policy, i) => ({
      userId: agents[i % agents.length].id,
      type: 'RENEWAL',
      title: 'Policy Renewal Due',
      message: `${policy.policyNumber} expires soon`,
      link: `/policies/${policy.id}`,
      isRead: i % 3 === 0,
    })),
    ...claims.slice(0, 10).map((claim, i) => ({
      userId: agents[i % agents.length].id,
      type: 'CLAIM',
      title: 'Claim Update',
      message: `Update on claim ${claim.claimNumber}`,
      link: `/claims/${claim.id}`,
      isRead: i % 4 === 0,
    })),
    ...quotes.slice(0, 10).map((quote, i) => ({
      userId: agents[i % agents.length].id,
      type: 'QUOTE',
      title: 'Quote Follow-up',
      message: `Follow up on quote ${quote.quoteNumber}`,
      link: `/quotes/${quote.id}`,
      isRead: i % 2 === 0,
    })),
  ];

  await prisma.notification.createMany({ data: notificationsData });
  console.log('Created notifications:', notificationsData.length);

  // ==================== AI ANALYSIS (15) ====================
  const aiAnalysisData = personalClients.slice(0, 15).map((client, i) => ({
    type: ['COVERAGE_GAP', 'RISK_ASSESSMENT', 'CROSS_SELL', 'RENEWAL_PREDICTION'][i % 4],
    entityType: 'CLIENT',
    entityId: client.id,
    input: { clientId: client.id, type: client.type },
    output: {
      recommendations: ['Consider umbrella policy', 'Review liability limits', 'Add life insurance'],
      score: 75 + (i % 25),
    },
    confidence: 0.75 + (i % 25) / 100,
  }));

  await prisma.aIAnalysis.createMany({ data: aiAnalysisData });
  console.log('Created AI analysis:', aiAnalysisData.length);

  // ==================== RENEWAL PREDICTIONS (15) ====================
  const renewalPredictionsData = policies.slice(0, 15).map((policy, i) => ({
    policyId: policy.id,
    renewalDate: new Date(2025, i % 12, 1),
    retentionScore: 0.6 + (i % 4) * 0.1,
    riskFactors: { premiumIncrease: i % 3 === 0, claimsHistory: i % 2 === 0 },
    recommendations: ['Offer multi-policy discount', 'Review coverage needs', 'Contact before renewal'],
  }));

  await prisma.renewalPrediction.createMany({ data: renewalPredictionsData });
  console.log('Created renewal predictions:', renewalPredictionsData.length);

  // ==================== CROSS-SELL RECOMMENDATIONS (20) ====================
  const crossSellData = personalClients.slice(0, 20).map((client, i) => ({
    clientId: client.id,
    recommendedProduct: ['UMBRELLA', 'LIFE', 'CYBER', 'FLOOD', 'JEWELRY_FLOATER'][i % 5],
    score: 0.7 + (i % 30) / 100,
    reasoning: `Based on ${['asset value', 'family situation', 'risk profile', 'coverage gaps', 'life events'][i % 5]}`,
    status: ['PENDING', 'PRESENTED', 'ACCEPTED', 'DECLINED'][i % 4],
  }));

  await prisma.crossSellRecommendation.createMany({ data: crossSellData });
  console.log('Created cross-sell recommendations:', crossSellData.length);

  // ==================== EMAIL TEMPLATES (15) ====================
  const emailTemplatesData = [
    { name: 'Welcome New Client', type: 'WELCOME', subject: 'Welcome to InsureFlow!', content: 'Dear {{client_name}},\n\nWelcome to InsureFlow! We are thrilled to have you as our valued client. Your agent {{agent_name}} is here to help you with all your insurance needs.\n\nBest regards,\nThe InsureFlow Team', variables: ['client_name', 'agent_name'], status: 'ACTIVE', usageCount: 45 },
    { name: 'Policy Renewal Reminder - 60 Days', type: 'RENEWAL', subject: 'Your Policy Renewal is Coming Up', content: 'Dear {{client_name}},\n\nThis is a friendly reminder that your {{policy_type}} policy ({{policy_number}}) is due for renewal on {{renewal_date}}.\n\nPlease contact us to review your coverage options.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'policy_type', 'policy_number', 'renewal_date', 'agent_name'], status: 'ACTIVE', usageCount: 120 },
    { name: 'Policy Renewal Reminder - 30 Days', type: 'RENEWAL', subject: 'Urgent: Policy Renewal in 30 Days', content: 'Dear {{client_name}},\n\nYour {{policy_type}} policy ({{policy_number}}) expires in 30 days on {{renewal_date}}. Please contact us immediately to ensure uninterrupted coverage.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'policy_type', 'policy_number', 'renewal_date', 'agent_name'], status: 'ACTIVE', usageCount: 95 },
    { name: 'Quote Follow-up', type: 'FOLLOW_UP', subject: 'Following Up on Your Insurance Quote', content: 'Dear {{client_name}},\n\nI wanted to follow up on the {{quote_type}} quote ({{quote_number}}) we prepared for you. The quoted premium is {{premium}}.\n\nDo you have any questions? I am happy to discuss your options.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'quote_type', 'quote_number', 'premium', 'agent_name'], status: 'ACTIVE', usageCount: 78 },
    { name: 'Happy Birthday', type: 'BIRTHDAY', subject: 'Happy Birthday, {{client_name}}!', content: 'Dear {{client_name}},\n\nHappy Birthday! On behalf of the entire InsureFlow team, we wish you a wonderful day.\n\nAs your birthday approaches, it is also a great time to review your insurance coverage. Life changes and so do your needs.\n\nBest wishes,\n{{agent_name}}', variables: ['client_name', 'agent_name'], status: 'ACTIVE', usageCount: 200 },
    { name: 'Claim Filed Confirmation', type: 'CLAIM', subject: 'Your Claim Has Been Filed - {{claim_number}}', content: 'Dear {{client_name}},\n\nThis confirms that your claim ({{claim_number}}) has been filed successfully. Your adjuster {{adjuster_name}} will be in touch within 24-48 hours.\n\nClaim Details:\n- Type: {{claim_type}}\n- Date of Loss: {{loss_date}}\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'claim_number', 'adjuster_name', 'claim_type', 'loss_date', 'agent_name'], status: 'ACTIVE', usageCount: 35 },
    { name: 'Cross-Sell: Umbrella Policy', type: 'CROSS_SELL', subject: 'Protect Your Assets with an Umbrella Policy', content: 'Dear {{client_name}},\n\nBased on your current coverage, we recommend adding an umbrella policy for extra protection. Starting at just {{estimated_premium}}/year, it provides an additional layer of liability coverage.\n\nWould you like a free quote?\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'estimated_premium', 'agent_name'], status: 'ACTIVE', usageCount: 55 },
    { name: 'Cross-Sell: Life Insurance', type: 'CROSS_SELL', subject: 'Secure Your Family\'s Future with Life Insurance', content: 'Dear {{client_name}},\n\nLife insurance is an essential part of financial planning. We offer competitive rates for term and whole life policies.\n\nLet us schedule a quick call to discuss your options.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'agent_name'], status: 'ACTIVE', usageCount: 42 },
    { name: 'Policy Cancellation Notice', type: 'CLAIM', subject: 'Important: Policy Cancellation Notice', content: 'Dear {{client_name}},\n\nWe regret to inform you that your {{policy_type}} policy ({{policy_number}}) is scheduled for cancellation on {{cancel_date}} due to {{reason}}.\n\nPlease contact us immediately if you wish to reinstate your policy.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'policy_type', 'policy_number', 'cancel_date', 'reason', 'agent_name'], status: 'ACTIVE', usageCount: 15 },
    { name: 'Referral Thank You', type: 'FOLLOW_UP', subject: 'Thank You for Your Referral!', content: 'Dear {{client_name}},\n\nThank you for referring {{referred_name}} to InsureFlow! We truly appreciate your trust and loyalty.\n\nAs a token of our gratitude, you will receive a {{reward_amount}} gift card.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'referred_name', 'reward_amount', 'agent_name'], status: 'ACTIVE', usageCount: 28 },
    { name: 'Annual Policy Review', type: 'FOLLOW_UP', subject: 'Time for Your Annual Policy Review', content: 'Dear {{client_name}},\n\nIt has been a year since we last reviewed your insurance coverage. A lot can change in a year, and we want to make sure your policies still meet your needs.\n\nPlease schedule a review meeting at your convenience.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'agent_name'], status: 'ACTIVE', usageCount: 88 },
    { name: 'New Home Congratulations', type: 'WELCOME', subject: 'Congratulations on Your New Home!', content: 'Dear {{client_name}},\n\nCongratulations on your new home at {{address}}! We would love to help you protect your investment with a comprehensive homeowners policy.\n\nWould you like a free quote?\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'address', 'agent_name'], status: 'ACTIVE', usageCount: 32 },
    { name: 'Payment Reminder', type: 'FOLLOW_UP', subject: 'Payment Reminder for Policy {{policy_number}}', content: 'Dear {{client_name}},\n\nThis is a friendly reminder that your premium payment of {{amount}} for policy {{policy_number}} is due on {{due_date}}.\n\nPlease make your payment to avoid any lapse in coverage.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'amount', 'policy_number', 'due_date', 'agent_name'], status: 'ACTIVE', usageCount: 150 },
    { name: 'Holiday Greetings', type: 'FOLLOW_UP', subject: 'Season\'s Greetings from InsureFlow!', content: 'Dear {{client_name}},\n\nWishing you and your family a joyous holiday season and a prosperous New Year!\n\nThank you for being a valued client of InsureFlow.\n\nWarm regards,\n{{agent_name}} and the InsureFlow Team', variables: ['client_name', 'agent_name'], status: 'DRAFT', usageCount: 0 },
    { name: 'Cyber Insurance Awareness', type: 'CROSS_SELL', subject: 'Is Your Business Protected from Cyber Threats?', content: 'Dear {{client_name}},\n\nCyber attacks are on the rise and can cost businesses millions. Our cyber insurance policies protect against data breaches, ransomware, and business interruption.\n\nStarting at {{estimated_premium}}/year, it is an investment in your business continuity.\n\nBest regards,\n{{agent_name}}', variables: ['client_name', 'estimated_premium', 'agent_name'], status: 'ACTIVE', usageCount: 22 },
  ];

  await prisma.emailTemplate.createMany({ data: emailTemplatesData });
  console.log('Created email templates:', emailTemplatesData.length);

  // ==================== PROPOSALS (15) ====================
  const proposalsData = quotes.slice(0, 15).map((quote, i) => ({
    quoteId: quote.id,
    content: {
      coverageOptions: [
        { type: 'Basic', premium: 800 + (i * 100), deductible: 1000 },
        { type: 'Standard', premium: 1200 + (i * 100), deductible: 500 },
        { type: 'Premium', premium: 1800 + (i * 100), deductible: 250 },
      ],
      recommendation: 'Standard',
      agentNotes: `Recommended coverage for quote ${quote.quoteNumber}`,
      discountsApplied: ['Multi-policy', 'Claims-free'][i % 2],
    },
    sentAt: i % 3 === 0 ? new Date(2025, i % 12, 15) : null,
    viewedAt: i % 4 === 0 ? new Date(2025, i % 12, 16) : null,
    signedAt: i % 6 === 0 ? new Date(2025, i % 12, 18) : null,
    signatureUrl: i % 6 === 0 ? `/signatures/sig_${i + 1}.png` : null,
  }));

  for (const proposal of proposalsData) {
    await prisma.proposal.create({ data: proposal });
  }
  console.log('Created proposals:', proposalsData.length);

  // ==================== CUSTOMER AUTH (5 portal accounts) ====================
  const customerAuthData = personalClients.slice(0, 5).map((client) => ({
    clientId: client.id,
    email: client.email || `portal_${client.firstName.toLowerCase()}@email.com`,
    passwordHash: password, // same bcrypt hash as agents (password123)
  }));

  for (const ca of customerAuthData) {
    await prisma.customerAuth.create({ data: ca });
  }
  console.log('Created customer auth accounts:', customerAuthData.length);

  // ==================== UNDERWRITING RULES (30 rules across LOBs) ====================
  const underwritingRulesData = [
    // Personal Auto rules
    { name: 'Young Driver Risk', description: 'Drivers under 25 have higher risk', lineOfBusiness: LineOfBusiness.PERSONAL_AUTO, category: 'age', field: 'client.dateOfBirth', operator: 'GT', value: new Date(new Date().getFullYear() - 25, 0, 1).toISOString(), riskPoints: 15, priority: 10 },
    { name: 'Senior Driver', description: 'Drivers over 70 may have elevated risk', lineOfBusiness: LineOfBusiness.PERSONAL_AUTO, category: 'age', field: 'client.dateOfBirth', operator: 'LT', value: new Date(new Date().getFullYear() - 70, 0, 1).toISOString(), riskPoints: 10, priority: 9 },
    { name: 'Multiple Claims History', description: 'More than 2 prior claims increases risk', lineOfBusiness: LineOfBusiness.PERSONAL_AUTO, category: 'claims_history', field: 'claimsCount', operator: 'GT', value: '2', riskPoints: 20, priority: 10 },
    { name: 'High Premium Auto', description: 'Premium over $5000 requires review', lineOfBusiness: LineOfBusiness.PERSONAL_AUTO, category: 'premium', field: 'quote.totalPremium', operator: 'GT', value: '5000', riskPoints: 10, priority: 5 },
    { name: 'New Client Auto Risk', description: 'New prospects have unverified history', lineOfBusiness: LineOfBusiness.PERSONAL_AUTO, category: 'client_status', field: 'client.status', operator: 'EQ', value: 'PROSPECT', riskPoints: 8, priority: 3 },
    // Homeowners rules
    { name: 'High Value Home', description: 'Homes with premium over $3000 need review', lineOfBusiness: LineOfBusiness.HOMEOWNERS, category: 'premium', field: 'quote.totalPremium', operator: 'GT', value: '3000', riskPoints: 12, priority: 8 },
    { name: 'Claims History - Home', description: 'Prior claims increase homeowner risk', lineOfBusiness: LineOfBusiness.HOMEOWNERS, category: 'claims_history', field: 'claimsCount', operator: 'GT', value: '1', riskPoints: 18, priority: 10 },
    { name: 'Multiple Active Policies', description: 'Multi-policy clients are lower risk', lineOfBusiness: LineOfBusiness.HOMEOWNERS, category: 'multi_policy', field: 'policiesCount', operator: 'GT', value: '1', riskPoints: -5, priority: 5 },
    // Commercial Auto rules
    { name: 'Large Fleet Risk', description: 'Fleets with many vehicles need review', lineOfBusiness: LineOfBusiness.COMMERCIAL_AUTO, category: 'fleet_size', field: 'quote.totalPremium', operator: 'GT', value: '10000', riskPoints: 15, priority: 8 },
    { name: 'New Business Commercial Auto', description: 'New businesses have less track record', lineOfBusiness: LineOfBusiness.COMMERCIAL_AUTO, category: 'business_age', field: 'client.yearsInBusiness', operator: 'LT', value: '3', riskPoints: 12, priority: 7 },
    // General Liability rules
    { name: 'High Revenue GL', description: 'High revenue businesses need more scrutiny', lineOfBusiness: LineOfBusiness.GENERAL_LIABILITY, category: 'revenue', field: 'client.annualRevenue', operator: 'GT', value: '5000000', riskPoints: 15, priority: 8 },
    { name: 'Large Workforce', description: 'Companies with many employees have more exposure', lineOfBusiness: LineOfBusiness.GENERAL_LIABILITY, category: 'employees', field: 'client.numberOfEmployees', operator: 'GT', value: '50', riskPoints: 10, priority: 6 },
    { name: 'Claims History GL', description: 'Prior GL claims increase risk', lineOfBusiness: LineOfBusiness.GENERAL_LIABILITY, category: 'claims_history', field: 'claimsCount', operator: 'GT', value: '0', riskPoints: 20, priority: 10 },
    // Workers Comp rules
    { name: 'High Employee Count WC', description: 'Large workforce increases WC exposure', lineOfBusiness: LineOfBusiness.WORKERS_COMP, category: 'employees', field: 'client.numberOfEmployees', operator: 'GT', value: '100', riskPoints: 20, priority: 9 },
    { name: 'New Business WC', description: 'New businesses lack safety history', lineOfBusiness: LineOfBusiness.WORKERS_COMP, category: 'business_age', field: 'client.yearsInBusiness', operator: 'LT', value: '2', riskPoints: 15, priority: 8 },
    // Professional Liability
    { name: 'High Revenue Professional', description: 'High revenue professional firms', lineOfBusiness: LineOfBusiness.PROFESSIONAL_LIABILITY, category: 'revenue', field: 'client.annualRevenue', operator: 'GT', value: '3000000', riskPoints: 12, priority: 7 },
    // Cyber
    { name: 'Large Tech Company', description: 'Tech companies with many employees have more cyber risk', lineOfBusiness: LineOfBusiness.CYBER, category: 'employees', field: 'client.numberOfEmployees', operator: 'GT', value: '20', riskPoints: 15, priority: 8 },
    { name: 'High Revenue Cyber', description: 'High revenue = more data to protect', lineOfBusiness: LineOfBusiness.CYBER, category: 'revenue', field: 'client.annualRevenue', operator: 'GT', value: '2000000', riskPoints: 10, priority: 6 },
    // Umbrella
    { name: 'Multi-Policy Required', description: 'Umbrella requires underlying policies', lineOfBusiness: LineOfBusiness.UMBRELLA, category: 'multi_policy', field: 'policiesCount', operator: 'LT', value: '2', riskPoints: 25, priority: 10 },
    // Renters
    { name: 'Young Renter', description: 'Young renters under 22 have higher risk', lineOfBusiness: LineOfBusiness.RENTERS, category: 'age', field: 'client.dateOfBirth', operator: 'GT', value: new Date(new Date().getFullYear() - 22, 0, 1).toISOString(), riskPoints: 8, priority: 5 },
  ];

  await prisma.underwritingRule.createMany({ data: underwritingRulesData });
  console.log('Created underwriting rules:', underwritingRulesData.length);

  // ==================== UNDERWRITING RESULTS (15) ====================
  const uwDecisions = ['APPROVED', 'APPROVED', 'APPROVED', 'REFERRED', 'REFERRED', 'APPROVED', 'DECLINED', 'APPROVED', 'REFERRED', 'APPROVED', 'APPROVED', 'REFERRED', 'DECLINED', 'APPROVED', 'APPROVED'];
  const uwScores =    [12, 22, 8, 45, 55, 18, 72, 15, 48, 25, 10, 42, 68, 20, 14];
  const uwNotes = [
    'Low risk — clean history, multi-policy client.',
    'Moderate risk — young driver but good student discount applies.',
    'Excellent risk — long-term client, no prior claims.',
    'Referred to senior underwriter — high premium commercial account.',
    'Referred — new business, less than 2 years operational history.',
    'Approved — homeowner with bundled auto, low claims.',
    'Declined — excessive prior claims history (4 in 3 years).',
    'Low risk — established business, strong financials.',
    'Referred — high employee count requires WC review.',
    'Approved with conditions — standard risk, proof of alarm required.',
    'Clean risk — renters policy, no prior losses.',
    'Referred — professional liability with revenue over $3M.',
    'Declined — umbrella requested without sufficient underlying coverage.',
    'Approved — standard auto, good driving record.',
    'Low risk — condo owner, first-time buyer.',
  ];

  const uwResults = await Promise.all(
    quotes.slice(0, 15).map((quote, i) => {
      const factors = [];
      const ruleSubset = underwritingRulesData.slice(i % 5, (i % 5) + 3);
      for (const rule of ruleSubset) {
        factors.push({
          ruleName: rule.name,
          riskPoints: Math.round(rule.riskPoints * ((i % 3 === 0) ? 0.5 : 1)),
          detail: rule.description,
        });
      }
      return prisma.underwritingResult.create({
        data: {
          quoteId: quote.id,
          riskScore: uwScores[i],
          maxScore: 100,
          decision: uwDecisions[i],
          factors,
          notes: uwNotes[i],
          reviewedBy: uwDecisions[i] !== 'APPROVED' ? null : admin.name,
          reviewedAt: uwDecisions[i] === 'APPROVED' ? new Date(2025, i % 12, (i % 28) + 3) : null,
        },
      });
    })
  );
  console.log('Created underwriting results:', uwResults.length);

  // ==================== COMPLIANCE RULES (20 common requirements) ====================
  const complianceRulesData = [
    // Licensing
    { name: 'Agent License Renewal', description: 'All agents must maintain valid state insurance licenses', category: 'LICENSING', state: 'IL', requirement: 'Renew insurance agent license before expiration', frequency: 'ANNUAL', severity: 'CRITICAL' },
    { name: 'Continuing Education', description: 'Agents must complete required CE credits', category: 'LICENSING', state: 'IL', requirement: 'Complete 30 hours of continuing education per renewal period', frequency: 'ANNUAL', severity: 'HIGH' },
    { name: 'E&O Insurance', description: 'Agency must maintain errors and omissions coverage', category: 'LICENSING', requirement: 'Maintain active E&O insurance policy with minimum $1M coverage', frequency: 'ANNUAL', severity: 'CRITICAL' },
    // Disclosure
    { name: 'Privacy Notice', description: 'Annual privacy notice to all clients per GLBA', category: 'DISCLOSURE', requirement: 'Send annual privacy notice to all active clients', frequency: 'ANNUAL', severity: 'HIGH' },
    { name: 'Fee Disclosure', description: 'All fees must be disclosed before binding', category: 'DISCLOSURE', requirement: 'Disclose all broker fees and commissions in writing before policy binding', frequency: 'ON_EVENT', severity: 'HIGH' },
    { name: 'Surplus Lines Disclosure', description: 'Surplus lines placement disclosure', category: 'DISCLOSURE', state: 'IL', requirement: 'Provide written disclosure when placing coverage with non-admitted carriers', frequency: 'ON_EVENT', severity: 'MEDIUM' },
    // Documentation
    { name: 'Client File Completeness', description: 'All client files must contain required documents', category: 'DOCUMENTATION', requirement: 'Maintain complete client files including signed applications, ID verification, and coverage summaries', frequency: 'ON_EVENT', severity: 'MEDIUM' },
    { name: 'Quote Documentation', description: 'All quotes must be properly documented', category: 'DOCUMENTATION', requirement: 'Document all coverage options presented and client decisions', frequency: 'ON_EVENT', severity: 'MEDIUM' },
    { name: 'Claims Reporting', description: 'Claims must be reported promptly to carriers', category: 'DOCUMENTATION', requirement: 'Report all claims to carriers within 24 hours of notice', frequency: 'ON_EVENT', severity: 'HIGH' },
    { name: 'Policy Delivery', description: 'Policies must be delivered within timeframe', category: 'DOCUMENTATION', state: 'IL', requirement: 'Deliver policy documents to insured within 30 days of effective date', frequency: 'ON_EVENT', severity: 'MEDIUM' },
    // Reporting
    { name: 'Surplus Lines Filing', description: 'File surplus lines taxes and reports', category: 'REPORTING', state: 'IL', requirement: 'File surplus lines tax returns and premium reports with state', frequency: 'QUARTERLY', severity: 'HIGH' },
    { name: 'Premium Trust Account', description: 'Premium trust account reconciliation', category: 'REPORTING', requirement: 'Reconcile premium trust account monthly', frequency: 'MONTHLY', severity: 'CRITICAL' },
    { name: 'Annual Financial Report', description: 'Submit annual financial report to DOI', category: 'REPORTING', state: 'IL', requirement: 'Submit annual financial report to Department of Insurance', frequency: 'ANNUAL', severity: 'HIGH' },
    { name: 'Complaint Log', description: 'Maintain and report consumer complaints', category: 'REPORTING', requirement: 'Maintain log of all consumer complaints and resolutions', frequency: 'QUARTERLY', severity: 'MEDIUM' },
    // Privacy
    { name: 'Data Security Standards', description: 'Maintain cybersecurity program per state law', category: 'PRIVACY', requirement: 'Implement and maintain comprehensive cybersecurity program', frequency: 'ANNUAL', severity: 'CRITICAL' },
    { name: 'Breach Notification', description: 'Data breach notification procedures', category: 'PRIVACY', state: 'IL', requirement: 'Notify affected individuals within 60 days of data breach discovery', frequency: 'ON_EVENT', severity: 'CRITICAL' },
    { name: 'Record Retention', description: 'Maintain records for required period', category: 'PRIVACY', state: 'IL', requirement: 'Retain all client and policy records for minimum 5 years', frequency: 'ONCE', severity: 'HIGH' },
    { name: 'PII Protection', description: 'Protect personally identifiable information', category: 'PRIVACY', requirement: 'Encrypt all PII at rest and in transit, limit access on need-to-know basis', frequency: 'ONCE', severity: 'CRITICAL' },
    { name: 'Anti-Money Laundering', description: 'AML compliance for applicable products', category: 'REPORTING', requirement: 'Maintain AML program for life insurance and annuity products', frequency: 'ANNUAL', severity: 'HIGH' },
    { name: 'Market Conduct', description: 'Fair market conduct practices', category: 'DISCLOSURE', requirement: 'Ensure all marketing materials and sales practices comply with state regulations', frequency: 'QUARTERLY', severity: 'MEDIUM' },
  ];

  await prisma.complianceRule.createMany({ data: complianceRulesData });
  console.log('Created compliance rules:', complianceRulesData.length);

  // Create compliance checks for existing rules (15+)
  const complianceRules = await prisma.complianceRule.findMany({ take: 20 });
  const complianceChecksData = complianceRules.slice(0, 15).map((rule, i) => ({
    ruleId: rule.id,
    status: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING', 'COMPLIANT', 'COMPLIANT', 'WAIVED', 'COMPLIANT', 'EXPIRED', 'COMPLIANT', 'NON_COMPLIANT', 'COMPLIANT', 'PENDING', 'COMPLIANT', 'COMPLIANT', 'COMPLIANT'][i % 15],
    checkedAt: i % 3 !== 2 ? new Date(2025, i % 12, 10) : null,
    checkedBy: i % 3 !== 2 ? agents[i % agents.length].name : null,
    notes: i % 3 !== 2 ? `Compliance check performed for ${rule.name}` : null,
    nextDueDate: new Date(2025, (i % 12) + 3, 1),
  }));

  await prisma.complianceCheck.createMany({ data: complianceChecksData });
  console.log('Created compliance checks:', complianceChecksData.length);

  // ==================== PAYMENTS (15) ====================
  const paymentStatuses = [PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.FAILED, PaymentStatus.COMPLETED, PaymentStatus.COMPLETED, PaymentStatus.PROCESSING, PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.COMPLETED, PaymentStatus.COMPLETED, PaymentStatus.PENDING, PaymentStatus.COMPLETED];
  const paymentsData = policies.slice(0, 15).map((policy, i) => {
    const st = paymentStatuses[i % paymentStatuses.length];
    return {
      status: st,
      amount: Number(policy.premium),
      currency: 'usd',
      description: `Premium payment for policy ${policy.policyNumber}`,
      paidAt: st === PaymentStatus.COMPLETED || st === PaymentStatus.REFUNDED ? new Date(2025, i % 12, 15) : null,
      failedAt: st === PaymentStatus.FAILED ? new Date(2025, i % 12, 15) : null,
      refundedAt: st === PaymentStatus.REFUNDED ? new Date(2025, i % 12, 20) : null,
      policyId: policy.id,
      clientId: policy.clientId,
    };
  });

  await prisma.payment.createMany({ data: paymentsData });
  console.log('Created payments:', paymentsData.length);

  // ==================== RATE TABLES (13 LOBs) ====================
  const rateTablesData = [
    { lineOfBusiness: LineOfBusiness.PERSONAL_AUTO, baseRate: 1200, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.HOMEOWNERS, baseRate: 1800, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.RENTERS, baseRate: 350, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.UMBRELLA, baseRate: 400, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.COMMERCIAL_AUTO, baseRate: 2500, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.COMMERCIAL_PROPERTY, baseRate: 3200, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.GENERAL_LIABILITY, baseRate: 2800, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.WORKERS_COMP, baseRate: 3500, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.PROFESSIONAL_LIABILITY, baseRate: 2200, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.CYBER, baseRate: 1500, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.LIFE, baseRate: 800, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.HEALTH, baseRate: 6000, effectiveDate: new Date('2025-01-01') },
    { lineOfBusiness: LineOfBusiness.OTHER, baseRate: 900, effectiveDate: new Date('2025-01-01') },
  ];

  const rateTables = await Promise.all(
    rateTablesData.map((rt) => prisma.rateTable.create({ data: rt }))
  );
  console.log('Created rate tables:', rateTables.length);

  // ==================== RATE FACTORS ====================
  const rateFactorsData = [
    // AGE factors
    { rateTableId: rateTables[0].id, category: 'AGE', condition: { operator: 'LT', value: 25 }, multiplier: 1.45, priority: 10 },
    { rateTableId: rateTables[0].id, category: 'AGE', condition: { operator: 'BETWEEN', min: 25, max: 65 }, multiplier: 1.0, priority: 5 },
    { rateTableId: rateTables[0].id, category: 'AGE', condition: { operator: 'GT', value: 65 }, multiplier: 1.2, priority: 8 },
    // LOCATION factors (Personal Auto)
    { rateTableId: rateTables[0].id, category: 'LOCATION', condition: { state: 'IL', city: 'Chicago' }, multiplier: 1.3, priority: 7 },
    { rateTableId: rateTables[0].id, category: 'LOCATION', condition: { state: 'IL', city: 'Springfield' }, multiplier: 0.95, priority: 7 },
    // CLAIMS_HISTORY factors
    { rateTableId: rateTables[0].id, category: 'CLAIMS_HISTORY', condition: { operator: 'EQ', value: 0 }, multiplier: 0.9, priority: 8 },
    { rateTableId: rateTables[0].id, category: 'CLAIMS_HISTORY', condition: { operator: 'GT', value: 2 }, multiplier: 1.5, priority: 10 },
    // DEDUCTIBLE factors
    { rateTableId: rateTables[0].id, category: 'DEDUCTIBLE', condition: { operator: 'GTE', value: 1000 }, multiplier: 0.85, priority: 6 },
    { rateTableId: rateTables[0].id, category: 'DEDUCTIBLE', condition: { operator: 'LTE', value: 250 }, multiplier: 1.15, priority: 6 },
    // COVERAGE_LIMIT factors
    { rateTableId: rateTables[0].id, category: 'COVERAGE_LIMIT', condition: { operator: 'GT', value: 300000 }, multiplier: 1.25, priority: 5 },
    // VEHICLE_AGE factors
    { rateTableId: rateTables[0].id, category: 'VEHICLE_AGE', condition: { operator: 'LT', value: 3 }, multiplier: 1.1, priority: 4 },
    { rateTableId: rateTables[0].id, category: 'VEHICLE_AGE', condition: { operator: 'GT', value: 10 }, multiplier: 0.9, priority: 4 },
    // LOYALTY factors
    { rateTableId: rateTables[0].id, category: 'LOYALTY', condition: { operator: 'GTE', value: 3 }, multiplier: 0.92, priority: 3 },
    { rateTableId: rateTables[0].id, category: 'LOYALTY', condition: { operator: 'GTE', value: 5 }, multiplier: 0.88, priority: 4 },
    // CREDIT_SCORE factors
    { rateTableId: rateTables[0].id, category: 'CREDIT_SCORE', condition: { operator: 'GTE', value: 750 }, multiplier: 0.9, priority: 5 },
    { rateTableId: rateTables[0].id, category: 'CREDIT_SCORE', condition: { operator: 'LT', value: 600 }, multiplier: 1.3, priority: 7 },
    // Homeowners PROPERTY_VALUE factors
    { rateTableId: rateTables[1].id, category: 'PROPERTY_VALUE', condition: { operator: 'GT', value: 500000 }, multiplier: 1.3, priority: 8 },
    { rateTableId: rateTables[1].id, category: 'PROPERTY_VALUE', condition: { operator: 'LTE', value: 200000 }, multiplier: 0.85, priority: 6 },
    { rateTableId: rateTables[1].id, category: 'CLAIMS_HISTORY', condition: { operator: 'GT', value: 1 }, multiplier: 1.4, priority: 9 },
    { rateTableId: rateTables[1].id, category: 'DEDUCTIBLE', condition: { operator: 'GTE', value: 2500 }, multiplier: 0.8, priority: 6 },
    // Commercial Auto factors
    { rateTableId: rateTables[4].id, category: 'CLAIMS_HISTORY', condition: { operator: 'GT', value: 3 }, multiplier: 1.6, priority: 10 },
    { rateTableId: rateTables[4].id, category: 'COVERAGE_LIMIT', condition: { operator: 'GT', value: 1000000 }, multiplier: 1.35, priority: 7 },
    // Workers Comp factors
    { rateTableId: rateTables[7].id, category: 'CLAIMS_HISTORY', condition: { operator: 'GT', value: 2 }, multiplier: 1.5, priority: 10 },
    { rateTableId: rateTables[7].id, category: 'COVERAGE_LIMIT', condition: { operator: 'GT', value: 500000 }, flatAmount: 500, priority: 5 },
  ];

  await prisma.rateFactor.createMany({ data: rateFactorsData });
  console.log('Created rate factors:', rateFactorsData.length);

  // ==================== ESCALATIONS (15) ====================
  const escalationsData = [
    { type: 'CLAIM', priority: 'CRITICAL', status: 'OPEN', title: 'High-value claim requires manual review', description: 'Claim CLM-2024-00001 flagged by AI with HIGH_RISK classification', slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), entityType: 'claim', entityId: claims[0]?.id || 'unknown', assignedTo: agents[0].id },
    { type: 'CLAIM', priority: 'HIGH', status: 'OPEN', title: 'Suspicious claim activity detected', description: 'Multiple claims filed within 30-day window', slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), entityType: 'claim', entityId: claims[1]?.id || 'unknown', assignedTo: agents[0].id },
    { type: 'COMPLAINT', priority: 'HIGH', status: 'IN_PROGRESS', title: 'Customer complaint - billing dispute', description: 'Customer reports incorrect premium charged', slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), entityType: 'client', entityId: personalClients[0].id, assignedTo: agents[0].id },
    { type: 'COMPLIANCE', priority: 'CRITICAL', status: 'OPEN', title: 'Agent license expiring', description: 'Agent license expires in 15 days - renewal required', slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), entityType: 'user', entityId: agents[0].id, assignedTo: agents[0].id },
    { type: 'PAYMENT', priority: 'MEDIUM', status: 'OPEN', title: 'Payment retry failed 3 times', description: 'Client payment has failed 3 consecutive retry attempts', slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), entityType: 'client', entityId: personalClients[3].id, assignedTo: agents[0].id },
    { type: 'CLAIM', priority: 'LOW', status: 'RESOLVED', title: 'Minor claim documentation missing', description: 'Photos not yet uploaded for fender bender claim', slaDeadline: new Date(Date.now() - 24 * 60 * 60 * 1000), entityType: 'claim', entityId: claims[3]?.id || 'unknown', assignedTo: agents[0].id, resolution: 'Documents received and uploaded' },
    { type: 'RENEWAL', priority: 'MEDIUM', status: 'OPEN', title: 'High-value policy renewal at risk', description: 'Retention score below 60% for multi-policy client', slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), entityType: 'policy', entityId: policies[0]?.id || 'unknown', assignedTo: agents[0].id },
    { type: 'COMPLAINT', priority: 'HIGH', status: 'OPEN', title: 'Regulatory complaint received', description: 'State DOI forwarded consumer complaint', slaDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), entityType: 'client', entityId: personalClients[5].id, assignedTo: agents[0].id },
    { type: 'CLAIM', priority: 'MEDIUM', status: 'IN_PROGRESS', title: 'Claim exceeds reserve amount', description: 'Estimated loss now exceeds initial reserve by 50%', slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), entityType: 'claim', entityId: claims[5]?.id || 'unknown', assignedTo: agents[0].id },
    { type: 'PAYMENT', priority: 'LOW', status: 'RESOLVED', title: 'Duplicate payment detected', description: 'Client charged twice for same premium installment', slaDeadline: new Date(Date.now() - 48 * 60 * 60 * 1000), entityType: 'client', entityId: personalClients[7].id, assignedTo: agents[0].id, resolution: 'Refund processed' },
    { type: 'UNDERWRITING', priority: 'HIGH', status: 'OPEN', title: 'High-risk underwriting referral', description: 'Commercial auto application with risk score above 60 requires senior review', slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), entityType: 'policy', entityId: policies[5]?.id || 'unknown', assignedTo: agents[0].id },
    { type: 'CLAIM', priority: 'CRITICAL', status: 'OPEN', title: 'Potential fraud detected by AI', description: 'AI flagged inconsistent timeline and documentation in auto claim', slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000), entityType: 'claim', entityId: claims[8]?.id || 'unknown', assignedTo: agents[0].id },
    { type: 'COMPLIANCE', priority: 'HIGH', status: 'IN_PROGRESS', title: 'E&O policy renewal overdue', description: 'Agency E&O insurance policy expired 5 days ago, immediate renewal required', slaDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), entityType: 'user', entityId: agents[0].id, assignedTo: agents[0].id },
    { type: 'OTHER', priority: 'MEDIUM', status: 'OPEN', title: 'Client data discrepancy', description: 'Multiple client records appear to be duplicates requiring merge review', slaDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000), entityType: 'client', entityId: personalClients[10].id, assignedTo: agents[0].id },
    { type: 'PAYMENT', priority: 'HIGH', status: 'OPEN', title: 'Large refund requires approval', description: 'Policy cancellation refund of $4,500 requires owner approval before processing', slaDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000), entityType: 'policy', entityId: policies[32]?.id || 'unknown', assignedTo: agents[0].id },
  ];

  await prisma.escalation.createMany({ data: escalationsData });
  console.log('Created escalations:', escalationsData.length);

  // ==================== COMPLAINTS (15) ====================
  const complaintsData = [
    { complaintNumber: 'CMP-2025-00001', status: 'OPEN', source: 'PHONE', category: 'BILLING', summary: 'Incorrect premium on renewal', description: 'Customer states the renewal premium is 30% higher than quoted', aiClassification: 'BILLING_DISPUTE', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), clientId: personalClients[0].id },
    { complaintNumber: 'CMP-2025-00002', status: 'INVESTIGATING', source: 'EMAIL', category: 'CLAIMS', summary: 'Slow claim processing', description: 'Client has waited 45 days for claim resolution with no update', aiClassification: 'SERVICE_DELAY', aiSentiment: 'VERY_NEGATIVE', slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), clientId: personalClients[2].id },
    { complaintNumber: 'CMP-2025-00003', status: 'OPEN', source: 'PORTAL', category: 'SERVICE', summary: 'Cannot access customer portal', description: 'Customer reports login issues and password reset not working', aiClassification: 'TECHNICAL_ISSUE', aiSentiment: 'NEUTRAL', slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), clientId: personalClients[4].id },
    { complaintNumber: 'CMP-2025-00004', status: 'RESOLVED', source: 'REGULATORY', category: 'COVERAGE', summary: 'DOI complaint - coverage denial', description: 'State department forwarded complaint about denied claim', aiClassification: 'REGULATORY_COMPLAINT', aiSentiment: 'VERY_NEGATIVE', slaDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), clientId: personalClients[6].id, resolution: 'Claim re-reviewed and approved after additional documentation' },
    { complaintNumber: 'CMP-2025-00005', status: 'OPEN', source: 'PHONE', category: 'BILLING', summary: 'Unauthorized premium increase', description: 'Premium increased without prior notice', aiClassification: 'BILLING_DISPUTE', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), clientId: personalClients[8].id },
    { complaintNumber: 'CMP-2025-00006', status: 'INVESTIGATING', source: 'EMAIL', category: 'SERVICE', summary: 'Agent unresponsive', description: 'Customer reports multiple unanswered calls and emails to assigned agent', aiClassification: 'SERVICE_QUALITY', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), clientId: commercialClients[0].id },
    { complaintNumber: 'CMP-2025-00007', status: 'OPEN', source: 'PORTAL', category: 'CLAIMS', summary: 'Claim underpaid', description: 'Settlement amount significantly lower than estimated repair cost', aiClassification: 'SETTLEMENT_DISPUTE', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), clientId: personalClients[10].id },
    { complaintNumber: 'CMP-2025-00008', status: 'RESOLVED', source: 'PHONE', category: 'SERVICE', summary: 'Policy cancellation issue', description: 'Client requested cancellation but policy still active and being billed', aiClassification: 'CANCELLATION_ISSUE', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), clientId: personalClients[12].id, resolution: 'Policy cancelled retroactively and premium refund issued' },
    { complaintNumber: 'CMP-2025-00009', status: 'OPEN', source: 'EMAIL', category: 'AGENT_CONDUCT', summary: 'Misrepresentation of coverage', description: 'Client claims agent promised coverage for flood damage which was not included in the policy', aiClassification: 'MISREPRESENTATION', aiSentiment: 'VERY_NEGATIVE', slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), clientId: personalClients[14].id },
    { complaintNumber: 'CMP-2025-00010', status: 'INVESTIGATING', source: 'PHONE', category: 'BILLING', summary: 'Double-charged premium', description: 'Client bank account debited twice for the same monthly premium payment', aiClassification: 'BILLING_ERROR', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), clientId: personalClients[1].id },
    { complaintNumber: 'CMP-2025-00011', status: 'OPEN', source: 'MAIL', category: 'COVERAGE', summary: 'Denial of valid claim', description: 'Water damage claim denied citing exclusion client disputes', aiClassification: 'COVERAGE_DISPUTE', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), clientId: personalClients[3].id },
    { complaintNumber: 'CMP-2025-00012', status: 'RESOLVED', source: 'PORTAL', category: 'SERVICE', summary: 'Delayed policy documents', description: 'New policy documents not received after 60 days', aiClassification: 'SERVICE_DELAY', aiSentiment: 'NEUTRAL', slaDeadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), clientId: commercialClients[2].id, resolution: 'Documents resent via email and physical mail' },
    { complaintNumber: 'CMP-2025-00013', status: 'OPEN', source: 'REGULATORY', category: 'OTHER', summary: 'DOI market conduct inquiry', description: 'State DOI requesting documentation for market conduct examination', aiClassification: 'REGULATORY_INQUIRY', aiSentiment: 'NEUTRAL', slaDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), clientId: null },
    { complaintNumber: 'CMP-2025-00014', status: 'INVESTIGATING', source: 'EMAIL', category: 'CLAIMS', summary: 'Adjuster not responding', description: 'Carrier adjuster has not contacted insured 3 weeks after claim filing', aiClassification: 'SERVICE_DELAY', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), clientId: personalClients[9].id },
    { complaintNumber: 'CMP-2025-00015', status: 'CLOSED', source: 'PHONE', category: 'BILLING', summary: 'Incorrect cancellation fee', description: 'Client charged $200 short-rate cancellation fee but policy was mid-term cancelled by carrier', aiClassification: 'BILLING_DISPUTE', aiSentiment: 'NEGATIVE', slaDeadline: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), clientId: personalClients[11].id, resolution: 'Cancellation fee waived and refund issued' },
  ];

  await prisma.complaint.createMany({ data: complaintsData });
  console.log('Created complaints:', complaintsData.length);

  // ==================== COMPLAINT NOTES (15) ====================
  const createdComplaints = await prisma.complaint.findMany({ take: 5 });
  const complaintNotesData = createdComplaints.flatMap((complaint, i) => [
    { complaintId: complaint.id, content: 'Received complaint and assigned to owner for investigation.', isInternal: true, createdBy: admin.name },
    { complaintId: complaint.id, content: 'Called customer to acknowledge complaint and gather additional details.', isInternal: false, createdBy: agents[i % agents.length].name },
    { complaintId: complaint.id, content: 'Investigating root cause. Reviewing policy and billing records.', isInternal: true, createdBy: agents[i % agents.length].name },
  ]);

  await prisma.complaintNote.createMany({ data: complaintNotesData });
  console.log('Created complaint notes:', complaintNotesData.length);

  // ==================== PAYMENT SCHEDULES (15) ====================
  const paymentSchedulesData = policies.slice(0, 15).map((policy, i) => {
    const dueDate = new Date(today.getFullYear(), today.getMonth() + (i % 3) - 1, 1 + (i * 2));
    const scheduleStatuses = ['SCHEDULED', 'REMINDED', 'OVERDUE', 'PAID', 'FAILED', 'SCHEDULED', 'PAID', 'SCHEDULED', 'REMINDED', 'PAID', 'SCHEDULED', 'OVERDUE', 'PAID', 'CANCELLED', 'SCHEDULED'];
    return {
      policyId: policy.id,
      clientId: policy.clientId,
      amount: Math.round(Number(policy.premium) / ([1, 2, 4, 6, 12][i % 5])),
      dueDate,
      status: scheduleStatuses[i % scheduleStatuses.length],
      remindersSent: scheduleStatuses[i % scheduleStatuses.length] === 'REMINDED' ? 1 : scheduleStatuses[i % scheduleStatuses.length] === 'OVERDUE' ? 2 : 0,
      retryCount: scheduleStatuses[i % scheduleStatuses.length] === 'FAILED' ? 3 : 0,
      gracePeriodEnd: new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 15),
    };
  });

  await prisma.paymentSchedule.createMany({ data: paymentSchedulesData });
  console.log('Created payment schedules:', paymentSchedulesData.length);

  // ==================== SIGNATURE AUDITS (15) ====================
  const createdProposals = await prisma.proposal.findMany({ take: 15 });
  const signatureAuditsData = createdProposals.flatMap((proposal, i) => {
    const audits = [
      { proposalId: proposal.id, action: 'VIEWED', signerName: `Client ${i + 1}`, signerEmail: `client${i + 1}@email.com`, ipAddress: `192.168.1.${100 + i}`, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    ];
    if (i % 2 === 0) {
      audits.push({ proposalId: proposal.id, action: 'SIGNED', signerName: `Client ${i + 1}`, signerEmail: `client${i + 1}@email.com`, ipAddress: `192.168.1.${100 + i}`, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' });
    }
    return audits;
  });

  // Take exactly 15
  const finalAudits = signatureAuditsData.slice(0, 15);
  await prisma.signatureAudit.createMany({ data: finalAudits });
  console.log('Created signature audits:', finalAudits.length);

  // ==================== CALL LOGS (15) ====================
  const callLogData = Array.from({ length: 15 }, (_, i) => ({
    callSid: `CA${String(i + 1).padStart(32, '0')}`,
    from: `+1555${String(1000 + i)}`,
    to: '+15550100',
    direction: i % 3 === 0 ? 'outbound' : 'inbound',
    duration: 30 + (i * 45),
    status: ['completed', 'completed', 'completed', 'failed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'][i],
    transcription: i % 2 === 0 ? `Customer called regarding ${['policy renewal', 'claim status', 'billing question', 'new quote request', 'coverage inquiry', 'payment question', 'endorsement request', 'cancellation request'][i % 8]}. ${['Issue resolved on the call.', 'Follow-up scheduled.', 'Transferred to claims department.', 'Quote sent via email.'][i % 4]}` : null,
  }));

  await prisma.callLog.createMany({ data: callLogData });
  console.log('Created call logs:', callLogData.length);

  console.log('');
  console.log('========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Summary:');
  console.log('  Users: 1 (Agency Owner)');
  console.log('  Carriers: 15');
  console.log('  Households: 15');
  console.log('  Clients: 35 (20 personal + 15 commercial)');
  console.log('  Contacts: 20');
  console.log('  Life Events: 20');
  console.log('  Policies: 55');
  console.log('  Endorsements: 20');
  console.log('  Quotes: 25');
  console.log('  Quote Follow-ups: 20');
  console.log('  Claims: 25');
  console.log('  Claim Communications: 30');
  console.log('  Settlements: 15');
  console.log('  Commissions: 90');
  console.log('  Commission Splits: 15');
  console.log('  Campaigns: 15');
  console.log('  Campaign Recipients: ~30');
  console.log('  Referrals: 15');
  console.log('  Documents: 25');
  console.log('  Activities: 50');
  console.log('  Notifications: 30');
  console.log('  AI Analysis: 15');
  console.log('  Renewal Predictions: 15');
  console.log('  Cross-Sell Recommendations: 20');
  console.log('  Email Templates: 15');
  console.log('  Proposals: 15');
  console.log('  Customer Auth: 5');
  console.log('  Underwriting Rules: 20');
  console.log('  Underwriting Results: 15');
  console.log('  Compliance Rules: 20');
  console.log('  Compliance Checks: 15');
  console.log('  Payments: 15');
  console.log('  Rate Tables: 13');
  console.log('  Rate Factors: 24');
  console.log('  Payment Schedules: 15');
  console.log('  Escalations: 15');
  console.log('  Complaints: 15');
  console.log('  Complaint Notes: 15');
  console.log('  Signature Audits: 15');
  console.log('  Call Logs: 15');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
