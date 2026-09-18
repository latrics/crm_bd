import React from 'react';
import { FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';

export const fmt = n => {
  const num = Number(n) || 0;
  return 'Rs. ' + new Intl.NumberFormat('en-IN').format(num);
};
export const fmtBytes = b => b > 1048576 ? (b/1048576).toFixed(1)+' MB' : b > 1024 ? (b/1024).toFixed(1)+' KB' : (b||0)+' B';
export const today = () => new Date().toISOString().slice(0,10);
export const fNum = (obj, ...keys) => { for (const k of keys) { if (obj[k]) obj[k] = Number(obj[k]); } return obj; };
export const FILE_ICONS = { pdf: FileText, doc: FileText, docx: FileText, xls: FileSpreadsheet, xlsx: FileSpreadsheet, ppt: FileImage, pptx: FileImage };
export const fileIcon = (name, className = "w-6 h-6") => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const IconComponent = FILE_ICONS[ext] || File;
  return React.createElement(IconComponent, { className });
};

export const getOwnerDisplayName = (rawOwner, ownersList = []) => {
  if (!rawOwner || !rawOwner.trim()) return '';
  const trimmed = rawOwner.trim();

  // Helper to convert email usernames or dot/underscore names into Title Case Full Names
  const formatFullName = (str) => {
    let clean = (str || '').trim();
    if (clean.includes('@')) {
      clean = clean.split('@')[0];
    }
    return clean
      .split(/[._\-\s]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  // 1. Check matching user in owners list (by name, email, or email username)
  if (Array.isArray(ownersList) && ownersList.length > 0) {
    const matched = ownersList.find(o => {
      if (!o) return false;
      const oName = (o.name || '').trim().toLowerCase();
      const oEmail = (o.email || '').trim().toLowerCase();
      const oEmailUser = oEmail.split('@')[0];
      const target = trimmed.toLowerCase();
      const targetUser = target.includes('@') ? target.split('@')[0] : target;

      return (
        oName === target ||
        oEmail === target ||
        oEmailUser === target ||
        oEmailUser === targetUser ||
        target.replace(/[._-\s]/g, '') === oName.replace(/[._-\s]/g, '') ||
        target.replace(/[._-\s]/g, '') === oEmailUser.replace(/[._-\s]/g, '')
      );
    });

    if (matched) {
      if (matched.email) {
        try {
          const stored = JSON.parse(localStorage.getItem(`latrics_crm_user_profile_${matched.email.toLowerCase()}`) || '{}');
          if (stored && stored.name && stored.name.trim()) {
            return formatFullName(stored.name);
          }
        } catch (e) {}
      }
      if (matched.name && matched.name.trim()) {
        return formatFullName(matched.name);
      }
    }
  }

  // 2. Check localStorage for direct email matches
  try {
    const emailKey = trimmed.toLowerCase();
    if (emailKey.includes('@')) {
      const stored = JSON.parse(localStorage.getItem(`latrics_crm_user_profile_${emailKey}`) || '{}');
      if (stored && stored.name && stored.name.trim()) {
        return formatFullName(stored.name);
      }
    }
  } catch (e) {}

  // 3. Fallback: Format raw string to Full Name
  return formatFullName(trimmed);
};
