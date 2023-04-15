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
      customer: {
        name: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
      },
      orderInfo: '',
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

      this.customer.name = this.formData.name;
      
      this.orderInfo = JSON.parse(localStorage.getItem('cartItems'));

      let dataPacket = {
        formData: this.formData,
        customer: this.customer,
        orderInfo: this.orderInfo
      }

      fetch('/api/creditcardauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataPacket)
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
      return [now.slice(0, 4), now.slice(4, 10), now.slice(10, 14)].join('-');
    },
  }
});

app.mount('#ccauth');
