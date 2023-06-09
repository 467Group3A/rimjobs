// This file is used to fetch the navbar from the server and insert it into the DOM
// This file is also used to add the hover effects to the navbar
$(document).ready(function () {
    const nav = Vue.createApp({
        data() {
            return {
                cartTotal: 0
            }
        },
        template: `
        <nav class="navbar navbar-expand-lg UltorBG borderSilver dropShadow">
            <div class="container-fluid">
                <div class="navbar-brand dropdown">
                    <a class="dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <img src="/img/Logo2x.png" class="dropShadow" alt="Rim Jobs" width="320" height="40">
                    </a>
                    <ul class="dropdown-menu UltorBG borderSilver dropShadow">
                        <li><a class="dropdown-item" href="/"><i class="fa-solid fa-warehouse"></i> Home</a></li>
                        <li><a class="dropdown-item" href="/viewinventory"><i class="fas fa-dharmachakra"></i> View All Products</a></li>
                        <li><a class="dropdown-item" href="/findmyorder"><i class="fas fa-truck-plane"></i> Find My Order</a></li>
                        <li><a class="dropdown-item" href="/employee"><i class="fas fa-door-closed"></i> Employee Portal</a></li>
                        <li><a class="dropdown-item" href="/cart"><i class="fas fa-shopping-cart"></i> My Cart</a></li>
                    </ul>
                </div>
                <div class="collapse navbar-collapse" id="collapsibleNavId">
                    <ul class="navbar-nav me-auto mt-2 mt-lg-0 Stillwater">
                        <li class="nav-item">
                            <a id="bouncify" class="nav-link Stillwater fs-5 dropShadow" href="/">
                                <i class="fa-solid fa-warehouse"></i> Home</a>
                        </li>
                        <li class="nav-item">
                            <a id="spinnify" class="nav-link Stillwater fs-5 dropShadow" href="/viewinventory">
                                <i class="fas fa-dharmachakra"></i> View All Products</a>
                        </li>
                        <li class="nav-item">
                            <a id="bouncify2" class="nav-link Stillwater fs-5 dropShadow" href="/findmyorder">
                                <i class="fas fa-truck-plane"></i> Find My Order</a>
                        </li>
                        <li class="nav-item">
                            <a id="bouncify3" class="nav-link Stillwater fs-5 dropShadow" href="/employee">
                                <i class="fas fa-door-closed"></i> Employee Portal</a>
                        </li>
                    </ul>
                    <a class="nav-link justify-content-end Stillwater fs-5 dropShadow" href="/cart">
                        <i class="fas fa-shopping-cart"></i> My Cart:
                        <span class="fw-2">({{ cartTotal }})</span> </a>
                </div>
            </div>
        </nav>
        `,
    mounted() {
        try {
            this.cartTotal = JSON.parse(localStorage.getItem('cartItems')).length
         } catch (error) {
            this.cartTotal = 0;
         }
        window.addEventListener('ad', (event) => {
            this.cartTotal = this.cartTotal + event.detail.count;
        });
        window.addEventListener('sb', (event) => {
            this.cartTotal = this.cartTotal - event.detail.count;
        });
    },
    beforeUnmount() {
        window.removeEventListener('ad');
        window.removeEventListener('sb');
    }
    }).mount('#navbar')
});

jQuery(document).ready(function ($) {
    $('#bouncify').hover(
        function () { $(this).children('i').addClass('fa-bounce') },
        function () { $(this).children('i').removeClass('fa-bounce') }
    )
});

jQuery(document).ready(function ($) {
    $('#spinnify').hover(
        function () { $(this).children('i').addClass('fa-spin') },
        function () { $(this).children('i').removeClass('fa-spin') }
    )
});

jQuery(document).ready(function ($) {
    $('#bouncify2').hover(
        function () { $(this).children('i').addClass('fa-bounce') },
        function () { $(this).children('i').removeClass('fa-bounce') }
    )
});

jQuery(document).ready(function ($) {
    $('#bouncify3').hover(
        function () { $(this).children('i').addClass('fa-bounce') },
        function () { $(this).children('i').removeClass('fa-bounce') }
    )
});