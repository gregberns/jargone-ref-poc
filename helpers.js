const fetch = require('node-fetch')
const R = require('ramda')
const Task = require('data.task')
// const mailer = require('nodemailer');
var sendgridMailer = require('sendgrid').mail;
const sendgrid = require('sendgrid');

const main = (reqBody, onError, onSuccess) => {
  const {applicant, references, positionTitle} = validateBody(reqBody)
  
  const refs = combineRefsAndQuestions(applicant.name)(references)

  const emails = createEmails(applicant, refs, positionTitle)

  console.log('Emails to be sent', emails)

  sendEmails(emails).fork(
    function(error) { console.error(error); onError(error);  }
  , function(data)  { console.log(data);    onSuccess(data); }
  )
}

const log = entry => {
  console.log(entry)
  return entry
}

const map = f => l => l.map(f);
const reduce = f => i => l => l.reduce(f, i)
const zipWith = f => xs => ys => xs.map((n,i) => f(n, ys[i]))

const testPayload = {
  positionTitle: 'Server',
  applicant: {
    name: 'Jane Applicant',
    email: 'gregberns@gmail.com',
  },
  references: [{
    name: 'Jon Doe',
    title: 'Manager',
    relationship: 'Manager',
    email: 'gregberns+1@gmail.com',
  }]
};

const sendTest = () => {
  //var url = 'http://localhost:3000/submit';
  var url = 'https://jargone-ref-poc.herokuapp.com/submit'
  return fetch(url, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })
    //.then(res => res.json())
    .then(res => {
      console.log('Response: ', res);
      return res;
    });
}

const validateBody = body => {
  if (body.positionTitle == undefined) throw new Error('Must include "positionTitle" query parameter')
  if (body.applicant == undefined) throw new Error('Must include "applicantEmail" query parameter')
  if (body.references == undefined) throw new Error('Must include "references" query parameter')
  if (!Array.isArray(body.references)) throw new Error('Must include "references" query parameter')
  if (body.references.length == 0) throw new Error('Must include one or more reference')
  return {
    positionTitle: body.positionTitle,
    applicant: validateApplicant(body.applicant),
    references: body.references.map(validateReference)
  }
}

const validateApplicant = applicant => {
  if (applicant.name == undefined) throw new Error('Must include "applicant.name"')
  if (applicant.email == undefined) throw new Error('Must include "applicant.email"')
  return {
    name: applicant.name,
    email: applicant.email,
  }
}

const validateReference = reference => {
  //Name, title, relationship, email
  if (reference.name == undefined) throw new Error('Must include "applicant.name"')
  if (reference.title == undefined) throw new Error('Must include "applicant.name"')
  if (reference.relationship == undefined) throw new Error('Must include "applicant.name"')
  if (reference.email == undefined) throw new Error('Must include "applicant.name"')
  return {
    name: reference.name,
    title: reference.title,
    relationship: reference.relationship,
    email: reference.email,
  }
}

const questions = applicantName => [
  `Please describe your relationship to ${applicantName} (i.e. did they directly report to you or you to them or were you peers sort of relationship)`,

  `How long have you known or worked with them?`,

  `In your experience of working with others who are similarly skilled – what makes this person better than others?`,

  `Here are some of the key aspects we need in the ideal candidate:<br/>
  Self-starter – we don’t offer extensive training and need people who understand how to find the answers or are driven enough to figure things out.<br/> 
  We need people who are laser focused on customer experience and service. <br/>
  Our ideal candidates will be people who are interested in working somewhere over the long-haul and growing with the company versus those who may only be seeking a short-term or temporary stay sort of engagement. <br/>
  There are a lot of applicants – why would it be in our best interest to hire ${applicantName} for the role we have described?`,

  `When you think back to when they either were first hired (if you were there at that time) or when you first met them, what would you say has been the greatest thing they have learned or skill they have developed in that period of time?`,

  `Everyone has them what are ${applicantName}'s shortcomings or areas that they need to focus on as they grow and develop in their career?`,

  `What have we not asked you or what else can you share with us that would help us make the best decision on hiring ${applicantName}?`,

  `Given the option to rehire or work with them again, would you?`
]

