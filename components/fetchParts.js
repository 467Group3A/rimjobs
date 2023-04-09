// This file is used to fetch the parts from the database and display them on the page
// The page number is incremented or decremented when the user clicks the next or previous page buttons
// Another way to do this would be to append the page number to the end of the URL.
// Like so:
// .com/legacy-parts?page=1 & per=30
// .com/legacy-parts?page=2 & per=10
// .com/legacy-parts?page=3 & per=25
//
$(document).ready(function () {
    endpoint = '/legacyparts?page=';
    pageNumber = 1;
    perQuery = '&per=';
    // Change this number to get more or less per page
    perPage = 30;
    const app = Vue.createApp({
        data() {
            return {
                finalRows: [],
                searchFor: '',
                minPrice: null,
                maxPrice: null
            };
        },
        computed: {
            filteredParts() {
                let parts = this.finalRows.filter(part => {
                    return part.description.toLowerCase().includes(this.searchFor.toLowerCase());
                });

                if (this.minPrice !== null && this.maxPrice !== null && this.minPrice !== '' && this.maxPrice !== '') {
                    parts = parts.filter(part => {
                        return parseFloat(part.price) >= parseFloat(this.minPrice) &&
                            parseFloat(part.price) <= parseFloat(this.maxPrice);
                    });
                }

                return parts;
            }
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
            //
            // Capitalizes the first letter of each word
            capitalize(str) {
                return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            },
            //
            // Increments the page number and fetches the next page
            subPage() {
                // If youre on the first page, theres nowhere else to go.
                if (pageNumber != 1){
                    pageNumber--;
                }
                fetch(endpoint + pageNumber + perQuery + perPage)
                    .then(response => response.json())
                    .then(data => {
                        this.finalRows = data;
                    })
                    .catch(error => {
                        console.log('Error:', error);
                    });
            },
            //
            // Increment the page number and fetches the next page
            addPage() {
                // If the amount of items displayed does not equal
                // how many should be displayed, you are at the end
                if (this.finalRows.length != perPage) {
                    // Send pack to page 1
                    pageNumber = 1;
                } else {
                    pageNumber++;
                }
                fetch(endpoint + pageNumber + perQuery + perPage)
                    .then(response => response.json())
                    .then(data => {
                        this.finalRows = data;
                    })
                    .catch(error => {
                        console.log('Error:', error);
                    });
            }
        }
    }).mount('#inventory');
});