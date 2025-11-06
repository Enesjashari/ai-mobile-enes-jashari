const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'enesjashari2004@gmail.com',
    pass: 'dmra hzdy ipju vpqb', // Use Gmail App Password, not normal password
  },
});

app.post('/send-code', async (req, res) => {
  const { email, code, subject, text } = req.body;

  try {
    console.log('Sending email to:', email);
    
    const mailOptions = {
      from: '"Tasks App" <enesjashari2004@gmail.com>',
      to: email,
      subject: subject || 'Your Verification Code',
      text: text || `Your verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verification Code</h2>
          <p style="font-size: 16px; color: #666;">Your verification code is:</p>
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p style="color: #666;">This code will expire in 30 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.json({ success: true });
  } catch (err) {
    console.error('Email sending error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
