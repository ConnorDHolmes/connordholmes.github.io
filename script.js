function FadeInIframe() {
    let loaded = false;
    $("#screen-sim").on("load", function() {
        $(".screen").css("opacity", "1");
        loaded = true;
    });
    setTimeout(function() {
        if (!loaded) {
            FadeInIframe();
        }
    }, 100);

}


function screenSizer() {
    const screenHeight = $(".panel").outerHeight();
    const screenWidth = $(".panel").outerWidth();
    const frameHeight = $(".screens-frame").outerHeight();
    const frameWidth = $(".screens-frame").outerWidth();

    const percentOfWindowHeight = frameHeight / screenHeight;
    const percentOfWindowWidth = frameWidth / screenWidth;


    if (percentOfWindowWidth > percentOfWindowHeight) {
        $(".perspective-frame").css("transform", "scale("+percentOfWindowHeight+")");

    } else {
        $(".perspective-frame").css("transform", "scale("+percentOfWindowWidth+")");
    }

}

$(document).ready(function() {

    setTimeout(function() {
        $(".wrapper").css("opacity", "1");
    }, 250);

    screenSizer();

    let slide = 1;

    let infoPositioning = 0




    $("#slide"+slide+"").addClass("current");



    const screenSources = {
        1: "firstpage.html",
        2: "https://personaleyeslasvegas.com",
        3: "https://wereinkling.com",
        4: "https://aressecuritycorp.com",
        5: "https://www.seedai.org/",
        6: "https://www.keep-company.com/",
        7: "https://www.vm2020.com/",
    }

    const totalSlides = 7;

    $("#current-slide-number").html(slide);
    $("#total-slide-number").html(totalSlides);

    $(".screen").append('<iframe id="screen-sim" src='+screenSources[slide]+' style="border: none;" height="100%" width="100%" title="Simulated Screen"></iframe>');


    const panel = document.querySelector(".panel");

    let resizeObserver = new ResizeObserver(() => {
        screenSizer();
        if ($(".panel").outerWidth() != 390 && $(".panel").outerWidth() != 1366) {
            $(".screen").css("transition", "0.1s ease opacity");
            $(".screen").css("opacity", "0");
        } else {
            $(".screen").css("transition", "0.3s ease opacity");
            $(".screen").css("opacity", "1");
        }
    });

    resizeObserver.observe(panel);






    $(window).resize(function() {
        $(".perspective-frame").css("transition", "none");
        $(".info-slides-wrapper").css("transition-delay", "0s");
        screenSizer();


        infoPositioning = (($(".info-frame").height() * slide) - $(".info-frame").height()) * -1;
        $(".info-slides-wrapper").css("transform", "translateY("+infoPositioning+"px)");

        setTimeout(function() {
            $(".info-slides-wrapper").css("transition-delay", "0.5s");
        }, 50);
    });




    $("#button-screen-switch").click(function() {
        $(".perspective-frame").css("transition", "transform linear 0s");
        if ($(".panel").hasClass("phone")) {
            $(".panel").removeClass("phone");
            $(".panel").addClass("desktop");
            $(".screen-toggle").removeClass("phone");
            $(".screen-toggle").addClass("desktop");
        } else {
            $(".panel").removeClass("desktop");
            $(".panel").addClass("phone");
            $(".screen-toggle").removeClass("desktop");
            $(".screen-toggle").addClass("phone");
        }
    });




    $("#button-prev-slide").click(function() {
        if (slide > 1) {
            slide +=-1;
            $("#button-next-slide").removeClass("last");
            $(".info-slide").removeClass("current");
            $("#slide"+slide+"").addClass("current");
            $(".screen").css("opacity", "0");
            setTimeout(function() {
                $(".screen").children().remove();
                $(".screen").append('<iframe id="screen-sim" src='+screenSources[slide]+' style="border: none;" height="100%" width="100%" title="Simulated Screen"></iframe>');
            }, 500);
            FadeInIframe();
            $("#current-slide-number").html(slide);
            $("#total-slide-number").html(totalSlides);
            if (slide === 1) {
                $("#button-prev-slide").addClass("last");
            }
            infoPositioning = (($(".info-frame").height() * slide) - $(".info-frame").height()) * -1;
            $(".info-slides-wrapper").css("transform", "translateY("+infoPositioning+"px)");
        }
    });

    $("#button-next-slide").click(function() {
        if (slide < 7) {
            slide +=1;
            $("#button-prev-slide").removeClass("last");
            $(".info-slide").removeClass("current");
            $("#slide"+slide+"").addClass("current");
            $(".screen").css("opacity", "0");
            setTimeout(function() {
                $(".screen").children().remove();
                $(".screen").append('<iframe id="screen-sim" src='+screenSources[slide]+' style="border: none;" height="100%" width="100%" title="Simulated Screen"></iframe>');
            }, 500);
            FadeInIframe();
            $("#current-slide-number").html(slide);
            $("#total-slide-number").html(totalSlides);
            if (slide === 7) {
                $("#button-next-slide").addClass("last");
            }
            infoPositioning = (($(".info-frame").height() * slide) - $(".info-frame").height()) * -1;
            $(".info-slides-wrapper").css("transform", "translateY("+infoPositioning+"px)");
        }
    });






});
