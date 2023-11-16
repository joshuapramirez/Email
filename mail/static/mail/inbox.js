document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit handler
  document.querySelector("#compose-form").addEventListener('submit', send_email);


  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-content-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      // Print email info
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-content-view').style.display = 'block';

      // Display email info
      document.querySelector('#email-content-view').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
        <li class="list-group-item">${email.body}</li>
      </ul>
      `;

      // Change to read
      if(!email.read){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      // Archive/Unarchive logic
      if (email.sender !== userEmail) {
        const archive_button = document.createElement('button');
        archive_button.innerHTML = email.archived ? "Unarchive" : "Archive";
        archive_button.className = email.archived ? "btn btn-success" : "btn btn-danger";
        archive_button.addEventListener('click', function () {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              archived: !email.archived
            })
          })
            .then(() => {
              load_mailbox('inbox');
            });
        });
        document.querySelector('#email-content-view').append(archive_button);

        // Reply logic
        const reply_button = document.createElement('button');
        reply_button.innerHTML = "Reply"
        reply_button.className = "btn btn-info";
        reply_button.addEventListener('click', function() {
          compose_email();

          document.querySelector('#compose-recipients').value = email.sender;
          let subject = email.subject;
          if(subject.split(' ',1)[0] != "Re:"){
            subject = "Re: " + email.subject;
          }
          document.querySelector('#compose-subject').value = subject;
          document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} sent: ${email.body}\n\n`;

        });
        document.querySelector('#email-content-view').append(reply_button);
      }
  });
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Here, you can access the value of `mailbox` and use it as needed
  console.log(mailbox);

  // Get emails for the mailbox and user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Loop through emails and create div for each one
    emails.forEach(single_email => {

      console.log(single_email);

      // Create div for every email
      const new_email = document.createElement('div');
      new_email.className = "list-group-item";

      // Append read/unread class to the existing class name
      new_email.classList.add(single_email.read ? 'read' : 'unread');

      // Set margin
      new_email.style.marginBottom = "10px";

      // Input the email information
      new_email.innerHTML = `
        <h6>Sender: ${single_email.sender}</h6>
        <h5>Subject: ${single_email.subject}</h5>
        <p>${single_email.timestamp}</p>
      `;

      // Add click event to view email
      new_email.addEventListener('click', function() {
        view_email(single_email.id)
      });

      document.querySelector('#emails-view').append(new_email);
    })
  });
}

function send_email(event){
  event.preventDefault();

  // Store fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data to backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}
