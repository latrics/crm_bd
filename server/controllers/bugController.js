import BugReport from '../models/BugReport.js';
import asyncHandler from '../utils/asyncHandler.js';
import { log as auditLog } from '../utils/auditLog.js';

// @desc    Create a new bug report
// @route   POST /api/v1/bugs/report
// @access  Private
export const createBugReport = asyncHandler(async (req, res) => {
  const { title, description, stepsToReproduce, severity, pageUrl, userAgent } = req.body;

  if (!title || !description || !pageUrl || !userAgent) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a title, description, page URL, and user agent.'
    });
  }

  const bugReport = await BugReport.create({
    reportedBy: req.user._id || req.user.id,
    title,
    description,
    stepsToReproduce,
    severity: severity || 'medium',
    pageUrl,
    userAgent
  });

  // Create an audit log entry
  try {
    await auditLog({
      userId: req.user._id || req.user.id,
      action: 'REPORT_BUG',
      entity: 'BugReport',
      entityId: bugReport._id.toString(),
      ip: req.ip,
      meta: {
        title: bugReport.title,
        severity: bugReport.severity
      },
      severity: 'info'
    });
  } catch (auditErr) {
    console.error('Failed to write audit log for bug report:', auditErr);
  }

  res.status(201).json({
    success: true,
    message: 'Thank you! Your bug report has been submitted successfully.',
    data: bugReport
  });
});
