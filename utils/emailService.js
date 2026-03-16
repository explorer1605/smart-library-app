const nodemailer = require('nodemailer');

// Use Ethereal for testing — this automatically creates a fake SMTP server to view emails
// In production, replace auth with real Gmail credentials
let transporter;

async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  console.log(`📧 Ethereal Test Email Account Ready!`);
  console.log(`   Login to view sent emails: https://ethereal.email/login`);
  console.log(`   User: ${testAccount.user}`);
  console.log(`   Pass: ${testAccount.pass}`);
}

createTestAccount();

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.warn('Transporter not ready yet. Dropping email to:', to);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Smart Library System" <no-reply@smartlibrary.com>',
      to,
      subject,
      html,
    });
    console.log(`📩 Email sent: ${subject}`);
    console.log(`   Test URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
}

// ---- Email Templates ----

async function sendIssueConfirmation(email, studentName, bookTitle, dueDate) {
  if (!email) return;
  const d = new Date(dueDate).toLocaleDateString();
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #6366f1;">Book Issued Successfully</h2>
      <p>Hi ${studentName},</p>
      <p>You have successfully checked out <strong>${bookTitle}</strong> from the Smart Library.</p>
      <p>Please return it by: <strong style="color: #ef4444;">${d}</strong> to avoid fines.</p>
      <br>
      <p>Happy Reading!<br>— Smart Library Admin</p>
    </div>
  `;
  await sendEmail(email, `Book Issued: ${bookTitle}`, html);
}

async function sendDueDateReminder(email, studentName, bookTitle, dueDate) {
  if (!email) return;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #f59e0b;">Reminder: Book Due Today!</h2>
      <p>Hi ${studentName},</p>
      <p>This is a friendly reminder that <strong>${bookTitle}</strong> is due for return today.</p>
      <p>Please return it to the library today to prevent late fees.</p>
      <br>
      <p>Thank you,<br>— Smart Library Admin</p>
    </div>
  `;
  await sendEmail(email, `Due Today: ${bookTitle}`, html);
}

async function sendOverdueWarning(email, studentName, bookTitle, fine) {
  if (!email) return;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #ef4444;">⚠ Overdue Notice</h2>
      <p>Hi ${studentName},</p>
      <p>Our records indicate that <strong>${bookTitle}</strong> is currently overdue.</p>
      <p>Your current accumulated fine is: <strong style="color: #ef4444; font-size: 1.2rem;">₹${fine}</strong>.</p>
      <p>Please return the book immediately to stop further daily fines (₹1/day).</p>
      <br>
      <p>Regards,<br>— Smart Library Admin</p>
    </div>
  `;
  await sendEmail(email, `⚠ Overdue Notice: ${bookTitle}`, html);
}

module.exports = {
  sendIssueConfirmation,
  sendDueDateReminder,
  sendOverdueWarning,
};
