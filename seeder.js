/**
 * Database Seeder
 * Creates sample users, jobs, and applications
 * Run: node utils/seeder.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Job = require('../models/Job');
const { Application, Notification } = require('../models/Application');

const getMongoUri = () => process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@jobportal.com',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
    bio: 'Platform administrator',
    location: 'Mumbai, India'
  },
  {
    name: 'TechCorp Recruiter',
    email: 'recruiter@techcorp.com',
    password: 'recruiter123',
    role: 'recruiter',
    isVerified: true,
    location: 'Bengaluru, India',
    company: {
      name: 'TechCorp India',
      website: 'https://techcorp.com',
      description: 'Leading technology company building next-gen software solutions.',
      industry: 'Technology',
      size: '500-1000'
    }
  },
  {
    name: 'InnoSoft HR',
    email: 'hr@innosoft.io',
    password: 'recruiter123',
    role: 'recruiter',
    isVerified: true,
    location: 'Hyderabad, India',
    company: {
      name: 'InnoSoft Solutions',
      website: 'https://innosoft.io',
      description: 'Innovative software startup focused on AI-driven products.',
      industry: 'Software',
      size: '50-200'
    }
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'user123',
    role: 'jobseeker',
    isVerified: true,
    location: 'Chennai, India',
    bio: 'Full-stack developer with 3 years of experience in React and Node.js',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
    experience: '2-5 years',
    education: { degree: 'B.Tech CSE', institution: 'Anna University', year: '2021' }
  },
  {
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    password: 'user123',
    role: 'jobseeker',
    isVerified: true,
    location: 'Delhi, India',
    bio: 'UI/UX Designer passionate about creating intuitive digital experiences',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'HTML/CSS', 'Prototyping'],
    experience: '1-2 years',
    education: { degree: 'B.Des', institution: 'NID Ahmedabad', year: '2022' }
  }
];

const getJobSamples = (recruiter1Id, recruiter2Id) => [
  {
    title: 'Senior React Developer',
    description: 'We are looking for a skilled React developer to join our growing team. You will build scalable frontend applications used by millions of users globally.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'REST API integration', 'Git version control'],
    responsibilities: ['Build reusable UI components', 'Optimize application performance', 'Code reviews', 'Mentor junior developers'],
    skills: ['React', 'TypeScript', 'Redux', 'Tailwind CSS', 'Jest'],
    recruiter: recruiter1Id,
    company: { name: 'TechCorp India', website: 'https://techcorp.com' },
    type: 'full-time',
    category: 'technology',
    experience: '5-10 years',
    salary: { min: 1800000, max: 2500000, currency: 'INR', period: 'yearly' },
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India', coordinates: { lat: 12.9716, lng: 77.5946 } },
    status: 'active',
    tags: ['react', 'frontend', 'typescript'],
    isFeatured: true
  },
  {
    title: 'Node.js Backend Engineer',
    description: 'Join our backend team to design and build microservices for our enterprise platform. You will work on high-scale distributed systems.',
    requirements: ['3+ years Node.js', 'MongoDB/PostgreSQL', 'Docker/Kubernetes', 'System design knowledge'],
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker', 'AWS'],
    recruiter: recruiter1Id,
    company: { name: 'TechCorp India' },
    type: 'full-time',
    category: 'technology',
    experience: '2-5 years',
    salary: { min: 1200000, max: 2000000, currency: 'INR', period: 'yearly' },
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India', isRemote: true },
    status: 'active',
    tags: ['nodejs', 'backend', 'microservices']
  },
  {
    title: 'UI/UX Designer',
    description: 'We need a creative designer to craft beautiful user interfaces and meaningful experiences for our AI-powered products.',
    requirements: ['Figma expertise', 'User research skills', 'Portfolio required', 'Startup experience preferred'],
    skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems'],
    recruiter: recruiter2Id,
    company: { name: 'InnoSoft Solutions', website: 'https://innosoft.io' },
    type: 'full-time',
    category: 'design',
    experience: '1-2 years',
    salary: { min: 600000, max: 1000000, currency: 'INR', period: 'yearly' },
    location: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    status: 'active',
    tags: ['design', 'ux', 'figma']
  },
  {
    title: 'Data Scientist',
    description: 'Apply machine learning to solve real business problems. You will build predictive models, analyze large datasets, and present insights.',
    skills: ['Python', 'TensorFlow', 'SQL', 'Tableau', 'Statistics'],
    recruiter: recruiter2Id,
    company: { name: 'InnoSoft Solutions' },
    type: 'full-time',
    category: 'technology',
    experience: '2-5 years',
    salary: { min: 1500000, max: 2200000, currency: 'INR', period: 'yearly' },
    location: { city: 'Pune', state: 'Maharashtra', country: 'India', isRemote: true },
    status: 'active',
    tags: ['ml', 'python', 'data science'],
    isFeatured: true
  },
  {
    title: 'Digital Marketing Manager',
    description: 'Lead our digital marketing efforts including SEO, SEM, social media, and email campaigns to drive growth.',
    skills: ['SEO', 'Google Ads', 'Content Marketing', 'Analytics', 'Social Media'],
    recruiter: recruiter1Id,
    company: { name: 'TechCorp India' },
    type: 'full-time',
    category: 'marketing',
    experience: '2-5 years',
    salary: { min: 800000, max: 1400000, currency: 'INR', period: 'yearly' },
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'active',
    tags: ['marketing', 'seo', 'growth']
  },
  {
    title: 'Frontend Intern',
    description: 'Great opportunity for freshers to gain hands-on experience in React development with mentorship from senior engineers.',
    skills: ['HTML', 'CSS', 'JavaScript', 'React basics'],
    recruiter: recruiter2Id,
    company: { name: 'InnoSoft Solutions' },
    type: 'internship',
    category: 'technology',
    experience: 'fresher',
    salary: { min: 15000, max: 25000, currency: 'INR', period: 'monthly' },
    location: { city: 'Hyderabad', state: 'Telangana', country: 'India', isRemote: true },
    status: 'active',
    tags: ['internship', 'react', 'fresher']
  },
  {
    title: 'Java Developer',
    description: 'We are seeking a Java Developer to join our core banking team. You will be responsible for developing high-volume, low-latency applications.',
    skills: ['Java', 'Spring Boot', 'Hibernate', 'Microservices', 'SQL'],
    recruiter: recruiter1Id,
    company: { name: 'Global Finance Corp' },
    type: 'full-time',
    category: 'technology',
    experience: '2-5 years',
    salary: { min: 1200000, max: 2200000, currency: 'INR', period: 'yearly' },
    location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    status: 'active',
    tags: ['java', 'spring', 'backend']
  },
  {
    title: 'Java Developer',
    description: 'Join our e-commerce platform as a Java Developer. Work on scalable backend systems and integrate with third-party services.',
    skills: ['Java', 'Spring Boot', 'Kafka', 'Redis', 'AWS'],
    recruiter: recruiter2Id,
    company: { name: 'E-Cart India' },
    type: 'full-time',
    category: 'technology',
    experience: '2-5 years',
    salary: { min: 1000000, max: 1800000, currency: 'INR', period: 'yearly' },
    location: { city: 'Bengaluru', state: 'Karnataka', country: 'India', isRemote: true },
    status: 'active',
    tags: ['java', 'ecommerce', 'aws']
  },
  {
    title: 'Java Developer',
    description: 'Help us build the next generation of healthcare software. You will focus on building secure and efficient Java-based APIs.',
    skills: ['Java', 'Spring Security', 'PostgreSQL', 'Docker'],
    recruiter: recruiter1Id,
    company: { name: 'HealthTech Solutions' },
    type: 'full-time',
    category: 'technology',
    experience: '5-10 years',
    salary: { min: 1500000, max: 2500000, currency: 'INR', period: 'yearly' },
    location: { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    status: 'active',
    tags: ['java', 'healthcare', 'api']
  },
  {
    title: 'Java Developer',
    description: 'We need a Java Developer to work on our logistics and supply chain management system.',
    skills: ['Java', 'J2EE', 'Oracle', 'Maven'],
    recruiter: recruiter2Id,
    company: { name: 'Logistics Pro' },
    type: 'full-time',
    category: 'technology',
    experience: '1-2 years',
    salary: { min: 800000, max: 1300000, currency: 'INR', period: 'yearly' },
    location: { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    status: 'active',
    tags: ['java', 'logistics', 'j2ee']
  },
  {
    title: 'Java Developer',
    description: 'Work on cutting-edge financial technology. You will be building distributed systems using modern Java frameworks.',
    skills: ['Java', 'Spring Cloud', 'MongoDB', 'JUnit'],
    recruiter: recruiter1Id,
    company: { name: 'FinTech Innovators' },
    type: 'full-time',
    category: 'technology',
    experience: '2-5 years',
    salary: { min: 1400000, max: 2000000, currency: 'INR', period: 'yearly' },
    location: { city: 'Pune', state: 'Maharashtra', country: 'India', isRemote: true },
    status: 'active',
    tags: ['java', 'fintech', 'springcloud']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(getMongoUri());
    console.log('✅ Connected to MongoDB (Seeder)');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create users (passwords hashed via pre-save hook)
    const users = await User.create(sampleUsers);
    const admin = users[0];
    const recruiter1 = users[1];
    const recruiter2 = users[2];
    const jobseeker1 = users[3];
    const jobseeker2 = users[4];
    console.log(`👥 Created ${users.length} users`);

    // Create jobs
    const jobs = await Job.create(getJobSamples(recruiter1._id, recruiter2._id));
    console.log(`💼 Created ${jobs.length} jobs`);

    // Create sample applications
    const applications = await Application.create([
      {
        job: jobs[0]._id,
        applicant: jobseeker1._id,
        recruiter: recruiter1._id,
        resume: 'uploads/resumes/sample-resume.pdf',
        coverLetter: 'I am excited to apply for this Senior React Developer position...',
        expectedSalary: 2000000,
        status: 'shortlisted',
        statusHistory: [
          { status: 'applied', note: 'Application submitted' },
          { status: 'viewed', note: 'Profile reviewed' },
          { status: 'shortlisted', note: 'Strong candidate' }
        ]
      },
      {
        job: jobs[1]._id,
        applicant: jobseeker1._id,
        recruiter: recruiter1._id,
        resume: 'uploads/resumes/sample-resume.pdf',
        status: 'applied',
        statusHistory: [{ status: 'applied', note: 'Application submitted' }]
      },
      {
        job: jobs[2]._id,
        applicant: jobseeker2._id,
        recruiter: recruiter2._id,
        resume: 'uploads/resumes/sample-resume.pdf',
        coverLetter: 'As a UI/UX designer with a passion for user-centered design...',
        status: 'interview',
        statusHistory: [
          { status: 'applied' },
          { status: 'shortlisted' },
          { status: 'interview', note: 'Interview scheduled for next week' }
        ]
      }
    ]);
    console.log(`📋 Created ${applications.length} applications`);

    // Update applicant counts
    await Job.findByIdAndUpdate(jobs[0]._id, { applicantsCount: 1 });
    await Job.findByIdAndUpdate(jobs[1]._id, { applicantsCount: 1 });
    await Job.findByIdAndUpdate(jobs[2]._id, { applicantsCount: 1 });

    // Sample notifications
    await Notification.create([
      {
        recipient: jobseeker1._id,
        type: 'application_shortlisted',
        title: 'Application Shortlisted!',
        message: 'You have been shortlisted for Senior React Developer at TechCorp India',
        link: `/applications/${applications[0]._id}`,
        isRead: false
      },
      {
        recipient: recruiter1._id,
        type: 'application_received',
        title: 'New Application',
        message: 'Priya Sharma applied for Senior React Developer',
        link: `/recruiter/applications/${applications[0]._id}`,
        isRead: true
      }
    ]);

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📌 Login Credentials:');
    console.log('─────────────────────────────────────────');
    console.log('🔑 Admin:     admin@jobportal.com     / admin123');
    console.log('🏢 Recruiter: recruiter@techcorp.com  / recruiter123');
    console.log('🏢 Recruiter: hr@innosoft.io          / recruiter123');
    console.log('👤 Seeker:    priya@example.com       / user123');
    console.log('👤 Seeker:    rahul@example.com       / user123');
    console.log('─────────────────────────────────────────\n');

    console.log('─────────────────────────────────────────\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

module.exports = seedDB;
