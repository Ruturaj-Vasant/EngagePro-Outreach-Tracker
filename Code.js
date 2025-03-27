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
  <title>Seeking Opportunity at NYU</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 10px; /* Reduced padding */
      font-size: 16px; /* Increased base font size */
    }
    h1 {
      color: #ffffff; /* Title color fixed to white */
      font-size: 30px; /* Slightly increased font size for better visibility */
    }
    .highlight {
      background-color: #f4f4f9;
      border-left: 4px solid #57068c;
      padding: 10px; /* Reduced padding */
      margin: 15px 0; /* Reduced margin */
    }
    .skim {
      font-weight: bold;
      color: #57068c;
    }
    ul {
      padding-left: 20px;
      margin-bottom: 10px; /* Reduced spacing between list items */
    }
    a.button {
      display: inline-block;
      background-color: #57068c;
      color: #ffffff;
      text-decoration: none;
      padding: 10px 20px; /* Adjusted button size */
      border-radius: 5px;
      font-size: 16px; /* Increased button text size */
    }
    td {
      padding: 10px; /* Reduced padding inside table cells */
    }
  </style>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7f7fb; color: #333; margin: 0; padding: 0;"> 
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f7fb; margin:0; padding:20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff; border-radius:10px; box-shadow:0 8px 16px rgba(0,0,0,0.1); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#57068c; color:#fff; padding:15px; text-align:center;">
              <table width="100%">
                <tr>
                  <td align="left" style="width:80px;">
                    <img src="cid:profilePic" alt="Your Photo" style="width:80px; height:auto; border-radius:50%; border:3px solid #fff;">
                  </td>
                  <td align="center">
                    <h1>Seeking Opportunity at NYU</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:15px;">
              <h2 style="color:#57068c;">Greetings ${lastName},</h2>

              <p>I'm <span class="skim">${CONFIG.senderName}</span>, a graduate student at NYU in <span class="skim">Computer Science and Information Systems</span>. I'm reaching out about potential <span class="skim">TA/RA positions</span> that might be available.</p>

              <p>Now, I know you probably get a ton of these emails, so let me tell you something you won't find on my resume:</p>

              <div class="highlight">
                <ul style="list-style-type:none; padding-left:0;">
                  <li><strong>I'm a process ninja:</strong> I have a knack for optimizing and automating both technical and non-technical processes.</li>
                  <li><strong>I've got people skills:</strong> I've mentored students in school help groups and even engineers. I'm what you might call a "techno people person" - I speak both geek and human!</li>
                </ul>
                <p style="font-style:italic;">"I'm not just looking for a job; I'm looking for an opportunity to make a difference while keeping my ramen budget intact!"</p>
              </div>

              <p>A bit about myself:</p>

              <ul>
                <li><span class="skim">5+ years of experience</span> in software engineering and performance optimization</li>
                <li>Currently diving into <span class="skim">ML and finance</span> through NYU coursework</li>
                <li>Strong background in <span class="skim">distributed systems and cloud infrastructure</span></li>
              </ul>

              <p>I'm ready to bring my A-game - whether it's <span class="skim"> assisting with research, organizing course materials, or enhancing student engagement </span>. I can contribute by streamlining processes and supporting your academic goals. I promise to bring as much enthusiasm to grading papers as I do to a fresh cup of coffee on Monday morning!</p>

              <!-- View Profile Button -->
              <table width="100%" cellpadding="5" cellspacing="0" border="0" style="text-align:center;">
                <tr>
                  <td align="center">
                    <a href="${profileUrl}" class="button">Check Out My Profile</a>
                  </td>
                </tr>
              </table>

              <!-- Closing -->
              <p>I'd love the chance to chat more about how I can contribute to your work. I promise I'm much funnier in person!</p>

              <!-- Signature -->
              <div style="margin-top:15px;">
                Thanks for your time,<br>
                ${CONFIG.senderName}<br>
                Aspiring TA/RA<br>
                <a href="mailto:${CONFIG.senderEmail}" style="color:#57068c;">${CONFIG.senderEmail}</a> | ${CONFIG.senderPhone}
              </div>

              <!-- Footer -->
              <tr>
                <td colspan="2" style="
                  background-color:#eeeeee;
                  color:#555555;
                  text-align:center;
                  font-size:14px;
                  padding:10px;"> <!-- Added colspan="2" for full-width footer -->
                  P.S. If you've read this far, you're awesome. Thanks for your time!
                </td>
              </tr>

            </td>
          </tr>

        </table> <!-- End Main Container -->
      </td>
    </tr>
  </table>

${trackingPixel}

</body>
</html>
    `;
    
   GmailApp.sendEmail(
  email,
  `Exploring Opportunities at NYU - ${CONFIG.senderName}`,
  `Greetings Professor ${lastName},

 I'm ${CONFIG.senderName},a graduate student at NYU in Computer Science and Information Systems. I'm reaching out about potential TA/RA positions that might be available.

Now, I know you probably get a ton of these emails, so let me tell you something you won't find on my resume:

I'm a process ninja: I have a knack for optimizing and automating both technical and non-technical processes.

I've got people skills: I've mentored students in school help groups and even engineers. I'm what you might call a "techno people person" - I speak both geek and human!

"I'm not just looking for a job; I'm looking for an opportunity to make a difference while keeping my ramen budget intact!"

A bit about myself:

5+ years of experience in software engineering and performance optimization

Currently diving into ML and finance through NYU coursework

Strong background in distributed systems and cloud infrastructure

I'm ready to bring my A-game - whether it's assisting with research, organizing course materials, or enhancing student engagement. I can contribute by streamlining processes and supporting your academic goals. I promise to bring as much enthusiasm to grading papers as I do to a fresh cup of coffee on Monday morning!

To learn more about me, please check out my profile at: ${profileUrl}

I'd love the chance to chat more about how I can contribute to your team. I promise I'm much funnier in person!

Thanks a bunch,
${CONFIG.senderName}
Aspiring TA/RA
${CONFIG.senderEmail} | ${CONFIG.senderPhone}

P.S. If you've read this far, you're awesome. Thanks for your time!`,
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

