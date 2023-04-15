// ccauth.js

const app = Vue.createApp({
  data() {
    return {
      formData: {
        vendor: '',
        trans: '',
        cc: '',
        name: '',
        exp: '',
        amount: ''
      },
      month: 1,
      year: 2021,
      message: '',
      errormessage: null,
      confirmation: null,
    }
  },
  methods: {
    submitForm() {
      // set the vendor to our name later
      this.formData.vendor = 'STOREFRONT';
      // generate a random order number
      this.formData.trans = this.orderNumber();
      // get the total cost from the local storage
      this.formData.amount = localStorage.getItem('totalCost');
      // get the expiration date
      this.formData.exp = this.month + '/' + this.year;

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
    orderNumber() {
      let now = Date.now().toString()
      // pad with extra random digit
      now += now + Math.floor(Math.random() * 10)
      // format
      console.log([now.slice(0, 4), now.slice(4, 10), now.slice(10, 14)].join('-'));
      return [now.slice(0, 4), now.slice(4, 10), now.slice(10, 14)].join('-');
    },
  }
});

app.mount('#ccauth');
