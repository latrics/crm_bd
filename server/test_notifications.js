import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';

// Models
import Lead from './models/Lead.js';
import Deal from './models/Deal.js';
import Tender from './models/Tender.js';
import Notification from './models/Notification.js';
import ApprovalRequest from './models/ApprovalRequest.js';

// Controllers
import { createLead, updateLead, importLeads } from './controllers/leadController.js';
import { updateDeal } from './controllers/dealController.js';
import { createTender, updateTender } from './controllers/tenderController.js';
import { updateApproval } from './controllers/approvalController.js';

dotenv.config();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected! Starting Notification Tests...\n');

  // Helper to retrieve latest notifications for assertion
  const getLatestNotifications = async (limit = 5) => {
    return await Notification.find().sort({ createdAt: -1 }).limit(limit);
  };

  const cleanUp = async () => {
    console.log('Cleaning up test data...');
    await Lead.deleteMany({ company: /TestCompany/ });
    await Deal.deleteMany({ title: /TestCompany/ });
    await Tender.deleteMany({ tender_no: /TST-/ });
    await ApprovalRequest.deleteMany({ recordName: /TestCompany/ });
    // Clean up test notifications
    await Notification.deleteMany({ message: /TestCompany/ });
    await Notification.deleteMany({ message: /TST-/ });
  };

  try {
    await cleanUp();

    console.log('----------------------------------------------------');
    console.log('TEST 1: Lead Creation & Assignment');
    console.log('----------------------------------------------------');
    let leadId;
    {
      const req = {
        body: {
          company: 'TestCompany A',
          email: 'testa@testcompany.com',
          owner: 'Sivaram B',
          decisionMaker: 'Test DM'
        },
        user: { name: 'Test Member', email: 'member@test.com', role: 'member' }
      };
      
      let resolvePromise;
      const done = new Promise(resolve => { resolvePromise = resolve; });
      const res = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromise(); return this; }
      };

      createLead(req, res, (err) => { if (err) { console.error(err); resolvePromise(); } });
      await done;

      const lead = res.jsonData.data;
      leadId = lead._id;
      console.log('Lead created:', lead.company, 'ID:', lead._id);
      
      await sleep(500);
      const notifications = await getLatestNotifications(2);
      console.log('Generated Notifications:');
      notifications.forEach(n => console.log(`  - Type: [${n.type}], User: [${n.recipientUser}], Msg: "${n.message}"`));
    }

    console.log('\n----------------------------------------------------');
    console.log('TEST 2: Lead Reassignment (Sivaram B -> Sureka Suresh)');
    console.log('----------------------------------------------------');
    {
      const req = {
        params: { id: leadId },
        body: {
          owner: 'Sureka Suresh'
        },
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
      };
      
      let resolvePromise;
      const done = new Promise(resolve => { resolvePromise = resolve; });
      const res = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromise(); return this; }
      };

      updateLead(req, res, (err) => { if (err) { console.error(err); resolvePromise(); } });
      await done;
      
      await sleep(500);
      const notifications = await getLatestNotifications(2);
      console.log('Generated Reassignment Notifications:');
      notifications.forEach(n => console.log(`  - Type: [${n.type}], User: [${n.recipientUser}], Msg: "${n.message}"`));
    }

    console.log('\n----------------------------------------------------');
    console.log('TEST 3: Lead CSV Import (3 leads)');
    console.log('----------------------------------------------------');
    {
      const req = {
        body: {
          leads: [
            { company: 'TestCompany Import 1', email: 'imp1@test.com' },
            { company: 'TestCompany Import 2', email: 'imp2@test.com' },
            { company: 'TestCompany Import 3', email: 'imp3@test.com' }
          ]
        },
        user: { name: 'Test Member', email: 'member@test.com', role: 'member' }
      };
      
      let resolvePromise;
      const done = new Promise(resolve => { resolvePromise = resolve; });
      const res = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromise(); return this; }
      };

      importLeads(req, res, (err) => { if (err) { console.error(err); resolvePromise(); } });
      await done;
      
      await sleep(500);
      const notifications = await getLatestNotifications(2);
      console.log('Generated Import Notifications:');
      notifications.forEach(n => console.log(`  - Type: [${n.type}], User: [${n.recipientUser}], Roles: [${n.recipientRole}], Msg: "${n.message}"`));
    }

    console.log('\n----------------------------------------------------');
    console.log('TEST 4: Deal Stage Updates (Conversion -> Negotiation -> Won)');
    console.log('----------------------------------------------------');
    let dealId;
    {
      // Convert lead to Deal (simulate status set to 'Closure')
      const req = {
        params: { id: leadId },
        body: {
          status: 'Closure'
        },
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
      };
      
      let resolvePromise;
      const done = new Promise(resolve => { resolvePromise = resolve; });
      const res = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromise(); return this; }
      };

      updateLead(req, res, (err) => { if (err) { console.error(err); resolvePromise(); } });
      await done;
      
      dealId = res.jsonData.deal._id;
      console.log('Deal Converted. Deal ID:', dealId);
      
      await sleep(500);
      let notifications = await getLatestNotifications(1);
      console.log('Conversion Alert:', notifications[0].message);

      // Now set deal stage to Won
      const dealReq = {
        params: { id: dealId },
        body: {
          stage: 'Won'
        },
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
      };
      
      let resolvePromiseDeal;
      const doneDeal = new Promise(resolve => { resolvePromiseDeal = resolve; });
      const dealRes = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromiseDeal(); return this; }
      };

      updateDeal(dealReq, dealRes, (err) => { if (err) { console.error(err); resolvePromiseDeal(); } });
      await doneDeal;

      await sleep(500);
      notifications = await getLatestNotifications(2);
      console.log('Stage Won Notifications:');
      notifications.forEach(n => console.log(`  - Type: [${n.type}], User: [${n.recipientUser}], Roles: [${n.recipientRole}], Msg: "${n.message}"`));
    }

    console.log('\n----------------------------------------------------');
    console.log('TEST 5: Tender Creation, Assignment & Update');
    console.log('----------------------------------------------------');
    {
      const req = {
        body: {
          tender_no: 'TST-0001',
          authority: 'Test Authority',
          owner: 'Rajib Saikia'
        },
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
      };
      
      let resolvePromiseTender;
      const doneTender = new Promise(resolve => { resolvePromiseTender = resolve; });
      const res = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromiseTender(); return this; }
      };

      createTender(req, res, (err) => { if (err) { console.error(err); resolvePromiseTender(); } });
      await doneTender;
      
      const tender = res.jsonData.data;
      console.log('Tender created:', tender.tender_no);

      await sleep(500);
      let notifications = await getLatestNotifications(2);
      console.log('Tender Creation Notifications:');
      notifications.forEach(n => console.log(`  - Type: [${n.type}], User: [${n.recipientUser}], Msg: "${n.message}"`));

      // Update Tender status to Awarded
      const updateReq = {
        params: { id: tender._id },
        body: {
          status: 'Awarded'
        },
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
      };
      
      let resolvePromiseUpdate;
      const doneUpdate = new Promise(resolve => { resolvePromiseUpdate = resolve; });
      const updateRes = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromiseUpdate(); return this; }
      };

      updateTender(updateReq, updateRes, (err) => { if (err) { console.error(err); resolvePromiseUpdate(); } });
      await doneUpdate;

      await sleep(500);
      notifications = await getLatestNotifications(2);
      console.log('Tender Awarded Notifications:');
      notifications.forEach(n => console.log(`  - Type: [${n.type}], User: [${n.recipientUser}], Roles: [${n.recipientRole}], Msg: "${n.message}"`));
    }

    console.log('\n----------------------------------------------------');
    console.log('TEST 6: Approval Request Confirmation');
    console.log('----------------------------------------------------');
    {
      const appRequest = await ApprovalRequest.create({
        type: 'Delete',
        raisedBy: 'Sureka Suresh',
        recordModel: 'Lead',
        recordId: leadId,
        recordName: 'TestCompany A',
        description: 'Testing deletion request'
      });

      const req = {
        params: { id: appRequest._id },
        body: { status: 'Approved' },
        user: { name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
      };
      
      let resolvePromiseApproval;
      const doneApproval = new Promise(resolve => { resolvePromiseApproval = resolve; });
      const res = {
        status: function(code) { this.statusCode = code; return this; },
        json: function(data) { this.jsonData = data; resolvePromiseApproval(); return this; }
      };

      updateApproval(req, res, (err) => { if (err) { console.error(err); resolvePromiseApproval(); } });
      await doneApproval;

      await sleep(500);
      const notifications = await getLatestNotifications(2);
      console.log('Approval Actioned Notifications:');
      notifications.forEach(n => console.log(`  - Type: [${n.type}], User: [${n.recipientUser}], Msg: "${n.message}"`));
    }

    console.log('\nALL INTEGRATION TESTS RUN SUCCESSFULLY!');

  } catch (error) {
    console.error('Test run failed:', error);
  } finally {
    await cleanUp();
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runTests();
