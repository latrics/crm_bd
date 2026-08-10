import { Users, Target, Folder, Shield, UserCircle, Settings, HelpCircle, Monitor, AlertTriangle } from 'lucide-react';

export const helpCenterCategories = [
  { id: 'getting-started', label: 'Getting Started', icon: Monitor },
  { id: 'leads', label: 'Leads Management', icon: Users },
  { id: 'deals', label: 'Deals & Opportunities', icon: Target },
  { id: 'tenders', label: 'Tenders & Proposals', icon: Folder },
  { id: 'account-profile', label: 'Account & Profile', icon: UserCircle },
  { id: 'security', label: 'Security & Access', icon: Shield },
  { id: 'admin', label: 'Admin & Settings', icon: Settings },
  { id: 'cautionary-actions', label: 'Cautionary Actions & Serious Attention', icon: AlertTriangle }
];

export const helpCenterArticles = [
  // Getting Started
  {
    id: 'intro',
    category: 'getting-started',
    title: 'Introduction to Latrics CRM',
    tags: ['basics', 'overview', 'dashboard'],
    content: `
Latrics CRM is designed to streamline your business development and sales operations. 

**Key Features:**
- **Dashboard:** Get a high-level overview of your performance, recent activities, and pending tasks.
- **Leads:** Track potential clients from initial contact to qualification.
- **Deals:** Manage qualified opportunities through your sales pipeline until closure.
- **Tenders:** Monitor and manage government or corporate tender submissions.
- **Admin:** Oversee users, roles, and master data (for authorized personnel).

Use the main navigation bar at the top or the sidebars in specific sections to move around the system.
    `
  },
  
  // Leads Management
  {
    id: 'create-lead',
    category: 'leads',
    title: 'How to Create a Lead',
    tags: ['leads', 'create', 'new lead'],
    content: `
1. Navigate to the **Leads** section from the top navigation bar.
2. Click on the **"New Lead"** or **"+"** button.
3. Fill in the required details:
   - **Company Name & Contact:** Basic information about the prospect.
   - **Status:** Usually starts as "Leads" or "Discussion".
   - **Assigned To:** You can assign the lead to yourself or a team member.
   - **Deadline:** Important for tracking follow-ups.
4. Click **Save** or **Create**. The lead will now appear in your pipeline.
    `
  },
  {
    id: 'update-lead',
    category: 'leads',
    title: 'Updating & Advancing Leads',
    tags: ['leads', 'update', 'status', 'stages'],
    content: `
Once a lead is created, you can track its progress:
- **Click** on a lead card to open the detailed view.
- Update the **Status** (e.g., from 'Discussion' to 'Pricing / Quote') as negotiations advance.
- Keep **Notes** updated to track conversations.
- If a lead is successfully qualified and ready for a formal proposal, you can typically advance it or convert it to a **Deal**.
    `
  },

  // Deals Management
  {
    id: 'manage-deals',
    category: 'deals',
    title: 'Managing Deals & Opportunities',
    tags: ['deals', 'pipeline', 'won', 'lost'],
    content: `
Deals represent qualified opportunities where revenue is on the line.

**Deal Stages:**
- **Qualification:** Initial assessment of fit and budget.
- **Proposal:** Sending a formal quote or proposal.
- **Negotiation:** Discussing terms and pricing.
- **Won:** The deal has been signed and secured.
- **Lost:** The prospect decided not to move forward.

Drag and drop deals across stages on the board (if applicable) or update their stage from the detail view. Keeping stages accurate is crucial for accurate revenue forecasting.
    `
  },

  // Tenders
  {
    id: 'track-tenders',
    category: 'tenders',
    title: 'Tracking Tenders & EMDs',
    tags: ['tenders', 'emd', 'jv', 'bids'],
    content: `
The Tenders module helps you track formal bids and government tenders.

**Key Tracking Points:**
- **Tender Details:** Tender ID, authority, and publishing dates.
- **Deadlines:** Closing dates for submissions. 
- **EMD (Earnest Money Deposit):** Track whether the EMD is pending, submitted, or exempted.
- **JV (Joint Venture):** If bidding with a partner, record their details and JV status.

Always keep the **Status** (e.g., Evaluating, Submitted, Won, Lost) updated so management has a clear view of the bidding pipeline.
    `
  },

  // Account & Profile
  {
    id: 'update-profile',
    category: 'account-profile',
    title: 'Updating Your Profile Details',
    tags: ['account', 'profile', 'avatar', 'phone', 'name'],
    content: `
To keep your details current:
1. Go to the **Account** menu by clicking your avatar in the top right.
2. Select **Profile**.
3. Here you can view and request changes to:
   - Your Display Name
   - Phone Number
   - Profile Picture (Avatar)
   
*Note: Critical details like Email, Role, and Department are typically managed by an Administrator.*
    `
  },

  // Security
  {
    id: 'password-security',
    category: 'security',
    title: 'Password & Account Security',
    tags: ['security', 'password', 'reset', 'sessions', 'logout'],
    content: `
Your account security is a top priority.
- **Change Password:** Go to **Account > Security** to update your password. Use a strong, unique password.
- **Active Sessions:** In your Account overview, you can view all devices currently logged in. If you see an unrecognized device, you can log it out remotely using the 3-dots menu.
- **Logout:** Always log out when using a shared or public computer. You can use the "Log out from all devices" option in emergencies.
    `
  },

  // Admin
  {
    id: 'admin-users',
    category: 'admin',
    title: 'Managing Users (Admin Only)',
    tags: ['admin', 'users', 'roles', 'invite'],
    content: `
If you have Administrator privileges:
1. Navigate to the **Admin Panel** via the main navigation.
2. Go to the **Users** section.
3. **Invite Users:** Send invitations to new employees to join the CRM.
4. **Roles & Permissions:** Assign appropriate roles (e.g., Sales Executive, Manager) to control what data users can view and edit.
5. **Deactivate:** You can suspend or deactivate users who no longer need access.
    `
  },

  // Cautionary Actions & Serious Attention
  {
    id: 'hard-reset-safety',
    category: 'cautionary-actions',
    title: 'Super Admin Hard Reset & Data Revocation Safety',
    tags: ['caution', 'hard reset', 'super admin', 'audit log', 'data safety'],
    content: `
**CRITICAL SECURITY & DATA SAFETY NOTICE:**

Super Admins possess high-privilege **Hard Reset** tools for **Audit Logs** and the **Approval Center**.

**1. Data Safety & Automatic Deletion Revocation:**

- When a Manager requests a Lead or Deal deletion, the record is **NOT deleted** upfront—it is queued as a *Pending Approval*.

- Performing a **Hard Reset** on the Approval Center **clears the pending approval tickets and revokes the deletion request by default**.

- **Result:** No underlying Lead, Deal, or Tender records are destroyed during a reset. All business data remains 100% safe and intact.

**2. Permanent Audit Trail Preservation:**

- A Hard Reset can **NEVER** be performed anonymously.

- Whenever a Super Admin triggers a reset, the system automatically writes an **immutable log entry** into the database recording:
  - **Actor:** Name, Email, and Role of the Super Admin.
  - **Action:** HARD_RESET.
  - **Timestamp & IP Address:** Exact time and origin of execution.

- This entry remains permanently in the system audit trail even after historical logs are cleared.
    `
  },

  {
    id: 'approval-workflows-caution',
    category: 'cautionary-actions',
    title: 'Handling Record Deletions & Approval Escalations',
    tags: ['caution', 'approvals', 'deletion', 'revocation', 'permissions'],
    content: `
**OPERATIONAL CAUTION FOR ADMINS & MANAGERS:**

- **Manager Deletion Requests:** Managers cannot permanently delete records directly. Deletion requests require explicit Super Admin / Admin authorization in the Approval Center.

- **Record Destruction Warning:** Once a deletion request is explicitly **Approved**, the record (and associated pipeline metrics) is permanently deleted from MongoDB.

- **Bulk Action Review:** Always review bulk approval selections carefully before clicking *Approve All*. If in doubt, reject or request clarification from the team member who raised the ticket.

- **Revocation:** If an approval ticket is rejected or hard reset, the record remains active in the CRM pipeline without data loss.
    `
  }
];
