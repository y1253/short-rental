export function signUpEmail(userName) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to RentMeech!</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #ffffff;
          border: 1px solid #eee;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .header h1 {
          font-size: 28px;
          color: #333;
          margin: 0;
        }
        .header p {
          font-size: 14px;
          color: #666;
        }
        .content {
          padding: 20px 0;
        }
        .content p {
          font-size: 16px;
          margin-bottom: 15px;
        }
        .button-container {
          text-align: center;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          padding: 12px 25px;
          background-color: #007bff; /* A nice blue */
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>RentMeech</h1>
          <p>Your home for rental listings</p>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Welcome to RentMeech! We're thrilled to have you join our community.</p>
          <p>You've successfully created your account. Now you can start listing your properties or finding your next home with ease.</p>
          <p>To get started, please click the button below to log in to your dashboard:</p>
          <div class="button-container">
            <a href="https://rentmeech.com/login" class="button">Go to your Dashboard</a>
          </div>
          <p style="font-size: 14px; color: #666;">If you have any questions, feel free to reply to this email.</p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">Best regards,</p>
          <p style="font-size: 14px; color: #666;">The RentMeech Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} RentMeech. All rights reserved.</p>
          
        </div>
      </div>
    </body>
    </html>
  `;
}