const combineRefsAndQuestions = applicantName => references => {
  const qs = generateQuestions(questions(applicantName))(2)(references.length);
  const combine = (ref, qs) => ({...ref, questions: qs})
  return zipWith(combine)(references)(qs)
}

const createEmails = (applicant, references, positionTitle) => {

  const applicantEmail = 
    createApplicantEmail(
      applicant.name, 
      applicant.email, 
      references.length, 
      positionTitle)
  
  const refEmail = ref => createReferenceEmail(applicant.name, ref.email, ref.questions)

  const refEmails = map(refEmail)(references)

  return [
    applicantEmail,
    ...refEmails
  ]
}

// > helper.generateQuestions([1,2,3,4,5,6,7,8])(3)(2)
// [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
// > helper.generateQuestions([1,2,3,4,5])(3)(4)
// [ [ 1, 2, 3 ], [ 4, 5, 1 ], [ 2, 3, 4 ], [ 5, 1, 2 ] ]
//  generateQuestions :: List Question -> Int -> Int -> List (List Question)
const generateQuestions = questions => questionsPerReference => countOfReferences => {
  var outter = []
  var m = 0 
  for (var i = 0; i < countOfReferences; i++) {
    var inner = []
    for (var j = 0; j < questionsPerReference; j++) {
      inner.push(questions[m])
      if (m >= questions.length - 1) {
        m = 0
      } else {
        m++
      }
    }
    outter.push(inner)
  }
  return outter
}

const createApplicantEmail = (applicantName, email, referenceCount, jobTitle) => {
  return {
    from: "Jargone <info@jargone.io>",
    to: email,
    subject: "Application to Jargone Submitted",
    text: `${applicantName}: Thank you for your recent application to the posting for “${jobTitle}” on Jargone. The goal is for a hiring authority to connect with you based on your reference feedback alone. As of this moment, 0 of ${referenceCount} have been verified at this point. The hiring authority has been notified of your application as well as the fact that 0 of ${referenceCount} references have been verified – they may still choose to connect with you or they may wait until they start to see some of the references come back with positive remarks. We will send you regular updates as the references reply so you can watch the progress – if you aren’t seeing activity with some or all, you can easily reach out to them or update your profile with other references who may be more inclined to respond. Thank you again and feel free to reach out with any questions.`,
    //html: "<b>Node.js New world for me</b>"
  }
}

const createReferenceEmail = (applicantName, email, questions) => {
  const qs = reduce((acc, q) => acc + '\n * ' + q)('')(questions)
  return {
    from: "Jargone <info@jargone.io>",
    to: email,
    subject: `${applicantName} has requested a reference`,
    text: `${applicantName} has requested you be a reference. We've got some questions for you: \n${qs}`,
    //html: "<b>Node.js New world for me</b>"
  }
}

const sendEmails = emails => 
  R.traverse(Task.of, sendEmail, emails)

const sendEmail = mail => {
  return new Task(function(reject, resolve) {
    const sg = sendgrid(process.env.SENDGRID_API_KEY);
    const request = sg.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: new sendgridMailer.Mail(
          new sendgridMailer.Email(mail.from),
          mail.subject,
          new sendgridMailer.Email(mail.to),
          new sendgridMailer.Content('text/plain', mail.text)
        ).toJSON(),
    });

    sg.API(request, function(error, response) {
      console.log(response.statusCode);
      console.log(response.body);
      console.log(response.headers);
      if (error)  reject(error)
      else        resolve(response)
    });
  })
}

module.exports = {
  main,
  sendTest,
  map,
  zipWith,
  testPayload,
  combineRefsAndQuestions,
  createEmails,
  generateQuestions,
  createApplicantEmail,
  createReferenceEmail,
};
