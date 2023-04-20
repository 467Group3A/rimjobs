// Used for employee portal
$(document).ready(function () {
    const app = Vue.createApp({
        data() {
           return {
            isAdmin: null,
            logoutMessage: ''
           }
         },
         computed: {
            
         },
         mounted() {
            fetch('/api/userRole')
                .then(response => {
                    if (response.status === 200) {
                        // is an admin
                        this.isAdmin = true;
                    } 
                })
                .catch(error => {
                    console.error(error)
                })
           },
         methods: {
            logout() { // Destroys an employee/admin session sending them to home page
                fetch('/api/logout')
                .then(response => {
                    // check status
                })
                .catch(error => {
                    console.error(error)
                }) 
                // quick fix
                //window.location.replace('/')
                // Gave some time for the client to
                this.logoutMessage = "Logging out..."
                setTimeout(function(){
                    window.location.replace('/');
                  }, 500);
            }
         
         }
         
     }).mount('#app')
})