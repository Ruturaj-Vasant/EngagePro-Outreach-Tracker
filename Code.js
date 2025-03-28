// Function to fetch data from Google Sheet
function fetchDataFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const nameIndex = headers.indexOf('Name');
  const emailIndex = headers.indexOf('Email');
  const statusIndex = headers.indexOf('Status');
  const latestStatusIndex = headers.indexOf('LatestStatus');
  
  return {
    data: data.slice(1),
    indices: { name: nameIndex, email: emailIndex, status: statusIndex, latestStatus: latestStatusIndex }
  };
}


function doGet(e) {
  if (e.parameter.page === 'profile') {
    trackProfileView(e.parameter.professorEmail);
    return showProfilePage(e.parameter.senderName, e.parameter.senderEmail, e.parameter.professorName, e.parameter.professorEmail);
  } else if (e.parameter.email) {
    const email = e.parameter.email;
    Logger.log(`Link triggered: ${email}`);
    updateEmailStatus(email);
    return ContentService.createTextOutput('Tracking pixel received');
  }
  return HtmlService.createHtmlOutput('Invalid request');
}


function extractLastName(fullName) {
  if (fullName.includes(',')) {
    // For names in "LastName, FirstName" format
    return fullName.split(',')[0].trim();
  } else {
    // For names in "FirstName LastName" format
    const nameParts = fullName.trim().split(' ');
    return nameParts[nameParts.length - 1];
  }
}



function showProfilePage(senderName, senderEmail, professorName, professorEmail) {
  var template = HtmlService.createTemplateFromFile('profile');
  template.senderName = senderName;
  template.senderEmail = senderEmail;
  template.professorName = professorName;
  template.professorLastName = extractLastName(professorName);
  template.professorEmail = professorEmail;
  template.config = CONFIG;
  return template.evaluate().setTitle(senderName + "'s Profile");
}


function trackProfileView(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf('Email');
  const profileViewsIndex = headers.indexOf('Profile Views');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === email) {
      const currentViews = data[i][profileViewsIndex] || 0;
      sheet.getRange(i + 1, profileViewsIndex + 1).setValue(currentViews + 1);
      break;
    }
  }
}

// Main function to fetch data and send emails
function sendEmailsAndUpdateStatus(targetStatus) {
  const { data, indices } = fetchDataFromSheet();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  const remainingQuota = MailApp.getRemainingDailyQuota();
  const EMAIL_LIMIT = Math.min(remainingQuota, CONFIG.maxEmailsPerDay); // Use remaining quota or config limit
  let emailCount = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (emailCount >= EMAIL_LIMIT) {
      Logger.log(`Email limit of ${EMAIL_LIMIT} reached. Stopping execution.`);
      break;
    }
    
    const professorName = data[i][indices.name];
    const email = data[i][indices.email];
    const currentStatus = data[i][indices.status] || 0;
    
    if (currentStatus === targetStatus) {
      Logger.log(`Sending email to: Professor ${professorName} (${email})`);
      
      const newStatus = sendEmail(email, professorName, currentStatus);
      sheet.getRange(i + 2, indices.status + 1).setValue(newStatus);
      
      emailCount++;
      
      const delay = Math.floor(Math.random() * 4000) + 1000;
      Utilities.sleep(delay);
      Logger.log(`Waiting for ${delay/1000} seconds before next email.`);
    }
  }
  
  Logger.log(`Total emails sent: ${emailCount}`);
}


// Function to initiate email sending for a specific status
function initiateEmailSending() {
  const targetStatus = 0; // Change this to target different status levels (0 for first email, 1 for second, etc.)
  const remainingQuota = MailApp.getRemainingDailyQuota();
  const EMAIL_LIMIT = Math.min(remainingQuota, CONFIG.maxEmailsPerDay );
  sendEmailsAndUpdateStatus(targetStatus);
}


