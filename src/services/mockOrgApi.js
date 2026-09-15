// Mock Organization & Workspace API Service with localStorage persistence

const STORAGE_KEY_ORGS = 'auth_suite_organizations';

const seedOrganizations = [
  {
    id: 'org_1',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    primaryDomain: 'acme.com',
    isDomainVerified: true,
    industry: 'Technology & Software',
    companySize: '50-249 employees',
    supportEmail: 'support@acme.com',
    billingEmail: 'billing@acme.com',
    plan: 'Enterprise',
    mfaRequired: true,
    allowedDomains: ['acme.com', 'acmelabs.com'],
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    members: [
      {
        id: 'mem_1',
        userId: 'user_101',
        name: 'Alex Vance',
        email: 'alex@example.com',
        role: 'Owner',
        status: 'Active',
        joinedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'mem_2',
        userId: 'user_102',
        name: 'Jordan Lee',
        email: 'jordan@example.com',
        role: 'Admin',
        status: 'Active',
        joinedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'mem_3',
        userId: 'user_103',
        name: 'Sarah Connor',
        email: 'sarah@acme.com',
        role: 'Member',
        status: 'Active',
        joinedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'mem_4',
        userId: 'user_104',
        name: 'Marcus Wright',
        email: 'marcus@acme.com',
        role: 'Billing',
        status: 'Invited',
        joinedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      }
    ],
    billing: {
      seatsPurchased: 25,
      seatsUsed: 4,
      billingCycle: 'Annual',
      renewalDate: '2027-01-15',
      invoices: [
        { id: 'inv_9012', date: '2026-01-15', amount: '$499.00', status: 'Paid', pdfUrl: '#' },
        { id: 'inv_8055', date: '2025-01-15', amount: '$499.00', status: 'Paid', pdfUrl: '#' }
      ]
    },
    activityLog: [
      { id: 'act_1', action: 'Enforced MFA policy', user: 'Alex Vance', timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
      { id: 'act_2', action: 'Invited Marcus Wright (Billing)', user: 'Jordan Lee', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
      { id: 'act_3', action: 'Verified domain acme.com', user: 'Alex Vance', timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'org_2',
    name: 'Nexus Labs',
    slug: 'nexus-labs',
    logoUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=120&auto=format&fit=crop&q=80',
    primaryDomain: 'nexuslabs.io',
    isDomainVerified: false,
    industry: 'Artificial Intelligence',
    companySize: '10-49 employees',
    supportEmail: 'contact@nexuslabs.io',
    billingEmail: 'finance@nexuslabs.io',
    plan: 'Pro',
    mfaRequired: false,
    allowedDomains: ['nexuslabs.io'],
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    members: [
      {
        id: 'mem_201',
        userId: 'user_101',
        name: 'Alex Vance',
        email: 'alex@example.com',
        role: 'Admin',
        status: 'Active',
        joinedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'mem_202',
        userId: 'user_105',
        name: 'Elena Rostova',
        email: 'elena@nexuslabs.io',
        role: 'Owner',
        status: 'Active',
        joinedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
      }
    ],
    billing: {
      seatsPurchased: 10,
      seatsUsed: 2,
      billingCycle: 'Monthly',
      renewalDate: '2026-10-01',
      invoices: [
        { id: 'inv_3301', date: '2026-09-01', amount: '$49.00', status: 'Paid', pdfUrl: '#' }
      ]
    },
    activityLog: [
      { id: 'act_201', action: 'Created organization workspace', user: 'Elena Rostova', timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() }
    ]
  }
];

const initOrgsStorage = () => {
  if (!localStorage.getItem(STORAGE_KEY_ORGS)) {
    localStorage.setItem(STORAGE_KEY_ORGS, JSON.stringify(seedOrganizations));
  }
};

initOrgsStorage();

const getStoredOrgs = () => JSON.parse(localStorage.getItem(STORAGE_KEY_ORGS) || '[]');
const setStoredOrgs = (orgs) => localStorage.setItem(STORAGE_KEY_ORGS, JSON.stringify(orgs));

const mockDelay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const mockOrgApi = {
  // Fetch all organizations user belongs to
  async getUserOrganizations(userEmail) {
    await mockDelay();
    const orgs = getStoredOrgs();
    if (!userEmail) return [];
    
    return orgs.filter(org => 
      org.members.some(m => m.email.toLowerCase() === userEmail.toLowerCase())
    );
  },

  // Get single organization by ID or slug
  async getOrganization(idOrSlug) {
    await mockDelay(300);
    const orgs = getStoredOrgs();
    const org = orgs.find(o => o.id === idOrSlug || o.slug === idOrSlug);
    if (!org) {
      throw new Error('Organization not found.');
    }
    return org;
  },

  // Create new Organization
  async createOrganization({ name, slug, industry, companySize, supportEmail, billingEmail, plan, mfaRequired, logoUrl, primaryDomain, creatorUser }) {
    await mockDelay(600);
    const orgs = getStoredOrgs();

    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `org-${Date.now()}`;

    if (orgs.some(o => o.slug === cleanSlug)) {
      throw new Error(`Organization URL slug "${cleanSlug}" is already taken.`);
    }

    const newOrg = {
      id: `org_${Date.now()}`,
      name,
      slug: cleanSlug,
      logoUrl: logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      primaryDomain: primaryDomain || `${cleanSlug}.com`,
      isDomainVerified: false,
      industry: industry || 'Technology',
      companySize: companySize || '1-9 employees',
      supportEmail: supportEmail || creatorUser?.email || '',
      billingEmail: billingEmail || creatorUser?.email || '',
      plan: plan || 'Free',
      mfaRequired: !!mfaRequired,
      allowedDomains: primaryDomain ? [primaryDomain] : [],
      createdAt: new Date().toISOString(),
      members: [
        {
          id: `mem_${Date.now()}`,
          userId: creatorUser?.id || `user_${Date.now()}`,
          name: creatorUser?.name || 'Workspace Creator',
          email: creatorUser?.email || 'owner@example.com',
          role: 'Owner',
          status: 'Active',
          joinedAt: new Date().toISOString()
        }
      ],
      billing: {
        seatsPurchased: plan === 'Enterprise' ? 25 : plan === 'Pro' ? 10 : 5,
        seatsUsed: 1,
        billingCycle: 'Monthly',
        renewalDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        invoices: []
      },
      activityLog: [
        {
          id: `act_${Date.now()}`,
          action: 'Organization workspace created',
          user: creatorUser?.name || 'Workspace Creator',
          timestamp: new Date().toISOString()
        }
      ]
    };

    orgs.push(newOrg);
    setStoredOrgs(orgs);
    return newOrg;
  },

  // Update Organization Details
  async updateOrganization(orgId, updateData, updatingUser) {
    await mockDelay(500);
    const orgs = getStoredOrgs();
    const index = orgs.findIndex(o => o.id === orgId);

    if (index === -1) throw new Error('Organization not found.');

    const updatedOrg = {
      ...orgs[index],
      ...updateData
    };

    // Record activity
    updatedOrg.activityLog.unshift({
      id: `act_${Date.now()}`,
      action: 'Updated organization settings & details',
      user: updatingUser?.name || 'Admin User',
      timestamp: new Date().toISOString()
    });

    orgs[index] = updatedOrg;
    setStoredOrgs(orgs);
    return updatedOrg;
  },

  // Invite Member to Organization
  async inviteMember(orgId, { name, email, role = 'Member' }, inviterUser) {
    await mockDelay(400);
    const orgs = getStoredOrgs();
    const orgIndex = orgs.findIndex(o => o.id === orgId);

    if (orgIndex === -1) throw new Error('Organization not found.');

    const org = orgs[orgIndex];
    if (org.members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
      throw new Error(`User with email "${email}" is already a member or invited to this organization.`);
    }

    const newMember = {
      id: `mem_${Date.now()}`,
      userId: `user_inv_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      role,
      status: 'Invited',
      joinedAt: new Date().toISOString()
    };

    org.members.push(newMember);
    org.billing.seatsUsed = org.members.length;
    org.activityLog.unshift({
      id: `act_${Date.now()}`,
      action: `Invited ${email} as ${role}`,
      user: inviterUser?.name || 'Admin User',
      timestamp: new Date().toISOString()
    });

    setStoredOrgs(orgs);
    return { member: newMember, org };
  },

  // Update Member Role
  async updateMemberRole(orgId, memberId, newRole, updaterUser) {
    await mockDelay(300);
    const orgs = getStoredOrgs();
    const orgIndex = orgs.findIndex(o => o.id === orgId);

    if (orgIndex === -1) throw new Error('Organization not found.');

    const org = orgs[orgIndex];
    const memberIndex = org.members.findIndex(m => m.id === memberId);

    if (memberIndex === -1) throw new Error('Member not found in organization.');

    const member = org.members[memberIndex];
    const oldRole = member.role;
    member.role = newRole;

    org.activityLog.unshift({
      id: `act_${Date.now()}`,
      action: `Changed ${member.name}'s role from ${oldRole} to ${newRole}`,
      user: updaterUser?.name || 'Admin User',
      timestamp: new Date().toISOString()
    });

    setStoredOrgs(orgs);
    return org;
  },

  // Remove Member from Organization
  async removeMember(orgId, memberId, removerUser) {
    await mockDelay(300);
    const orgs = getStoredOrgs();
    const orgIndex = orgs.findIndex(o => o.id === orgId);

    if (orgIndex === -1) throw new Error('Organization not found.');

    const org = orgs[orgIndex];
    const removedMember = org.members.find(m => m.id === memberId);

    if (!removedMember) throw new Error('Member not found in organization.');

    org.members = org.members.filter(m => m.id !== memberId);
    org.billing.seatsUsed = org.members.length;

    org.activityLog.unshift({
      id: `act_${Date.now()}`,
      action: `Removed ${removedMember.name} (${removedMember.email}) from workspace`,
      user: removerUser?.name || 'Admin User',
      timestamp: new Date().toISOString()
    });

    setStoredOrgs(orgs);
    return org;
  }
};
