import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";

import Company from "./models/Company.js";
import Contact from "./models/Contact.js";
import Order from "./models/Order.js";
import Payment from "./models/Payment.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import User from "./models/User.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

const PACKAGES = [
  { id: "starter", name: "Starter Studio", price: 24999 },
  { id: "growth", name: "Growth Studio", price: 49999 },
  { id: "enterprise", name: "Enterprise Studio", price: 89999 }
];

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Abhishek", "Priya", "Rahul", "Neha", "Amit", "Sneha", "Vikram", "Pooja"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Sharma", "Verma", "Patel", "Singh", "Kumar", "Gupta", "Jadhav", "Deshmukh"];
const companySuffixes = ["Enterprises", "Studio", "Labs", "Solutions", "Technologies", "Media", "Group", "Consulting", "Design", "Corp", "Inc"];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDate(year, quarter) {
  let month;
  if (quarter === 1) month = randomInt(0, 2);
  else if (quarter === 2) month = randomInt(3, 5);
  else if (quarter === 3) month = randomInt(6, 8);
  else month = randomInt(9, 11);
  
  const day = randomInt(1, 28);
  const hour = randomInt(9, 17);
  const minute = randomInt(0, 59);
  
  return new Date(year, month, day, hour, minute);
}

function generateRandomRecentDate() {
  const now = new Date();
  const past30Days = new Date(now.getTime() - (randomInt(1, 29) * 24 * 60 * 60 * 1000));
  return past30Days;
}

function getPaymentStatus() {
  const rand = Math.random();
  if (rand < 0.85) return "success";
  if (rand < 0.95) return "pending";
  return "failed";
}

function getProjectStatus(createdAt, isLongTerm) {
  const ageInDays = (new Date() - createdAt) / (1000 * 60 * 60 * 24);
  
  if (isLongTerm) {
    if (ageInDays < 30) return "not_started";
    if (ageInDays < 180) return "in_progress";
    if (ageInDays > 365) return randomChoice(["in_progress", "completed"]); // Ongoing retainers
    return "in_progress";
  }

  if (ageInDays > 120) {
    return randomChoice(["completed", "completed", "completed", "delayed"]); // Mostly completed
  }
  
  if (ageInDays > 45) {
    return randomChoice(["completed", "in_progress", "delayed"]);
  }

  return randomChoice(["not_started", "in_progress"]);
}

