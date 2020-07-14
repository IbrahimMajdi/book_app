'use strict'


$(".selectBook").on('click', function () {
    $(this).next().toggleClass("show_form")
})

$(".updatedetails").on('click', function () {
    $(this).next().toggleClass("show_form")
})