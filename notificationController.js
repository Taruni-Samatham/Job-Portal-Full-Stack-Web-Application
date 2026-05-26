/**
 * Notification Controller
 */
const { Notification } = require('../models/Application');

exports.getNotifications = async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;

  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: req.user._id, isRead: false })
  ]);

  res.json({ success: true, data: notifications, unreadCount, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
};

exports.markAsRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true }
  );
  res.json({ success: true, message: 'Marked as read' });
};

exports.markAllAsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read' });
};

exports.deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  res.json({ success: true, message: 'Notification deleted' });
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Chat Controller - Rule-based AI chatbot for job assistance
 */
exports.chatWithBot = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  const msg = message.toLowerCase().trim();
  let response = '';

  // Rule-based responses
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    response = "👋 Hello! I'm JobBot, your career assistant. I can help you with job searching, resume tips, interview advice, and more. What would you like to know?";
  } else if (msg.includes('resume') || msg.includes('cv')) {
    response = "📄 **Resume Tips:**\n• Keep it to 1-2 pages\n• Use action verbs (Led, Built, Improved)\n• Tailor it to each job description\n• Include measurable achievements\n• Add relevant skills and keywords\n• Proofread for spelling errors\n\nWould you like more specific advice?";
  } else if (msg.includes('interview')) {
    response = "🎯 **Interview Tips:**\n• Research the company thoroughly\n• Practice STAR method (Situation, Task, Action, Result)\n• Prepare 5 questions to ask them\n• Dress professionally\n• Arrive 10 minutes early\n• Follow up with a thank-you email\n\nWhat type of interview are you preparing for?";
  } else if (msg.includes('salary') || msg.includes('negotiate')) {
    response = "💰 **Salary Negotiation Tips:**\n• Research market rates on Glassdoor/LinkedIn\n• Don't reveal your current salary first\n• Negotiate after receiving an offer\n• Consider the full package (benefits, equity)\n• Be confident but polite\n• Get the offer in writing\n\nWant tips on how to counter-offer?";
  } else if (msg.includes('cover letter')) {
    response = "✉️ **Cover Letter Tips:**\n• Address the hiring manager by name\n• Opening: Show enthusiasm for the role\n• Middle: Match your skills to job requirements\n• Closing: Call to action for interview\n• Keep it under 400 words\n• Customize for each application";
  } else if (msg.includes('remote') || msg.includes('work from home')) {
    response = "🏠 **Remote Work Tips:**\n• Set up a dedicated workspace\n• Maintain regular working hours\n• Over-communicate with your team\n• Use time-blocking techniques\n• Take regular breaks\n• Build strong digital communication skills\n\nLooking for remote jobs? Use the 'remote' filter in job search!";
  } else if (msg.includes('skills') || msg.includes('learn')) {
    response = "🚀 **In-Demand Skills 2024:**\n• **Tech:** Python, Cloud (AWS/Azure), AI/ML, React\n• **Data:** SQL, Tableau, Power BI\n• **Soft:** Communication, Leadership, Problem-solving\n• **Marketing:** SEO, Content, Data Analytics\n\nRecommended platforms: Coursera, Udemy, LinkedIn Learning";
  } else if (msg.includes('linkedin')) {
    response = "👔 **LinkedIn Profile Tips:**\n• Professional headshot (gets 14x more views)\n• Compelling headline beyond just job title\n• Write a personal About section\n• Add all relevant experience with metrics\n• Get 5+ skills endorsed\n• Request recommendations\n• Post content regularly";
  } else if (msg.includes('fresher') || msg.includes('entry level') || msg.includes('no experience')) {
    response = "🌱 **Tips for Freshers:**\n• Highlight academic projects and internships\n• Build a portfolio or GitHub profile\n• Apply for internships first\n• Network through college alumni\n• Consider certifications\n• Volunteer for relevant experience\n• Tailor your resume to each role";
  } else if (msg.includes('thank') || msg.includes('thanks')) {
    response = "You're welcome! 😊 Good luck with your job search! Feel free to ask me anything else — I'm here to help. 🚀";
  } else if (msg.includes('job') || msg.includes('find') || msg.includes('search')) {
    response = "🔍 **Job Search Tips:**\n• Use keywords from the job description\n• Set up job alerts\n• Apply within the first 48 hours\n• Network — 70% of jobs are filled via referrals\n• Check company culture on Glassdoor\n• Apply to companies you believe in\n\nTry our Smart Search with filters for location, salary, and job type!";
  } else {
    response = "🤖 I'm here to help with your career journey! You can ask me about:\n• **Resume** writing tips\n• **Interview** preparation\n• **Salary** negotiation\n• **Cover letter** advice\n• **Skills** to learn\n• **Job search** strategies\n• **LinkedIn** profile tips\n\nWhat would you like help with?";
  }

  res.json({ success: true, data: { message: response, timestamp: new Date() } });
};
