import { getDbPool } from "../db.js";
import nodemailer from "nodemailer";

// Helper function to execute queries
const query = async (text, params) => {
  const pool = getDbPool();
  return await pool.query(text, params);
};

// Create email transporter with database settings
const createTransporter = async () => {
  try {
    // Get SMTP settings from database
    const smtpResult = await query(
      `SELECT key, value FROM settings 
       WHERE key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_secure')`
    );

    const smtpSettings = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      from: process.env.SMTP_FROM,
      secure: false
    };

    // Override with database settings if available
    smtpResult.rows.forEach(row => {
      switch(row.key) {
        case 'smtp_host':
          if (row.value) smtpSettings.host = row.value;
          break;
        case 'smtp_port':
          if (row.value) smtpSettings.port = parseInt(row.value);
          break;
        case 'smtp_user':
          if (row.value) smtpSettings.user = row.value;
          break;
        case 'smtp_pass':
          if (row.value) smtpSettings.pass = row.value;
          break;
        case 'smtp_from':
          if (row.value) smtpSettings.from = row.value;
          break;
        case 'smtp_secure':
          if (row.value) smtpSettings.secure = row.value === 'true';
          break;
      }
    });

    // Validate that we have the minimum required settings
    if (!smtpSettings.user || !smtpSettings.pass) {
      throw new Error("SMTP user and password are required. Please configure email settings in the operations panel.");
    }

    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure, // true for 465, false for other ports
      auth: {
        user: smtpSettings.user,
        pass: smtpSettings.pass,
      },
    });

    return { transporter, from: smtpSettings.from || smtpSettings.user };
  } catch (error) {
    console.error("Error creating email transporter:", error);
    throw error;
  }
};

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: "All fields are required",
        fields: { name, email, subject, message }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address"
      });
    }

    // Get contact email from settings
    let contactEmail = "blog@ingasti.com"; // default fallback
    try {
      const settingsResult = await query(
        "SELECT value FROM settings WHERE key = 'contact_email'"
      );
      if (settingsResult.rows.length > 0) {
        contactEmail = settingsResult.rows[0].value;
      }
    } catch (settingsError) {
      console.log("Could not fetch contact email from settings, using default:", settingsError.message);
    }

    // Store the contact message in database (optional)
    try {
      await query(
        `INSERT INTO contact_messages (name, email, subject, message, created_at, status) 
         VALUES ($1, $2, $3, $4, NOW(), 'new')`,
        [name, email, subject, message]
      );
    } catch (dbError) {
      console.log("Database storage failed (continuing without storing):", dbError.message);
      // Continue with email sending even if database storage fails
    }

    // Send email notification
    const { transporter, from } = await createTransporter();
    
    const mailOptions = {
      from: from || `"Blog Contact Form" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Contact Form Message</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Message Details</h2>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #555;">Name:</strong><br>
                <span style="font-size: 16px;">${name}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #555;">Email:</strong><br>
                <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #555;">Subject:</strong><br>
                <span style="font-size: 16px;">${subject}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #555;">Message:</strong><br>
                <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin-top: 10px; border-radius: 4px;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                <small style="color: #888;">
                  Sent from Blog Contact Form on ${new Date().toLocaleString()}<br>
                  Sent to: ${contactEmail}
                </small>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" 
                 style="background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reply to ${name}
              </a>
            </div>
          </div>
        </div>
      `,
      // Also include plain text version
      text: `
New Contact Form Message

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

Sent from Blog Contact Form on ${new Date().toLocaleString()}
Sent to: ${contactEmail}
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Message sent successfully",
      success: true
    });

  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      error: "Failed to send message. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