function sendEmail(email, professorName, currentStatus) {
  if (!email) {
    console.error('No email address provided');
    return currentStatus;
  }
  
  try {
     const trackingPixel = `<img src="${CONFIG.scriptUrl}?email=${encodeURIComponent(email)}" width="1" height="1" alt="">`;
      // const trackingPixel ='<img src="https://script.google.com/macros/s/AKfycbwiRqYmyzbfdpeaK6PLc7-umXH-u3OZit7GSBcWwbsRlsHzTgtD7LY52TTChz9fjr7jDA/exec?email=${encodeURIComponent(email)}" width="1" height="1" alt="">';

    // <img src="${CONFIG.scriptUrl}?email=${encodeURIComponent(email)}" width="1" height="1" alt="">
    const lastName = extractLastName(professorName);
    const profilePicBlob = DriveApp.getFileById(CONFIG.profilePicId).getBlob();
    const profileUrl = CONFIG.scriptUrl + "?page=profile" +
                       "&senderName=" + encodeURIComponent(CONFIG.senderName) +
                       "&senderEmail=" + encodeURIComponent(CONFIG.senderEmail) +
                       "&professorName=" + encodeURIComponent(professorName) +
                       "&professorEmail=" + encodeURIComponent(email);
    
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exploring Opportunities</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 10px;
      font-size: 16px;
    }
    h1 {
      color: #ffffff;
      font-size: 24px;
    }
    .skim {
      font-weight: bold;
      color: #57068c;
    }
    ul {
      padding-left: 20px;
      margin-bottom: 10px;
    }
    a.button {
      display: inline-block;
      background-color: #57068c;
      color: #ffffff;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 16px;
    }
  </style>
</head>
<body style="background-color: #f7f7fb;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff; border-radius:10px; box-shadow:0 8px 16px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#57068c; color:#fff; padding:15px; text-align:center;">
              <h1>Exploring Opportunities</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:15px;">
              <h2 style="color:#57068c;">Hello ${recruiterName},</h2>
              <p>I hope you're doing well! My name is <span class="skim">${CONFIG.senderName}</span>, and I am currently exploring new career opportunities in <span class="skim">[your field]</span>. Given your expertise in recruitment, I wanted to reach out and introduce myself.</p>
              <p>With a strong background in <span class="skim">[key skills]</span>, I have experience working on <span class="skim">[mention relevant projects or achievements]</span>. I'm particularly interested in roles that involve <span class="skim">[specific interests]</span> and believe my skills could be a great match for opportunities your team is hiring for.</p>
              <p>Here’s a quick overview of my background:</p>
              <ul>
                <li><span class="skim">[X] years of experience</span> in [industry/role]</li>
                <li>Proficient in <span class="skim">[key tools or technologies]</span></li>
                <li>Passionate about <span class="skim">[area of expertise or interest]</span></li>
              </ul>
              <p>I’d love to connect and discuss how my experience aligns with any open positions. Please feel free to check out my profile below.</p>
              <table width="100%" cellpadding="5" cellspacing="0" border="0" style="text-align:center;">
                <tr>
                  <td align="center">
                    <a href="${profileUrl}" class="button">View My Profile</a>
                  </td>
                </tr>
              </table>
              <p>Looking forward to your thoughts. Thanks for your time!</p>
              <div style="margin-top:15px;">
                Best regards,<br>
                ${CONFIG.senderName}<br>
                <a href="mailto:${CONFIG.senderEmail}" style="color:#57068c;">${CONFIG.senderEmail}</a> | ${CONFIG.senderPhone}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  ${trackingPixel}
</body>
</html>
    `;
    
   GmailApp.sendEmail(
  email,
  ``,
  {
    htmlBody: htmlTemplate,
    inlineImages: {
      profilePic: profilePicBlob
    }
  }
);

    
    return currentStatus + 1 ;
  } catch (e) {
    console.error(`Failed to send email to ${email}: ${e.toString()}`);
    return currentStatus;
  }
}

function handleButtonClick(type, professorEmail) {
  Logger.log(`handlebuttonclick ${type} (${professorEmail})`);
  incrementClickCount(type, professorEmail);
  return getRedirectUrl(type);
}

function getRedirectUrl(type) {
  return CONFIG[type + 'Url'] || null;
}

function incrementClickCount(type, professorEmail) {
  Logger.log(`incrementClickCount ${type} (${professorEmail})`);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf('Email');
  const clickColumnIndex = headers.indexOf(type + ' Clicks');
  
  if (clickColumnIndex !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] === professorEmail) {
        const currentClicks = data[i][clickColumnIndex] || 0;
        sheet.getRange(i + 1, clickColumnIndex + 1).setValue(currentClicks + 1);
        break;
      }
    }
  }
}

function saveFeedback(professorEmail, feedback) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf('Email');
  const feedbackIndex = headers.indexOf('Feedback');
  
  if (feedbackIndex === -1) {
    // If 'Feedback' column doesn't exist, add it
    sheet.getRange(1, headers.length + 1).setValue('Feedback');
    feedbackIndex = headers.length;
  }
  
  const currentDate = new Date().toLocaleString();
  const newFeedback = `[${currentDate}] ${feedback}`;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === professorEmail) {
      const currentFeedback = data[i][feedbackIndex] || '';
      const updatedFeedback = currentFeedback ? `${currentFeedback}\n\n${newFeedback}` : newFeedback;
      sheet.getRange(i + 1, feedbackIndex + 1).setValue(updatedFeedback);
      return true;
    }
  }
  return false; // Professor email not found
}


// function updateEmailStatus(email) {
//   const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//   const data = sheet.getDataRange().getValues();
//   const headers = data[0];
//   const emailIndex = headers.indexOf('Email');
//   const latestStatusIndex = headers.indexOf('LatestStatus');

//   for (let i = 1; i < data.length; i++) {
//     if (data[i][emailIndex] === email) {
//       sheet.getRange(i + 1, latestStatusIndex + 1).setValue('Opened');
//       break;
//     }
//   }
// }

function updateEmailStatus(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailCol = headers.indexOf('Email');
  const statusCol = headers.indexOf('LatestStatus');

  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      sheet.getRange(i + 1, statusCol + 1).setValue('Opened');
      break;
    }
  }
}

