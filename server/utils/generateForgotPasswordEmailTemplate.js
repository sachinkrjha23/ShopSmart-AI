export const generateEmailTemplate = (resetPasswordUrl) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
        
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">
              🔐 Reset Your Password
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px;">
            
            <!-- Greeting -->
            <p style="font-size: 16px; color: #333; margin-top: 0;">
              Hello,
            </p>
            
            <!-- Message -->
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              We received a request to reset your password. Click the button below to set a new one:
            </p>
            
            <!-- Reset Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a 
                href="${resetPasswordUrl}" 
                style="
                  display: inline-block;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: #ffffff;
                  font-size: 16px;
                  font-weight: 600;
                  text-decoration: none;
                  padding: 14px 40px;
                  border-radius: 50px;
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                  transition: all 0.3s ease;
                "
              >
                Reset Password
              </a>
            </div>
            
            <!-- Fallback Link -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 13px; color: #764ba2; word-break: break-all; margin: 0; font-family: monospace;">
                ${resetPasswordUrl}
              </p>
            </div>
            
            <!-- Warning -->
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
              <p style="font-size: 14px; color: #856404; margin: 0;">
                ⏰ This link will expire in <strong>15 minutes</strong> for security.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
            
            <!-- Footer -->
            <p style="font-size: 14px; color: #999; text-align: center; margin: 0;">
              If you didn't request this, you can safely ignore this email.
            </p>
            
            <p style="font-size: 14px; color: #999; text-align: center; margin: 10px 0 0 0;">
              — Ecommerce Team
            </p>
            
            <p style="font-size: 12px; color: #ccc; text-align: center; margin: 20px 0 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
            
          </div>
        </div>
        
      </body>
    </html>
  `;
};
