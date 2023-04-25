// Used to create a new employee/admin login
$(document).ready(function () {
    const app = Vue.createApp({
        data() {
            return {
                username: '',
                password: '',
                password2: '',
                perms: '',
                message: '',
                users: []
            }
        },
        computed: {

        },
        mounted() {
            fetch('/api/get-users')
                .then(response => response.json())
                .then(data => {
                    this.users = data;
                })
                .catch(error => {
                    console.log('Error:', error);
                });
        },
        methods: {
            createUser() {
                if (!this.checkpwMatch()) {
                    this.message = 'Passwords do not match!'
                    return
                }
                // If the passwords match, create a fetch to insert
                const loginInfo = {
                    username: this.username,
                    password: this.password,
                    perms: this.perms
                }

                // Send and check creation of user.
                fetch('/api/create-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginInfo)
                })
                    .then(response => {
                        if (response.status === 200) {
                            this.message = `User: ${this.username} with Permissions: ${this.perms} `
                        } else if (response.status === 500) {
                            this.message = `Cannot connect to the database at this moment, contact an Administrator`
                        } else if (response.status === 501) {
                            this.message = `That username already exists!`
                        } else if (response.status === 502) {
                            this.message = 'Error adding the new user to the databasem, contact an Administrator'
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    })

            },
            checkpwMatch() {
                return this.password.toLowerCase() === this.password2.toLowerCase() ? true : false
            },
            deleteUser(usr) {
                fetch('/api/del-users', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      username: usr
                    })
                  })
                  .then(response => {
                    if (response.ok) {
                      //If success then reload page with new change
                      location.reload()
                    } else {
                      // Otherwise dont refresh and notify in console. user will see no removal
                      console.log("Error removing user.")
                    }
                  })
            }
        }
    }).mount('#app')
})