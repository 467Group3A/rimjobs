// ccauth.js

const app = Vue.createApp({
    data() {
      return {
        formData: {
          vendor: 'Rim Jobs Auto Parts',
          trans: '',
          cc: '',
          name: '',
          exp: '',
          amount: ''
        },
        message: '',
        errormessage: null,
        confirmation: null,

      }
    },
    methods: {
      submitForm() {
        fetch('/api/creditcardauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.formData)
        })
        .then(response => {
          if (response.status === 500) {
              return response.json().then(data => {
              this.message = `Unable to authorize payment with the following errors:`
              this.errormessage = data.errors
            })
          } else if (response.status === 200) {
            return response.json().then(data => {
              this.message = `Payment successfully made. Here's your confirmation:`
              this.confirmation = data
            });
          }
        })
        .catch(error => {
          console.error(error)
        });
      },
    }
  });
  
  app.mount('#ccauth');
