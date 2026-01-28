import { PrismaClient, UserRole, ClientType, ClientStatus, LineOfBusiness, PolicyStatus, QuoteStatus, ClaimStatus, CommissionStatus, CommissionType, CampaignType, CampaignStatus, ActivityType, DocumentType, ContactType, BillingMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive seed...');

  // Check if database is already seeded
  const existingClients = await prisma.client.count();
  if (existingClients > 0) {
    console.log(`Database already contains ${existingClients} clients. Skipping seed.`);
    return;
  }

  // ==================== USERS (6) ====================
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@insureflow.com' },
    update: {},
    create: {
      email: 'admin@insureflow.com',
      password: password,
      name: 'Admin User',
      role: UserRole.ADMIN,
      phone: '555-0100',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@insureflow.com' },
    update: {},
    create: {
      email: 'manager@insureflow.com',
      password: password,
      name: 'Jane Manager',
      role: UserRole.MANAGER,
      phone: '555-0099',
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'john.smith@insureflow.com' },
    update: {},
    create: {
      email: 'john.smith@insureflow.com',
      password: password,
      name: 'John Smith',
      role: UserRole.AGENT,
      phone: '555-0101',
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'sarah.johnson@insureflow.com' },
    update: {},
    create: {
      email: 'sarah.johnson@insureflow.com',
      password: password,
      name: 'Sarah Johnson',
      role: UserRole.AGENT,
      phone: '555-0102',
    },
  });

  const agent3 = await prisma.user.upsert({
    where: { email: 'david.lee@insureflow.com' },
    update: {},
    create: {
      email: 'david.lee@insureflow.com',
      password: password,
      name: 'David Lee',
      role: UserRole.AGENT,
      phone: '555-0104',
    },
  });

  const csr = await prisma.user.upsert({
    where: { email: 'mike.wilson@insureflow.com' },
    update: {},
    create: {
      email: 'mike.wilson@insureflow.com',
      password: password,
      name: 'Mike Wilson',
      role: UserRole.CSR,
      phone: '555-0103',
    },
  });

  const agents = [agent1, agent2, agent3];
  console.log('Created users: 6');

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

  // ==================== POLICIES (35) ====================
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

  // Calculate dates for renewals - ensure at least 15 policies expire within 90 days
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

  const policies = await Promise.all(
    allClients.slice(0, 35).map((client, i) => {
      const expirationDate = getExpirationDate(i);
      const effectiveDate = new Date(expirationDate);
      effectiveDate.setFullYear(effectiveDate.getFullYear() - 1);

      return prisma.policy.create({
        data: {
          policyNumber: `POL-2024-${String(i + 1).padStart(5, '0')}`,
          status: i < 30 ? PolicyStatus.ACTIVE : [PolicyStatus.PENDING, PolicyStatus.EXPIRED, PolicyStatus.CANCELLED, PolicyStatus.NON_RENEWED][i % 4],
          lineOfBusiness: lineOfBusinessOptions[i % lineOfBusinessOptions.length],
          type: `${lineOfBusinessOptions[i % lineOfBusinessOptions.length].replace(/_/g, ' ')} Policy`,
          effectiveDate,
          expirationDate,
          premium: 1000 + (i * 250),
          downPayment: 100 + (i * 25),
          installments: [1, 2, 4, 6, 12][i % 5],
          billingMethod: [BillingMethod.DIRECT, BillingMethod.AGENCY, BillingMethod.PREMIUM_FINANCE][i % 3],
          coverageSummary: { liability: '100/300', deductible: 500 + (i * 100) },
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
  const settlementsData = claims.filter((_, i) => i % 4 === 0).slice(0, 15).map((claim, i) => ({
    claimId: claim.id,
    amount: 1000 + (i * 500),
    type: ['Payment', 'Partial Payment', 'Final Settlement'][i % 3],
    description: `Settlement payment for claim ${claim.claimNumber}`,
    paidDate: new Date(2024, i % 12, 20),
    checkNumber: `CHK-${String(i + 1).padStart(5, '0')}`,
  }));

  await prisma.settlement.createMany({ data: settlementsData });
  console.log('Created settlements:', settlementsData.length);

  // ==================== COMMISSIONS (30) ====================
  const commissionsData = policies.slice(0, 30).map((policy, i) => ({
    status: [CommissionStatus.PENDING, CommissionStatus.EARNED, CommissionStatus.PAID, CommissionStatus.REVERSED, CommissionStatus.CHARGEDBACK][i % 5],
    type: [CommissionType.NEW_BUSINESS, CommissionType.RENEWAL, CommissionType.ENDORSEMENT, CommissionType.OVERRIDE, CommissionType.BONUS][i % 5],
    amount: 100 + (i * 25),
    rate: 10 + (i % 6),
    basePremium: Number(policy.premium),
    earnedDate: i % 2 === 0 ? new Date(2024, i % 12, 15) : null,
    paidDate: i % 4 === 0 ? new Date(2024, i % 12, 28) : null,
    statementDate: i % 3 === 0 ? new Date(2024, i % 12, 1) : null,
    policyId: policy.id,
    agentId: agents[i % agents.length].id,
  }));

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
  const documentsData = [
    ...personalClients.slice(0, 10).map((client, i) => ({
      clientId: client.id,
      type: [DocumentType.ID, DocumentType.APPLICATION, DocumentType.CORRESPONDENCE, DocumentType.OTHER][i % 4],
      name: `Client Document ${i + 1}`,
      fileName: `document_${i + 1}.pdf`,
      fileUrl: `/documents/document_${i + 1}.pdf`,
      fileSize: 100000 + (i * 10000),
      mimeType: 'application/pdf',
      description: `Document for ${client.firstName} ${client.lastName}`,
    })),
    ...policies.slice(0, 10).map((policy, i) => ({
      policyId: policy.id,
      type: [DocumentType.POLICY, DocumentType.ENDORSEMENT][i % 2],
      name: `Policy Document ${i + 1}`,
      fileName: `policy_${i + 1}.pdf`,
      fileUrl: `/documents/policy_${i + 1}.pdf`,
      fileSize: 200000 + (i * 20000),
      mimeType: 'application/pdf',
      description: `Policy document for ${policy.policyNumber}`,
    })),
    ...claims.slice(0, 5).map((claim, i) => ({
      claimId: claim.id,
      type: DocumentType.CLAIM,
      name: `Claim Document ${i + 1}`,
      fileName: `claim_${i + 1}.pdf`,
      fileUrl: `/documents/claim_${i + 1}.pdf`,
      fileSize: 150000 + (i * 15000),
      mimeType: 'application/pdf',
      description: `Claim document for ${claim.claimNumber}`,
    })),
  ];

  await prisma.document.createMany({ data: documentsData });
  console.log('Created documents:', documentsData.length);

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

  console.log('');
  console.log('========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('');
  console.log('Summary:');
  console.log('  Users: 6');
  console.log('  Carriers: 15');
  console.log('  Households: 15');
  console.log('  Clients: 35 (20 personal + 15 commercial)');
  console.log('  Contacts: 20');
  console.log('  Life Events: 20');
  console.log('  Policies: 35');
  console.log('  Endorsements: 20');
  console.log('  Quotes: 25');
  console.log('  Quote Follow-ups: 20');
  console.log('  Claims: 25');
  console.log('  Claim Communications: 30');
  console.log('  Settlements: 15');
  console.log('  Commissions: 30');
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
