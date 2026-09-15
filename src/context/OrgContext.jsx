import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockOrgApi } from '../services/mockOrgApi';
import { useAuth } from './AuthContext';

const OrgContext = createContext(null);
const ACTIVE_ORG_KEY = 'auth_suite_active_org_id';

export const OrgProvider = ({ children }) => {
  const { user, showToast } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  const loadOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrg(null);
      setIsLoadingOrgs(false);
      return;
    }

    try {
      setIsLoadingOrgs(true);
      const userOrgs = await mockOrgApi.getUserOrganizations(user.email);
      setOrganizations(userOrgs);

      const savedOrgId = localStorage.getItem(ACTIVE_ORG_KEY);
      const foundOrg = userOrgs.find(o => o.id === savedOrgId) || userOrgs[0] || null;
      setActiveOrg(foundOrg);
      if (foundOrg) {
        localStorage.setItem(ACTIVE_ORG_KEY, foundOrg.id);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
      showToast('Could not load organizations.', 'error');
    } finally {
      setIsLoadingOrgs(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const switchActiveOrg = (orgId) => {
    const target = organizations.find(o => o.id === orgId);
    if (target) {
      setActiveOrg(target);
      localStorage.setItem(ACTIVE_ORG_KEY, target.id);
      showToast(`Switched workspace to ${target.name}`, 'info');
    }
  };

  const createOrg = async (formData) => {
    try {
      const newOrg = await mockOrgApi.createOrganization({
        ...formData,
        creatorUser: user
      });
      setOrganizations(prev => [...prev, newOrg]);
      setActiveOrg(newOrg);
      localStorage.setItem(ACTIVE_ORG_KEY, newOrg.id);
      showToast(`Organization "${newOrg.name}" created successfully!`, 'success', 'Workspace Ready');
      return newOrg;
    } catch (err) {
      showToast(err.message, 'error', 'Organization Creation Failed');
      throw err;
    }
  };

  const updateOrg = async (orgId, updateData) => {
    try {
      const updatedOrg = await mockOrgApi.updateOrganization(orgId, updateData, user);
      setOrganizations(prev => prev.map(o => o.id === orgId ? updatedOrg : o));
      if (activeOrg?.id === orgId) {
        setActiveOrg(updatedOrg);
      }
      showToast('Organization settings updated successfully.', 'success', 'Changes Saved');
      return updatedOrg;
    } catch (err) {
      showToast(err.message, 'error', 'Update Failed');
      throw err;
    }
  };

  const inviteMember = async (orgId, memberData) => {
    try {
      const result = await mockOrgApi.inviteMember(orgId, memberData, user);
      setOrganizations(prev => prev.map(o => o.id === orgId ? result.org : o));
      if (activeOrg?.id === orgId) {
        setActiveOrg(result.org);
      }
      showToast(`Invitation sent to ${memberData.email}`, 'success', 'Member Invited');
      return result;
    } catch (err) {
      showToast(err.message, 'error', 'Invite Failed');
      throw err;
    }
  };

  const updateMemberRole = async (orgId, memberId, newRole) => {
    try {
      const updatedOrg = await mockOrgApi.updateMemberRole(orgId, memberId, newRole, user);
      setOrganizations(prev => prev.map(o => o.id === orgId ? updatedOrg : o));
      if (activeOrg?.id === orgId) {
        setActiveOrg(updatedOrg);
      }
      showToast(`Member role updated to ${newRole}`, 'success', 'Role Updated');
      return updatedOrg;
    } catch (err) {
      showToast(err.message, 'error', 'Role Update Failed');
      throw err;
    }
  };

  const removeMember = async (orgId, memberId) => {
    try {
      const updatedOrg = await mockOrgApi.removeMember(orgId, memberId, user);
      setOrganizations(prev => prev.map(o => o.id === orgId ? updatedOrg : o));
      if (activeOrg?.id === orgId) {
        setActiveOrg(updatedOrg);
      }
      showToast('Member removed from workspace.', 'info', 'Member Removed');
      return updatedOrg;
    } catch (err) {
      showToast(err.message, 'error', 'Removal Failed');
      throw err;
    }
  };

  const value = {
    organizations,
    activeOrg,
    isLoadingOrgs,
    loadOrganizations,
    switchActiveOrg,
    createOrg,
    updateOrg,
    inviteMember,
    updateMemberRole,
    removeMember
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
