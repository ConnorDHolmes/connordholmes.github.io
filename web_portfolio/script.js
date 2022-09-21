$(document).ready(function() {




    let currentSlide = 1;
    let sliderTransform = ((($(".slider").width() * currentSlide) * -1) + $(".slider").width());

    $(window).resize(function() {
        sliderTransform = ((($(".slider").width() * currentSlide) * -1) + $(".slider").width());
        $(".slides-wrapper").css("transition", "none");
        $(".slides-wrapper").css("transform", "translateX(" + sliderTransform + "px)");
    });


    $(".thumbnail").click(function() {
        currentSlide = $(this).index() + 1;
        $(".thumbnail").removeClass("current-slide");
        $(this).addClass("current-slide");
        $(".slide").removeClass("current-slide");
        $("#slide" + currentSlide).addClass("current-slide")
        sliderTransform = ((($(".slider").width() * currentSlide) * -1) + $(".slider").width());
        $(".slides-wrapper").css("transition", "0.5s transform ease");
        $(".slides-wrapper").css("transform", "translateX(" + sliderTransform + "px)");

    });



});
