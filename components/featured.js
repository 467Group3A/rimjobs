$(document).ready(function () {
  endpoint = '/legacyparts?page=';
  pageNumber = 1;
  perQuery = '&per=';
  // Change this number to get more or less per page
  perPage = 6;
  const app = Vue.createApp({
    data() {
      return {
        finalRows: []
      };
    },
    mounted() {
      fetch(endpoint + pageNumber + perQuery + perPage)
        .then(response => response.json())
        .then(data => {
          this.finalRows = data;
          console.log('parts have been received!')
        })
        .catch(error => {
          console.log('Error:', error);
        });
      },
      methods: {
        capitalize(str) {
            return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        },
        // Increments the page number and fetches the next page
        subPage() {
          pageNumber--;
          // If previous page is 0, set the page to 23 (end of DB)
          if (pageNumber == 0) {
            pageNumber = 23;
          }
          fetch(endpoint + pageNumber + perQuery + perPage)
            .then(response => response.json())
            .then(data => {
              this.finalRows = data;
              console.log(`Page #${pageNumber} sent.`)
            })
            .catch(error => {
              console.log('Error:', error);
            });
        },
        //
        // Increment the page number and fetches the next page
        addPage() {
          pageNumber++;
          // If next page is the end, send back to the first
          if (pageNumber == 24) {
            pageNumber = 1;
          }    
          fetch(endpoint + pageNumber + perQuery + perPage)
            .then(response => response.json())
            .then(data => {
              this.finalRows = data;
              console.log(`Page #${pageNumber} sent.`)
            })
            .catch(error => {
              console.log('Error:', error);
            });
        }
      }
    }).mount('#featured');
});