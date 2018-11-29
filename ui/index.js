'use strict';

const e = React.createElement;

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      showApplicantForm: true,
      showReferenceForm: false,
      showCompletedMessage: false,
      positionTitle: 'Server',
      applicant: null,
      references: null,

      fetching: false,
      response: '',
      error: '',
    };

    this.submitApplicantForm = this.submitApplicantForm.bind(this);
    this.submitReferenceForm = this.submitReferenceForm.bind(this);
  }

  submit(payload) {
    this.setState({ fetching: true, response: '', error: '' })
    submitRequest(payload)
      .then(data => this.setState({ 
        showCompletedMessage: true,
        fetching: false, 
        response: data, 
        error: ''  }))
      .catch(err => this.setState({ 
        showCompletedMessage: true,
        fetching: false, 
        response: '', 
        error: err }))
  }

  submitApplicantForm(args) {
    const {name, email} = args
    this.setState({ 
      showApplicantForm: false,
      showReferenceForm: true,
      applicant: {
        name,
        email
      }
    })
    //alert(`A Applicant was submitted: ${name} ${email} `);
  }

  submitReferenceForm(args) {
    const {name, title, relationship, email} = args
    var refs = [{
      name,
      title,
      relationship,
      email
    }]
    this.setState({
      showReferenceForm: false,
      references: refs
    })
    //alert(`A Reference was submitted: ${name} ${email} `);
    const payload = {
      positionTitle: this.state.positionTitle,
      applicant: this.state.applicant,
      references: refs,
    }
    this.submit(payload)
  }

  render() {
    return (
      <div>
        <h1>Jargon</h1>
        { this.state.showApplicantForm
          && <ApplicantForm submit={this.submitApplicantForm}/>}
        { this.state.showReferenceForm
          && <ReferenceForm submit={this.submitReferenceForm}/>}
        { this.state.showCompletedMessage
          && <CompletedMessage 
                applicant={this.state.applicant}
                references={this.state.references}
                position={this.state.positionTitle}
                />}
        { this.state.fetching &&
          <h2>Submitting Information...</h2>}
      </div>
    );
  }
}

class ApplicantForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      email: ''
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount(){
    this.nameField.focus(); 
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleSubmit(event) {
    
    event.preventDefault();
    this.props.submit(this.state)
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <h2>Your info:</h2>
        <label>
          Name:
          <input 
            name="name"
            type="text"
            value={this.state.name}
            onChange={this.handleInputChange}
            //helps focus
            ref={(input) => { this.nameField = input; }} />
        </label>
        <br />
        <br />
        <label>
          Email:
          <input
            name="email"
            type="email"
            value={this.state.email}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <br />
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

class ReferenceForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      title: '',
      relationship: '',
      email: '',
    };

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount(){
    this.nameField.focus(); 
  }


  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.submit(this.state)
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <h2>Your reference's info:</h2>
        <label>
          Name:
          <input 
            name="name"
            type="text"
            value={this.state.name}
            onChange={this.handleInputChange}
            ref={(input) => { this.nameField = input; }} />
        </label>
        <br />
        <br />
        <label>
          Title:
          <input 
            name="title"
            type="text"
            value={this.state.title}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <br />
        <label>
          Relationship:
          <input 
            name="relationship"
            type="text"
            value={this.state.relationship}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <br />
        <label>
          Email:
          <input
            name="email"
            type="email"
            value={this.state.email}
            onChange={this.handleInputChange} />
        </label>
        <br />
        <br />
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

class CompletedMessage extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <div>
        <h2>Thats it. You should recieve an email shortly.</h2>
        <div>{JSON.stringify(this.props.applicant)}</div>
        <div>{JSON.stringify(this.props.references)}</div>
        <div>{JSON.stringify(this.props.position)}</div>
      </div>
    );
  }
}

const API = 'https://hn.algolia.com/api/v1/search?query=';
const DEFAULT_QUERY = 'redux';

const submitRequest = payload => {
  // //format
  // {
  //   positionTitle: 'Server',
  //   applicant: {
  //     name: 'Jane Applicant',
  //     email: 'janea@gmail.com',
  //   },
  //   references: [{
  //     name: 'Jon Doe',
  //     title: 'Manager',
  //     relationship: 'Manager',
  //     email: 'jondoe@gmail.com',
  //   }]
  // };

  if (payload.positionTitle == undefined) throw new Error('Must include "positionTitle" query parameter')
  if (payload.applicant == undefined) throw new Error('Must include "applicantEmail" query parameter')
  if (payload.references == undefined) throw new Error('Must include "references" query parameter')
  if (!Array.isArray(payload.references)) throw new Error('Must include "references" query parameter')
  if (payload.references.length == 0) throw new Error('Must include one or more reference')

  console.log('Submitting Payload', payload)

  return fetch('/submit', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
      console.log('Response: ', res);
      return res;
    });

  // return fetch('/submit')
  //   .then(response => response.json())
  //   .then(data => this.setState({ hits: data.hits }))
  //   .catch();


  
}

const domContainer = document.querySelector('#root');
ReactDOM.render(<Main />, domContainer);
