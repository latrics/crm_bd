import React from 'react';
import { FileText, FileSpreadsheet, FileImage, File } from 'lucide-react';

export const fmt = n => n >= 100000 ? 'Rs. ' + (n/100000).toFixed(1) + 'L' : 'Rs. ' + (n || 0);
export const fmtBytes = b => b > 1048576 ? (b/1048576).toFixed(1)+' MB' : b > 1024 ? (b/1024).toFixed(1)+' KB' : (b||0)+' B';
export const today = () => new Date().toISOString().slice(0,10);
export const fNum = (obj, ...keys) => { for (const k of keys) { if (obj[k]) obj[k] = Number(obj[k]); } return obj; };
export const FILE_ICONS = { pdf: FileText, doc: FileText, docx: FileText, xls: FileSpreadsheet, xlsx: FileSpreadsheet, ppt: FileImage, pptx: FileImage };
export const fileIcon = (name, className = "w-6 h-6") => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  const IconComponent = FILE_ICONS[ext] || File;
  return React.createElement(IconComponent, { className });
};
