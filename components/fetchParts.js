// This file is used to fetch the parts from the database and display them on the page
// The page number is incremented or decremented when the user clicks the next or previous page buttons
// Another way to do this would be to append the page number to the end of the URL.
// Like so:
// .com/legacy-parts?page=1
// .com/legacy-parts?page=2
// .com/legacy-parts?page=3
//
// TODO:
// 1. Add a search bar to search for parts
//
$(document).ready(function() {
    legacyParts = '/legacy-parts?page=';
    pageNumber = 1;
    const app = Vue.createApp({
        data() {
            return {
                data: []
            };
        },
        mounted() {
            fetch(legacyParts + pageNumber)
                .then(response => response.json())
                .then(data => {
                    this.data = data;
                })
                .catch(error => {
                    console.log('Error:', error);
                });
        },
        template: `
        <div class="container-lg borderSilver">
            <div id="items" v-cloak>
                <hr />
                <div class="container">
                    <div class="row">
                        <div v-for="info in data.data" class="col-md-4 mb-3">
                            <div class="card h-100">
                                <div class="labels d-flex justify-content-between position-absolute w-100">
                                </div>
                                <a href="#">
                                    <img v-bind:src="info.pictureURL" class="card-img-top" alt="Product">
                                </a>
                                <div class="card-body px-2 pb-2 pt-1">
                                    <div class="d-flex justify-content-between">
                                        <div>
                                            <p class="h4 text-primary"> \${{ fix(info.price) }} </p>
                                        </div>
                                    </div>
                                    <p class="mb-0">
                                        <strong>
                                            <a href="#" class="text-secondary">{{ capitalize(info.description) }} </a>
                                        </strong>
                                    </p>
                                    <p class="mb-1">
                                        <small>
                                            <a href="#" class="text-secondary"> Ege Brands </a>
                                        </small>
                                    </p>
                                    <div class="d-flex mb-3 justify-content-between">
                                        <div>
                                            <p class="mb-0 small"><b>WEIGHT: </b> {{ fix(info.weight) }} lbs. </p>
                                            <p class="mb-0 small"><b>PART#: </b> {{ info.number }}</p>
                                            <p class="mb-0 small"><b>MPN#: </b> EG-000{{ info.number }}</p>
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <div class="col px-0">
                                            <button class="btn btn-outline-primary btn-block"> Add To Cart
                                                <i class="fa fa-shopping-basket" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                        <div class="ml-2">
                                            <select class="form-control">
                                                <option>1</option>
                                                <option>2</option>
                                                <option>3</option>
                                                <option>4</option>
                                                <option>5</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <button class="btn btn-light btn-block" style="width: 100%; height: 4rem;" @click="subPage()">Previous Page</button>
                </div>
                <div class="col-md-6">
                    <button class="btn btn-light btn-block" style="width: 100%; height: 4rem;" @click="addPage()">Next Page</button>
                </div>
            </div>
            <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
        </div>
        `,
        methods: {
            // Formats the price to 2 decimal places
            fix(num) {
                return num.toFixed(2);
            },
            //
            // Capitalizes the first letter of each word
            capitalize(str) {
                return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
            },
            //
            // Increments the page number and fetches the next page
            subPage() {
                if (pageNumber > 1) {
                    pageNumber--;
                    fetch(legacyParts + pageNumber)
                        .then(response => response.json())
                        .then(data => {
                            this.data = data;
                        })
                        .catch(error => {
                            console.log('Error:', error);
                        });
                }
            },
            //
            // Increment the page number and fetches the next page
            addPage() {
                pageNumber++;
                fetch(legacyParts + pageNumber)
                    .then(response => response.json())
                    .then(data => {
                        this.data = data;
                    })
                    .catch(error => {
                        console.log('Error:', error);
                    });
            }
        }
    }).mount('#items');
});