// This file is used to fetch the navbar from the server and insert it into the DOM
// This file is also used to add the hover effects to the navbar
$(document).ready(function () {
    const nav = Vue.createApp({
        data() {
            return {
                arg: null
            }
        },
        template: `
        <nav class="navbar navbar-expand-lg UltorBG borderSilver">
            <div class="container-fluid">
                <a class="navbar-brand" href="">
                    <img src="../assets/img/Logo2x.png" alt="Rim Jobs" width="320" height="40">
                </a>
                <div class="collapse navbar-collapse" id="collapsibleNavId">
                    <ul class="navbar-nav me-auto mt-2 mt-lg-0">
                        <li class="nav-item">
                            <a id="bouncify" class="nav-link Stillwater fs-5" href="">
                                <i class="fa-solid fa-warehouse"></i> Home</a>
                        </li>
                        <li class="nav-item">
                            <a id="spinnify" class="nav-link Stillwater fs-5" href="">
                                <i class="fas fa-dharmachakra"></i> View All Products</a>
                        </li>
                        <li class="nav-item">
                            <a id="bouncify2" class="nav-link Stillwater fs-5" href="">
                                <i class="fas fa-truck-plane"></i> Find My Order</a>
                        </li>
                        <li class="nav-item">
                            <a id="bouncify3" class="nav-link Stillwater fs-5" href="">
                                <i class="fas fa-door-closed"></i> Employee Portal</a>
                        </li>
                    </ul>
                    <a class="nav-link justify-content-end Stillwater fs-5" href="">
                        <i class="fas fa-shopping-cart"></i> My Cart:
                        <span class="fw-2">(0)</span> </a>
                </div>
            </div>
        </nav>
        `}).mount('#navbar')
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