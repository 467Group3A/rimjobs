// Used to verify a employee/admin login
$(document).ready(function () {
    const app = Vue.createApp({
        data() {
           return {
            username: null,
            password: null,
            message: ''
           }
         },
         computed: {
            
         },
         mounted() {

           },
         methods: {
            tryLogin(){
                fetch('/api/login', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: this.username,
                        password: this.password
                    })
                })
                .then(response => {
                    if (response.status === 500) {
                        // invalid username
                        this.message = "Invalid username!"
                    } else if (response.status === 501) {
                        // invalid password
                        this.message = "Invalid password!"
                    } else if (response.status === 200) {
                        // success and redirect
                        this.message = "Success! Redirecting..."
                        setTimeout(function(){
                            window.location.replace('/employee');
                          }, 1500);
                    }
                })
                .catch(error => {
                    console.error(error)
                })
            }          
         }
         
     }).mount('#app')
})