import type { Block } from "~/components/blocks/types";
import { BRAND } from "~/lib/config/brand";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function renderBlockAsEmailHtml(block: Block): string {
  switch (block.type) {
    case "hero":
      return `
        <div style="background: linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #f8fafc 100%); padding: 48px 24px; text-align: center;">
          <h1 style="font-size: 36px; font-weight: bold; color: #0f172a; margin: 0 0 16px 0; line-height: 1.2;">
            ${block.data.title.replace(/\n/g, '<br>')}
          </h1>
          ${block.data.subtitle ? `
            <p style="font-size: 18px; color: #64748b; margin: 0 auto; max-width: 600px;">
              ${block.data.subtitle}
            </p>
          ` : ''}
          ${block.data.buttons && block.data.buttons.length > 0 ? `
            <div style="margin-top: 32px;">
              ${block.data.buttons.map(btn => `
                <a href="${btn.href}" style="display: inline-block; padding: 12px 32px; margin: 8px; background-color: ${btn.variant === 'primary' ? '#4f46e5' : 'transparent'}; color: ${btn.variant === 'primary' ? '#ffffff' : '#4f46e5'}; border: ${btn.variant === 'primary' ? 'none' : '2px solid #4f46e5'}; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  ${btn.text}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    
    case "text":
      const alignMap = { left: 'left', center: 'center', right: 'right' };
      const maxWidthMap = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', full: '100%' };
      return `
        <div style="padding: 32px 24px; text-align: ${alignMap[block.data.align || 'left']};">
          <div style="max-width: ${maxWidthMap[block.data.maxWidth || 'xl']}; margin: 0 auto;">
            <div style="font-size: 16px; line-height: 1.6; color: #334155;">
              ${block.data.content.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
      `;
    
    case "image":
      return `
        <div style="padding: 32px 24px; text-align: center;">
          <img src="${block.data.src}" alt="${block.data.alt}" style="max-width: 100%; height: auto; ${block.data.rounded ? 'border-radius: 16px;' : ''}" />
          ${block.data.caption ? `
            <p style="margin-top: 12px; font-size: 14px; color: #64748b; font-style: italic;">
              ${block.data.caption}
            </p>
          ` : ''}
        </div>
      `;
    
    case "video":
      return `
        <div style="padding: 32px 24px; text-align: center;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 16px;">
            📹 <strong>Watch Video:</strong>
          </p>
          <a href="${block.data.url}" style="display: inline-block; padding: 12px 32px; background-color: #ef4444; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Click to Watch
          </a>
          ${block.data.caption ? `
            <p style="margin-top: 12px; font-size: 14px; color: #64748b; font-style: italic;">
              ${block.data.caption}
            </p>
          ` : ''}
        </div>
      `;
    
    case "stats":
      return `
        <div style="padding: 48px 24px; background-color: #f8fafc;">
          ${block.data.title ? `
            <h2 style="font-size: 32px; font-weight: bold; color: #0f172a; text-align: center; margin: 0 0 32px 0;">
              ${block.data.title}
            </h2>
          ` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 1200px; margin: 0 auto;">
            <tr>
              ${block.data.stats.map(stat => `
                <td style="padding: 16px; text-align: center;">
                  <div style="font-size: 48px; font-weight: bold; color: #4f46e5; margin-bottom: 8px;">
                    ${stat.value}
                  </div>
                  <div style="font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">
                    ${stat.label}
                  </div>
                  ${stat.description ? `
                    <div style="font-size: 14px; color: #64748b;">
                      ${stat.description}
                    </div>
                  ` : ''}
                </td>
              `).join('')}
            </tr>
          </table>
        </div>
      `;
    
    case "cta":
      return `
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); padding: 48px 24px; text-align: center;">
          <h2 style="font-size: 32px; font-weight: bold; color: #ffffff; margin: 0 0 16px 0;">
            ${block.data.title}
          </h2>
          ${block.data.subtitle ? `
            <p style="font-size: 18px; color: #e0e7ff; margin: 0 0 32px 0;">
              ${block.data.subtitle}
            </p>
          ` : ''}
          ${block.data.buttons && block.data.buttons.length > 0 ? `
            <div>
              ${block.data.buttons.map(btn => `
                <a href="${btn.href}" style="display: inline-block; padding: 12px 32px; margin: 8px; background-color: ${btn.variant === 'primary' ? '#ffffff' : 'transparent'}; color: ${btn.variant === 'primary' ? '#4f46e5' : '#ffffff'}; border: ${btn.variant === 'primary' ? 'none' : '2px solid #ffffff'}; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  ${btn.text}
                </a>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    
    case "pricing":
      return `
        <div style="padding: 48px 24px; background-color: #f8fafc;">
          ${block.data.title ? `
            <h2 style="font-size: 32px; font-weight: bold; color: #0f172a; text-align: center; margin: 0 0 16px 0;">
              ${block.data.title}
            </h2>
          ` : ''}
          ${block.data.subtitle ? `
            <p style="font-size: 18px; color: #64748b; text-align: center; margin: 0 0 32px 0;">
              ${block.data.subtitle}
            </p>
          ` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 1200px; margin: 0 auto;">
            <tr>
              ${block.data.tiers.map(tier => `
                <td style="padding: 16px; vertical-align: top;">
                  <div style="background-color: ${tier.highlighted ? '#4f46e5' : '#ffffff'}; color: ${tier.highlighted ? '#ffffff' : '#0f172a'}; padding: 32px; border-radius: 16px; border: 2px solid ${tier.highlighted ? '#4f46e5' : '#e2e8f0'};">
                    ${tier.highlighted ? `
                      <div style="background-color: #f59e0b; color: #ffffff; padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-align: center; margin-bottom: 16px;">
                        MOST POPULAR
                      </div>
                    ` : ''}
                    <h3 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
                      ${tier.name}
                    </h3>
                    ${tier.description ? `
                      <p style="font-size: 14px; opacity: 0.8; margin: 0 0 16px 0;">
                        ${tier.description}
                      </p>
                    ` : ''}
                    <div style="margin: 16px 0;">
                      <span style="font-size: 48px; font-weight: bold;">${tier.price}</span>
                      ${tier.period ? `<span style="font-size: 18px; opacity: 0.8;">${tier.period}</span>` : ''}
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 16px 0;">
                      ${tier.features.map(feature => `
                        <li style="padding: 8px 0; font-size: 14px;">
                          ✓ ${feature}
                        </li>
                      `).join('')}
                    </ul>
                    <a href="${tier.ctaLink}" style="display: block; padding: 12px 24px; margin-top: 16px; background-color: ${tier.highlighted ? '#ffffff' : '#4f46e5'}; color: ${tier.highlighted ? '#4f46e5' : '#ffffff'}; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">
                      ${tier.ctaText}
                    </a>
                  </div>
                </td>
              `).join('')}
            </tr>
          </table>
        </div>
      `;
    
    case "features":
      return `
        <div style="padding: 48px 24px;">
          ${block.data.title ? `
            <h2 style="font-size: 32px; font-weight: bold; color: #0f172a; text-align: center; margin: 0 0 16px 0;">
              ${block.data.title}
            </h2>
          ` : ''}
          ${block.data.subtitle ? `
            <p style="font-size: 18px; color: #64748b; text-align: center; margin: 0 0 32px 0;">
              ${block.data.subtitle}
            </p>
          ` : ''}
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 1200px; margin: 0 auto;">
            ${block.data.features.map((feature, i) => i % (block.data.columns || 3) === 0 ? `
              <tr>
                ${block.data.features.slice(i, i + (block.data.columns || 3)).map(f => `
                  <td style="padding: 16px; vertical-align: top;">
                    <div style="text-align: center;">
                      <div style="font-size: 32px; margin-bottom: 16px;">
                        ${f.icon === 'CheckCircle' ? '✓' : f.icon === 'Star' ? '⭐' : f.icon === 'Zap' ? '⚡' : '•'}
                      </div>
                      <h3 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 8px 0;">
                        ${f.title}
                      </h3>
                      <p style="font-size: 14px; color: #64748b; margin: 0;">
                        ${f.description}
                      </p>
                    </div>
                  </td>
                `).join('')}
              </tr>
            ` : '').join('')}
          </table>
        </div>
      `;
    
    case "spacer":
      const heightMap = { sm: '32px', md: '64px', lg: '96px', xl: '128px' };
      return `<div style="height: ${heightMap[block.data.height]};"></div>`;
    
    default:
      return '';
  }
}

export function welcomeEmail(data: {
  name: string;
  email: string;
}): EmailTemplate {
  return {
    subject: `Welcome to ${BRAND.name} - Your Legal Case Preparation Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to ${BRAND.name}, ${data.name}!</h1>
        <p>Thank you for joining ${BRAND.name} - The Plaintiff Operating System.</p>
        <p>We're here to help you prepare your legal case with AI-powered tools and connect you with contingency law firms.</p>
        <h2>Getting Started:</h2>
        <ol>
          <li>Verify your email address (check for a separate verification email)</li>
          <li>Start your first case by telling us your story</li>
          <li>Upload supporting documents</li>
          <li>Get your case scored and analyzed</li>
          <li>Request a law firm referral when ready</li>
        </ol>
        <p><strong>Important Reminder:</strong> ${BRAND.name} provides legal information, not legal advice. Always consult with a qualified attorney.</p>
        <p>Best regards,<br>The ${BRAND.name} Team</p>
      </div>
    `,
    text: `
Welcome to ${BRAND.name}, ${data.name}!

Thank you for joining ${BRAND.name} - The Plaintiff Operating System.

We're here to help you prepare your legal case with AI-powered tools and connect you with contingency law firms.

Getting Started:
1. Verify your email address (check for a separate verification email)
2. Start your first case by telling us your story
3. Upload supporting documents
4. Get your case scored and analyzed
5. Request a law firm referral when ready

Important Reminder: ${BRAND.name} provides legal information, not legal advice. Always consult with a qualified attorney.

Best regards,
The ${BRAND.name} Team
    `,
  };
}

export function emailVerificationEmail(data: {
  name: string;
  verificationUrl: string;
}): EmailTemplate {
  return {
    subject: `Verify Your Email Address - ${BRAND.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Verify Your Email Address</h1>
        <p>Hi ${data.name},</p>
        <p>Please verify your email address to complete your ${BRAND.name} registration.</p>
        <p style="margin: 30px 0;">
          <a href="${data.verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${data.verificationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `,
    text: `
Verify Your Email Address

Hi ${data.name},

Please verify your email address to complete your ${BRAND.name} registration.

Click here to verify: ${data.verificationUrl}

This link will expire in 24 hours.
    `,
  };
}

export function passwordResetEmail(data: {
  name: string;
  resetUrl: string;
}): EmailTemplate {
  return {
    subject: `Reset Your Password - ${BRAND.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Reset Your Password</h1>
        <p>Hi ${data.name},</p>
        <p>We received a request to reset your password for your ${BRAND.name} account.</p>
        <p style="margin: 30px 0;">
          <a href="${data.resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${data.resetUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `
Reset Your Password

Hi ${data.name},

We received a request to reset your password for your ${BRAND.name} account.

Click here to reset: ${data.resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.
    `,
  };
}

export function referralStatusUpdateEmail(data: {
  name: string;
  caseTitle: string;
  status: string;
  message?: string;
}): EmailTemplate {
  const statusMessages: Record<string, string> = {
    REQUESTED: "We've received your referral request and are reviewing your case.",
    UNDER_REVIEW: "Your case is currently under review by our team.",
    MATCHED: "Great news! We've matched you with a law firm.",
    ACCEPTED: "A law firm has accepted your case and will be in touch soon.",
    DECLINED: "Unfortunately, we were unable to find a match at this time.",
  };

  const statusMessage = data.message || statusMessages[data.status] || "Your referral status has been updated.";

  return {
    subject: `Referral Status Update: ${data.caseTitle} - ${BRAND.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Referral Status Update</h1>
        <p>Hi ${data.name},</p>
        <p>There's an update on your referral request for: <strong>${data.caseTitle}</strong></p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>Status:</strong> ${data.status}</p>
          <p style="margin: 10px 0 0 0;">${statusMessage}</p>
        </div>
        <p>Log in to your dashboard to view more details and any next steps.</p>
        <p style="margin: 30px 0;">
          <a href="https://kairav.ai/dashboard" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </p>
        <p>Best regards,<br>The ${BRAND.name} Team</p>
      </div>
    `,
    text: `
Referral Status Update

Hi ${data.name},

There's an update on your referral request for: ${data.caseTitle}

Status: ${data.status}
${statusMessage}

Log in to your dashboard to view more details and any next steps.

Visit: https://kairav.ai/dashboard

Best regards,
The ${BRAND.name} Team
    `,
  };
}

export function caseScoreReadyEmail(data: {
  name: string;
  caseTitle: string;
  overallScore: number;
}): EmailTemplate {
  return {
    subject: `Your Case Score is Ready: ${data.caseTitle} - ${BRAND.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Your Case Score is Ready!</h1>
        <p>Hi ${data.name},</p>
        <p>We've completed the analysis of your case: <strong>${data.caseTitle}</strong></p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 48px; font-weight: bold; color: #4F46E5;">${data.overallScore}</p>
          <p style="margin: 10px 0 0 0; font-size: 18px;">Overall Case Score</p>
        </div>
        <p>Your case has been scored across multiple dimensions including evidence strength, liability clarity, damages quantifiability, and more.</p>
        <p>Log in to view your detailed score breakdown and next steps.</p>
        <p style="margin: 30px 0;">
          <a href="https://kairav.ai/dashboard" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Score
          </a>
        </p>
        <p>Best regards,<br>The ${BRAND.name} Team</p>
      </div>
    `,
    text: `
Your Case Score is Ready!

Hi ${data.name},

We've completed the analysis of your case: ${data.caseTitle}

Overall Case Score: ${data.overallScore}/100

Your case has been scored across multiple dimensions including evidence strength, liability clarity, damages quantifiability, and more.

Log in to view your detailed score breakdown and next steps.

Visit: https://kairav.ai/dashboard

Best regards,
The ${BRAND.name} Team
    `,
  };
}

export function pageAsEmail(data: {
  page: {
    title: string;
    emailSubject?: string | null;
    emailPreviewText?: string | null;
    blocks?: any;
    content?: string;
    layoutType?: string;
  };
  unsubscribeUrl?: string;
}): EmailTemplate {
  const subject = data.page.emailSubject || data.page.title;
  const previewText = data.page.emailPreviewText || '';
  
  let bodyHtml = '';
  
  if (data.page.layoutType === 'BLOCKS' && data.page.blocks) {
    const blocks = data.page.blocks as Block[];
    bodyHtml = blocks.map(block => renderBlockAsEmailHtml(block)).join('\n');
  } else if (data.page.content) {
    // Fallback for markdown content
    bodyHtml = `
      <div style="padding: 32px 24px;">
        <div style="max-width: 800px; margin: 0 auto; font-size: 16px; line-height: 1.6; color: #334155;">
          ${data.page.content.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${previewText ? `
        <style type="text/css">
          .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
        </style>
      ` : ''}
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
      ${previewText ? `
        <div class="preheader" style="display: none; max-height: 0px; overflow: hidden;">
          ${previewText}
        </div>
      ` : ''}
      
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
        <tr>
          <td style="padding: 24px; text-align: center;">
            <a href="https://kairav.ai" style="font-size: 24px; font-weight: bold; color: #4f46e5; text-decoration: none;">
              ${BRAND.name}
            </a>
          </td>
        </tr>
      </table>
      
      <!-- Content -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            ${bodyHtml}
          </td>
        </tr>
      </table>
      
      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; margin-top: 48px;">
        <tr>
          <td style="padding: 32px 24px; text-align: center;">
            <p style="font-size: 14px; color: #64748b; margin: 0 0 16px 0;">
              © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
            </p>
            ${data.unsubscribeUrl ? `
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                <a href="${data.unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">
                  Unsubscribe
                </a>
              </p>
            ` : ''}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  
  // Generate plain text version
  const text = `
${data.page.title}

${previewText ? previewText + '\n\n' : ''}

View this email in your browser: https://kairav.ai

---

© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
${data.unsubscribeUrl ? '\nUnsubscribe: ' + data.unsubscribeUrl : ''}
  `.trim();
  
  return {
    subject,
    html,
    text,
  };
}
