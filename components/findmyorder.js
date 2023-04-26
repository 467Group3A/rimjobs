$(document).ready(function () {
  const app = Vue.createApp({
    data() {
      return {
        orderToFind: '',
        order: null,
        error: null,
      };
    },
    computed: {

    },
    mounted() {

    },
    methods: {
      searchForOrder() {
        fetch('/api/find-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderId: this.orderToFind,
            })
          })
          .then(response => {
            if(response.status == 200) {  
                return response.json()
            } else if (response.status == 404) {
              this.error = 'Order not found';
            }
        })
          .then(data => {
            if(data){
              this.order = data
            }
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
  }).mount('#app')
})
