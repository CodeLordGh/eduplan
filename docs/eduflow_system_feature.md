# EduFlow System Design Document

## Overview

EduFlow is a comprehensive platform for managing schools, facilitating communication, and enhancing the learning experience for students, teachers, parents, and administrators. The system includes various user roles with specific functionalities and responsibilities.

---

## Roles and Responsibilities

### System Admin

The System Admin oversees the overall functionality and setup of EduFlow. Their responsibilities include:

- Creating or assisting in the creation of schools or coalitions in the database.
- Managing user accounts and linking schools to school owners.
- Receiving OTP codes for onboarding school owners (For new aquisition), school heads, or school admins.
- Handling special registration cases where the school owner or staff does not have an existing EduFlow account.
- Providing technical support to users.
- Monitor and manage the overall performance of the system.

### School Owner

The School Owner is responsible for the administrative and financial oversight of their school(s). Key functionalities include:

- Adding schools they own or manage to the platform.
- Assigning School Heads and School Admins to their schools.
- Generating OTP codes to delegate registration tasks to the System Admin when necessary.
- Managing school-related financial details and policies.
- monitor the overall performance of each school they own and compare performance of schools they own to see which school is doing better

---

### School Head

The School Head focuses on academic oversight and performance monitoring. Their responsibilities include:

- Monitoring the school’s overall performance and generating reports.
- Comparing current performance metrics with historical data.
- Approving actions initiated by the School Admin.
- Setting salary structures and approving assignments for new teachers.
- Confirming key administrative actions.
- send direct messages to parents that have their children in the school they work in.
- Searching for vaccant staff roles and initiating hiring processes

---

### School Admin

The School Admin handles IT and logistical operations. Responsibilities include:

- Creating accounts for new students, teachers, and other staff (e.g., cooks, accountants, security personnel).
- Managing temporary IDs and OTP codes for new staff onboarding.
- Setting the school calendar, including holidays, events, and working days.
- Designing and managing class schedules and assigning subjects to teachers.
- Recording offline and online transactions related to school supplies and fees.

---

### Teacher

Teachers play an essential role in academics. Their functionalities include:

- Accessing and managing academic data for assigned classes and subjects.
- Assigning and grading classwork, homework, exams and quizzes.
- Uploading assignments in various formats (text, PDF, images).
- Viewing student performance data (limited to their subjects).
- Class Masters can view performance across all subjects but only manipulate data for their own subjects.
- Teachers set their availability for subjects they teach.
- Teachers set their availability for home class teaching.

#### Social Features

- Sharing posts, images, and files on the Hub (a general social platform for all users).
- Accessing the B-Hub (exclusive to school owners for networking and business transactions).
- Setting up quizzes that students can take for a fee, with parental approval required.

---

### Parent/Guardian

Parents are integral to student management and support. Their roles include:

- Creating accounts and linking them with their child’s school account.
- Generating OTP codes to provide student details to the School Admin.
- Viewing and paying school fees, feeding fees, and other charges through mobile money or deposits.
- Setting payment preferences (manual or automatic deductions from EduFlow deposits).
- Searching for home-class teachers and initiating hiring processes.
- Approving quizzes and assignments that incur additional costs.

---

### Student

Students utilize EduFlow for academic and extracurricular activities. Features include:

- Receiving and submitting assignments and homework digitally.
- Participating in quizzes and monitored video-based activities.
- Viewing academic performance and teacher feedback.

---

### Accountant

The Accountant ensures accurate financial records. Responsibilities include:

- Recording offline and online transactions for school supplies and fees.
- Notifying parents about their children’s purchases (e.g., books, pens) and associated costs.
- Managing inventory and feeding fees where applicable.

---

## Features

### Notifications for Payments

- Schools can remind parents about overdue fees through:
  - Notifications within the EduFlow app.
  - Direct SMS messages.
  - Automated phone calls with pre-recorded messages from school staff.

### OTP Code System

- Unique one-time codes are used to link accounts securely. OTPs:
  - Are eight digits long.
  - Expire after a limited time or one use.
  - Allow seamless onboarding of staff and students.

### Social Platforms

- **Hub**: Open to all users for idea sharing, networking, and finding job opportunities.
- **B-Hub**: Exclusive to school owners for business transactions and discussions.

### Academic Management

- Teachers can create and publish quizzes for students.
- Students can search for and take quizzes with parental approval.
- Class schedules and subjects are assigned by the School Admin.

### Financial Transactions

- Parents can deposit funds into EduFlow accounts for automated or manual fee payments.
- Parents can also pay through mobile money without the need to use the EduFlow wallet.
- The system tracks purchases made by students and updates parents in real time.

### AI Integration

- Teachers can generate assignments using ai
- Schools can utilize ai to predict students performance, suggest individualy tailord asignments to students or class.

### user History

- All users can view their history of activities on the system.
- System Admin can view history of all users on the system.
- School Heads can view history of all staff and students in the school they head.
- Teachers can view history of all students in the class they teach.
- Parents can only view history of their children.
  -The system will also have a history of all transactions made by users.
- The system keep track of all users professtional history.
- The system will also keep track of all students academic history.
- The system will also keep track of all students attendance history.
- The system will also keep track of all students performance history.

---

## Summary

EduFlow combines academic, administrative, and social functionalities into a single platform. Each user role has tailored responsibilities and features to ensure smooth operation and collaboration across all stakeholders.
