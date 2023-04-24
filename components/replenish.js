// Used for /replenish
$(document).ready(function () {
    const app = Vue.createApp({
        data() {
          return {
            partInfo: [],
            partId: null,
            quantity: null,
          };
        },
        mounted() {
          this.fetchParts()
        },
        computed: {
          findCurrentPart() { 
            // Checks if partId actually is found in partInfo array
            // matchingParts will contain all that match
            let matchingParts = this.partInfo.filter(part => {
              return part.number == this.partId;
            });

            // If theres not 1 or more matching part with partID, set placeholder
            if(matchingParts.length == 0) {
              matchingParts.push({number: "X", description: "No matching part found", pictureURL: "/img/FlashyRims.webp", amount: 0});
            }

            return matchingParts;
          }
        },
        methods: {
          submitReplenish() { // Used when adding a specified quantity to inventory
            fetch('/api/replenish', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                partId: this.partId,
                quantity: this.quantity
              })
            })
            .then(response => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error('Network response was not ok.');
              }
            })
            .then(data => {
              // Update local json instead of quering db every time
              const part2Update = this.partInfo.find(part => part.number == this.partId)
              if(part2Update){
                part2Update.amount = part2Update.amount + this.quantity
              }
              this.quantity = null;
            })
            .catch(error => {
              console.error('There was a problem with the fetch operation:', error);
            });
          },
          submitRemoval() { // Used when removing a specified quantity from inventory
            fetch('/api/replenish/removal', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                partIdR: this.partId,
                quantityR: this.quantity
              })
            })
            .then(response => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error('Network response was not ok.');
              }
            })
            .then(data => {
              // Update local json instead of quering db every time
              const part2Update = this.partInfo.find(part => part.number == this.partId)
              if(part2Update){
                if(part2Update.amount - this.quantity < 0){
                  // Print alert, backend handles the problem and does not update
                  alert(`Unable to remove more then in stock! \n No changes have been made.`)
                }
                else{
                  part2Update.amount = part2Update.amount - this.quantity
                }
              }
              this.quantity = null;
            })
            .catch(error => {
              console.error('There was a problem with the fetch operation:', error);
            });
          },
          fetchParts() {  // Used to fetch parts/inventory from db
            fetch('/api/combine-parts-quantity')
            .then(response => response.json())
            .then(data => {
              this.partInfo = data
            })
            .catch(err => {
              console.log("Unable to fetch parts")
            })
          },
          updateCurrenPart() { // Listener to update v-for upon form input for partID
            this.$forceUpdate(); 
          }
        }
      })
      app.mount('#app');
})