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
        weightCost: 0,
      },
      orderInfo: '',
      shippingFees: [],
      month: 1,
      year: 2021,
      message: '',
      errormessage: null,
      confirmation: null,
      cartItems: [],
      cartTotal: 0,
      subtotal: 0,
      shipping: 0,
      title: " Complete your order",
      subtitle: "Please fill out the following information to finalize your order."
    }
  },
  methods: {
    submitForm() {
      this.formData.exp = this.month + '/' + this.year;
      this.customer.name = this.formData.name;
      this.orderInfo = JSON.parse(localStorage.getItem('cartItems'));

      // Fix the amount to 2 decimal places
      let amount = localStorage.getItem('totalCost');
      if(!isNaN(parseFloat(amount))) {
        this.formData.amount = parseFloat(amount).toFixed(2).toString()
      } else {
        console.error("Error fixing total cost decimal place")
      }

      this.customer.address = this.customer.address + ' ' + this.customer.city + ' ' + this.customer.state + ' ' + this.customer.zip;
      let totalWeight = 0;
      // set the vendor to our name later
      this.formData.vendor = 'RIMJOBS MULTIMODAL';

      if (this.formData.cc.length < 16 || 
          this.formData.name.length < 1 || 
          this.formData.exp.length !== 7 || 
          this.formData.amount.length < 1 || 
          this.customer.name.length < 1 || 
          this.customer.email.length < 1 || 
          this.customer.address.length < 1 || 
          this.customer.city.length < 1 || 
          this.customer.state.length < 1 || 
          this.customer.zip.length < 1) {
            this.message = `Please Double Check all fields.`;
            this.confirmation = null;
      } else {
          // generate a random order number
        this.formData.trans = this.orderNumber();
        for (let i = 0; i < this.orderInfo.length; i++) {
          totalWeight += this.orderInfo[i].weight * this.orderInfo[i].quantity;
        }

        for (let i = 0; i < this.shippingFees.length; i++) {
          if (totalWeight <= this.shippingFees[i].weight) {
            this.customer.weightCost = this.shippingFees[i].cost;
            break;
          }
        }

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
                this.title = " Order has been submitted!";
                this.subtitle = "Thank you for your shopping with us.";
                this.confirmation = data
                localStorage.removeItem('cartItems');

                // Send this.confirmation to backend, used for email confirmation
                let date = this.normalDate(this.confirmation.timeStamp)
                fetch('/api/email-confirmation', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    confirmation: this.confirmation,
                    customer: this.customer,
                    date: date
                  })
                })
                .then(response => {
                  if(response.ok){
                    console.log("Email sent!")
                  } else{
                    console.log("Error sending email!")
                  }
                })
                .catch(err => {
                  console.log(err)
                })
                // End of email confirmation
              });
            }
          })
          .catch(error => {
            console.error(error)
          });
        }
    },
    orderNumber() {
      let now = Date.now().toString()
      // pad with extra random digit
      now += now + Math.floor(Math.random() * 10)
      // format
      return [now.slice(0, 4), now.slice(4, 10), now.slice(10, 14)].join('-');
    },
    fixed(number){
      return number.toFixed(2);
    },
    capitalize(str) {
      return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
    },
    normalDate(date){
      var newDate = new Date(date);
      var humanDate = newDate.toLocaleDateString("en-US", {
        weekday: "long", 
        month: "long", 
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric", 
        timeZoneName: "short"
      })
      return humanDate
    }
  },
  mounted() {
    try {
      this.cartItems = JSON.parse(localStorage.getItem('cartItems'));
      for (let i = 0; i < this.cartItems.length; i++) {
        this.cartTotal += 1;
      }
    } catch (error) {
      this.cartItems = 0;
      this.title = " Your cart is empty!";
      this.subtitle = "Please add items to your cart before checking out.";
    }
    this.subtotal = localStorage.getItem('totalCost');
    this.shipping = localStorage.getItem('shippingCost');
    fetch('/api/get-shipping-fees')
      .then(response => response.json())
      .then(data => {
        this.shippingFees = data;
      })
      .catch(error => {
        console.error(error)
      });
    }
});

app.mount('#ccauth');