async function seed() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);

    await User.deleteMany({ role: "client" });
    await Company.deleteMany({});
    await Contact.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log("Cleared existing client data, companies, contacts, orders, payments, projects, and tasks.");

    const yearsDist = {
      2023: 15,
      2024: 25,
      2025: 35,
      2026: 45
    };

    console.log("Generating highly realistic dataset...");

    let totalCreated = 0;
    const allCompanies = [];

    // Base generation
    for (const [yearStr, count] of Object.entries(yearsDist)) {
      const year = parseInt(yearStr);
      let clientsPerQuarter = Math.ceil(count / 4);

      for (let q = 1; q <= 4; q++) {
        // Stop generating future dates in 2026
        if (year === 2026 && q > 2) continue; 
        
        let quarterCount = clientsPerQuarter;
        // Boost Q2 2026 a bit to have more recent activity
        if (year === 2026 && q === 2) quarterCount += 10; 

        for (let i = 0; i < quarterCount; i++) {
          totalCreated++;
          const firstName = randomChoice(firstNames);
          const lastName = randomChoice(lastNames);
          const companyName = `${lastName} ${randomChoice(companySuffixes)}`;
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${totalCreated}@example.com`;
          const phone = `+9198${randomInt(10000000, 99999999)}`;
          
          let createdAt = generateDate(year, q);
          
          // Inject some "last 30 days" dates specifically for recent activity
          if (year === 2026 && Math.random() > 0.5) {
             createdAt = generateRandomRecentDate();
          }

          const pkg = randomChoice(PACKAGES);
          const isLongTerm = pkg.id === "enterprise" && Math.random() > 0.5;

          // 1. User
          const user = new User({
            name: `${firstName} ${lastName}`,
            email: email,
            password: "hashedpassword123", // Dummy
            role: "user",
            createdAt: createdAt
          });
          await user.save();

          // 2. Company
          const company = new Company({
            id: `COM-${year}-${randomInt(1000, 9999)}`,
            name: companyName,
            contact: `${firstName} ${lastName}`,
            industry: randomChoice(["Technology", "Retail", "Healthcare", "Finance", "Education", "Marketing"]),
            status: "Active",
            projects: 1,
            userId: user._id,
            createdAt: createdAt,
            updatedAt: createdAt
          });
          await company.save();
          allCompanies.push(company);

          // 3. Contact
          const contact = new Contact({
            id: `CON-${year}-${randomInt(1000, 9999)}`,
            name: `${firstName} ${lastName}`,
            email: email,
            phone: phone,
            company: companyName,
            designation: randomChoice(["CEO", "Founder", "Director", "Manager"]),
            createdAt: createdAt,
            updatedAt: createdAt
          });
          await contact.save();

          // 4. Order
          const order = new Order({
            package: {
              id: pkg.id,
              name: pkg.name,
              price: pkg.price,
              total: pkg.price
            },
            customer: {
              firstName,
              lastName,
              customerName: `${firstName} ${lastName}`,
              customerPhone: phone,
              customerEmail: email,
              customerCompany: companyName
            },
            payment: {
              status: "paid",
              invoiceId: `INV-${year}-${randomInt(10000, 99999)}`
            },
            createdAt: createdAt,
            updatedAt: createdAt
          });
          await order.save();

          // 5. Payment
          const paymentStatus = getPaymentStatus();
          const payment = new Payment({
            id: `PAY-${year}-${randomInt(1000, 9999)}`,
            paymentId: `pay_${crypto.randomBytes(6).toString("hex")}`,
            sourceOrderId: order._id,
            companyId: company._id,
            clientId: user._id,
            company: companyName,
            client: `${firstName} ${lastName}`,
            customerEmail: email,
            package: pkg.name,
            amount: pkg.price,
            status: paymentStatus, // success, pending, failed
            invoiceId: order.payment.invoiceId,
            paidAt: paymentStatus === "success" ? createdAt : null,
            createdAt: createdAt,
            updatedAt: createdAt,
            date: createdAt // Added this to explicitly ensure sorting is correct
          });
          await payment.save();

          // 6. Project
          const projStatus = getProjectStatus(createdAt, isLongTerm);
          const projectDurationDays = randomInt(30, 90);
          const expectedEndDate = new Date(createdAt.getTime() + (projectDurationDays * 24 * 60 * 60 * 1000));
          
          const possibleStages = ["Discovery phase", "Wireframing", "UI/UX Design", "Frontend Dev", "Backend Dev", "QA Testing", "UAT", "Deployment", "Post-launch Review"];
          const numStages = randomInt(3, 6);
          const stages = [];
          let currentStageStart = new Date(createdAt);
          const stageDurationDays = Math.max(1, Math.floor(projectDurationDays / numStages));

          const selectedStageNames = [...possibleStages].sort(() => 0.5 - Math.random()).slice(0, numStages);

          for (let s = 0; s < numStages; s++) {
            const isLastStage = s === numStages - 1;
            const stageEnd = isLastStage 
              ? new Date(expectedEndDate) 
              : new Date(currentStageStart.getTime() + (stageDurationDays - 1) * 24 * 60 * 60 * 1000);
            
            let stageStatus = "not_started";
            if (projStatus === "completed") {
              stageStatus = "completed";
            } else if (projStatus === "not_started") {
              stageStatus = "not_started";
            } else {
              const now = new Date();
              if (stageEnd < now) stageStatus = "completed";
              else if (currentStageStart <= now && stageEnd >= now) stageStatus = "in_progress";
              else stageStatus = "not_started";
            }

            stages.push({
              name: selectedStageNames[s],
              status: stageStatus,
              startDate: new Date(currentStageStart),
              endDate: new Date(stageEnd),
              notes: ""
            });

            currentStageStart = new Date(stageEnd.getTime() + 24 * 60 * 60 * 1000); // Start next stage the next day
          }

          const project = new Project({
            name: `${companyName} - ${pkg.name}`,
            description: `Standard implementation for ${pkg.name}`,
            clientId: user._id,
            companyId: company._id,
            orderId: order._id,
            packageName: pkg.name,
            budget: pkg.price,
            paymentStatus: paymentStatus,
            status: projStatus,
            progress: projStatus === "completed" ? 100 : (projStatus === "not_started" ? 0 : randomInt(10, 90)),
            startDate: createdAt,
            expectedEndDate: expectedEndDate,
            stages: stages,
            createdAt: createdAt,
            updatedAt: projStatus === "completed" ? new Date(createdAt.getTime() + (randomInt(30, 90) * 24 * 60 * 60 * 1000)) : new Date()
          });
          await project.save();

          // 7. Tasks
          const numTasks = randomInt(3, 6);
          const possibleTaskNames = ["Initial Client Kickoff", "Requirements Gathering", "Setup Development Environment", "Database Architecture Design", "Create API Endpoints", "Frontend Component Library", "Integrate Payment Gateway", "Write Unit Tests", "Deploy to Staging", "Client Feedback Review", "Production Deployment", "Post-Launch Monitoring"];
          const selectedTaskNames = [...possibleTaskNames].sort(() => 0.5 - Math.random()).slice(0, numTasks);
          
          for (let t = 0; t < numTasks; t++) {
            // Assign task date within the project's expected duration
            const taskStartOffset = randomInt(0, projectDurationDays - 3);
            const taskDuration = randomInt(2, 7); // 2 to 7 days task duration
            const taskStartDate = new Date(createdAt.getTime() + (taskStartOffset * 24 * 60 * 60 * 1000));
            const taskEndDate = new Date(taskStartDate.getTime() + (taskDuration * 24 * 60 * 60 * 1000));
            
            // Format deadline for the original schema requirement
            const deadlineMonth = taskEndDate.toLocaleString('en-US', { month: 'short' });
            const deadlineDay = taskEndDate.getDate();
            const formattedDeadline = `${deadlineDay} ${deadlineMonth}`;

            let taskStatus = "To Do";
            const now = new Date();
            if (projStatus === "completed" || taskEndDate < now) {
              taskStatus = "Completed";
            } else if (taskStartDate <= now && taskEndDate >= now) {
              taskStatus = "In Progress";
            }

            const task = new Task({
              id: `TSK-${year}-${randomInt(10000, 99999)}`,
              title: selectedTaskNames[t],
              project: project.name,
              projectId: project._id.toString(), // ensure it maps properly
              projectName: project.name,
              status: taskStatus,
              priority: randomChoice(["Low", "Medium", "High", "Urgent"]),
              assignee: randomChoice(["John D", "Sarah M", "Mike T", "Emily W", "Alex K"]),
              deadline: formattedDeadline,
              startDate: taskStartDate,
              endDate: taskEndDate,
              description: `This task covers ${selectedTaskNames[t].toLowerCase()} for the ${project.name} project.`,
              subtasks: randomInt(0, 5),
              comments: randomInt(0, 8),
            });
            await task.save();
          }
        }
      }
    }

    // Generate repeat customers
    console.log("Generating repeat customers...");
    const repeatCount = Math.floor(allCompanies.length * 0.2); // 20% repeat
    for (let i = 0; i < repeatCount; i++) {
      const company = randomChoice(allCompanies);
      const pkg = randomChoice(PACKAGES);
      
      // The repeat order happens sometime after the company creation
      const repeatDate = new Date(company.createdAt.getTime() + (randomInt(30, 365) * 24 * 60 * 60 * 1000));
      // Ensure repeat date is not in the future
      if (repeatDate > new Date()) continue;

      const order = new Order({
        package: {
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          total: pkg.price
        },
        customer: {
          firstName: "Repeat",
          lastName: "Client",
          customerName: company.contact,
          customerPhone: "+910000000000",
          customerEmail: "repeat@example.com",
          customerCompany: company.name
        },
        payment: {
          status: "paid",
          invoiceId: `INV-REPEAT-${randomInt(10000, 99999)}`
        },
        createdAt: repeatDate,
        updatedAt: repeatDate
      });
      await order.save();

      const paymentStatus = getPaymentStatus();
      const payment = new Payment({
        id: `PAY-REP-${randomInt(1000, 9999)}`,
        paymentId: `pay_${crypto.randomBytes(6).toString("hex")}`,
        sourceOrderId: order._id,
        companyId: company._id,
        clientId: company.userId,
        company: company.name,
        client: company.contact,
        customerEmail: "repeat@example.com",
        package: pkg.name,
        amount: pkg.price,
        status: paymentStatus,
        invoiceId: order.payment.invoiceId,
        paidAt: paymentStatus === "success" ? repeatDate : null,
        createdAt: repeatDate,
        updatedAt: repeatDate,
        date: repeatDate
      });
      await payment.save();

      const projStatus = getProjectStatus(repeatDate, false);
      const project = new Project({
        name: `${company.name} - Phase 2 ${pkg.name}`,
        description: `Follow up project`,
        clientId: company.userId,
        companyId: company._id,
        orderId: order._id,
        packageName: pkg.name,
        budget: pkg.price,
        paymentStatus: paymentStatus,
        status: projStatus,
        progress: projStatus === "completed" ? 100 : (projStatus === "not_started" ? 0 : randomInt(10, 90)),
        startDate: repeatDate,
        createdAt: repeatDate,
        updatedAt: repeatDate
      });
      await project.save();
    }

    console.log("Database seeded successfully with highly realistic data!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
}

seed();
