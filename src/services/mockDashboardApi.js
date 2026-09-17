// Dashboard API adapter. Uses a real HTTP contract when VITE_DASHBOARD_API_URL is configured,
// otherwise falls back to the local mock data used by the Phase 1 frontend.

const getSettings = () => JSON.parse(localStorage.getItem('auth_suite_settings') || '{}');
const delay = (ms = 450) => new Promise((resolve, reject) => {
  const settings = getSettings();
  const networkDelay = settings.networkDelayMs ?? ms;
  globalThis.setTimeout(() => {
    if (settings.forceError) {
      reject(new Error('Simulated Network / Server Error (500)'));
    } else {
      resolve();
    }
  }, networkDelay);
});

const getStoredOrganizations = () => JSON.parse(localStorage.getItem('auth_suite_organizations') || '[]');
const getStoredSessions = () => JSON.parse(localStorage.getItem('auth_suite_sessions') || '[]');

const buildMockDashboard = ({ user, organizationId }) => {
  const organizations = getStoredOrganizations();
  const organization = organizations.find((org) => org.id === organizationId) || organizations[0] || null;
  const sessions = getStoredSessions().filter((session) => session.userId === user?.id);
  const activeSessions = sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
  const memberCount = organization?.members?.length ?? 0;
  const seatsUsed = organization?.billing?.seatsUsed ?? 0;
  const seatsPurchased = organization?.billing?.seatsPurchased ?? 0;
  const securityScore = user?.isVerified ? (user?.mfaEnabled ? 98 : 94) : (user?.mfaEnabled ? 78 : 65);

  return {
    generatedAt: new Date().toISOString(),
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
          domain: organization.primaryDomain,
          domainVerified: organization.isDomainVerified,
          members: memberCount,
          seatsUsed,
          seatsPurchased,
          mfaRequired: organization.mfaRequired,
          logoUrl: organization.logoUrl,
        }
      : null,
    kpis: [
      {
        id: 'security-score',
        label: 'Security score',
        value: securityScore,
        suffix: '/100',
        trend: user?.isVerified ? '+6' : '-4',
        trendLabel: user?.isVerified ? 'vs last review' : 'action required',
        status: user?.isVerified ? 'success' : 'warning',
        description: user?.isVerified ? 'Account controls are passing.' : 'Verify your account to improve coverage.',
      },
      {
        id: 'active-sessions',
        label: 'Active sessions',
        value: activeSessions.length,
        trend: 'Live',
        trendLabel: 'session monitor',
        status: 'info',
        description: 'Signed-in devices currently active.',
      },
      {
        id: 'workspace-members',
        label: 'Workspace members',
        value: memberCount,
        trend: organization ? `${seatsPurchased - seatsUsed}` : '—',
        trendLabel: organization ? 'seats available' : 'no workspace',
        status: 'info',
        description: organization ? 'People with workspace access.' : 'Create a workspace to collaborate.',
      },
      {
        id: 'seat-utilization',
        label: 'Seat utilization',
        value: seatsPurchased ? Math.round((seatsUsed / seatsPurchased) * 100) : 0,
        suffix: '%',
        trend: organization?.plan || 'Free',
        trendLabel: 'current plan',
        status: seatsPurchased && seatsUsed / seatsPurchased > 0.9 ? 'warning' : 'success',
        description: organization ? `${seatsUsed} of ${seatsPurchased} seats are assigned.` : 'Workspace seat usage is unavailable.',
      },
    ],
    activity: organization?.activityLog?.slice(0, 5) ?? [],
    sessions: activeSessions.slice(0, 4).map((session) => ({
      id: session.id,
      deviceName: session.deviceName,
      location: session.location,
      lastActive: session.lastActive,
      isCurrent: session.isCurrent,
    })),
  };
};

const requestDashboard = async ({ user, organizationId }) => {
  const baseUrl = import.meta.env.VITE_DASHBOARD_API_URL;
  if (!baseUrl) return null;

  const url = new URL(baseUrl, window.location.origin);
  if (organizationId) url.searchParams.set('organizationId', organizationId);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(user?.id ? { 'X-User-Id': user.id } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Dashboard request failed (${response.status}).`);
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.kpis)) {
    throw new Error('Dashboard API returned an invalid response.');
  }
  return payload;
};

export const dashboardApi = {
  async getOverview({ user, organizationId } = {}) {
    if (!user) throw new Error('A signed-in user is required to load the dashboard.');

    const remotePayload = await requestDashboard({ user, organizationId });
    if (remotePayload) return remotePayload;

    await delay();
    return buildMockDashboard({ user, organizationId });
  },
};
