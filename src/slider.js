$(function () {
    'use strict';

    theme.sliders = {
        init: function () {
            var sliders = $('div[data-slider]');
            sliders.each(function () {
                var slider = $(this);
                new sliderModule(slider, slider.data("slider"));
            });
        }
    }

    function sliderModule($slider, effect) {
        var _self = this,
            isSliding = effect.toLowerCase() === "slide",
            isFading = effect.toLowerCase() === "fade",
            isLocked = false,
            oldSlide = null,
            effectDuration = 1000, // milliseconds
            // Find elements:
            activeIndex = parseInt($slider.data('slider-active')),
            container = $slider.find('[data-slider-container=true]'),
            slides = container.find('[data-slide-index]'),
            navigation = $slider.find('[data-slide-navigation=true]'),
            navigationItems = navigation.find('[data-slide-index]'),
            prevButton = $slider.find('[data-slide-prev]'),
            nextButton = $slider.find('[data-slide-next]'),
            prevButtonTexts = {
                headline: prevButton.find('[data-slider-text=headline]'),
                linktext: prevButton.find('[data-slider-text=linktext]')
            },
            nextButtonTexts = {
                headline: nextButton.find('[data-slider-text=headline]'),
                linktext: nextButton.find('[data-slider-text=linktext]')
            },
            // Set default values:
            previousIndex = parseInt(prevButton.data('slide-prev')),
            nextIndex = parseInt(nextButton.data('slide-next')),
            currentSlide = $(slides[activeIndex]);

        // If we have less than two slides, it's not really a slider, is it?
        // In that case, stop execution:
        if (slides.length < 2) {
            return;
        }

        function updateIndexes(newIndex, isForward) {
            if (isLocked === false && newIndex !== activeIndex) {

                isLocked = true;

                isForward = calculateNewIndexes(newIndex, isForward);

                oldSlide = $(currentSlide);

                currentSlide = $(slides[activeIndex]);
                updateDOM(isForward);
            }

        }

        function calculateNewIndexes(newIndex, isForward) {
            if (typeof (isForward) === "undefined" || isForward === null) {
                isForward = newIndex > activeIndex;
            }

            activeIndex = newIndex;
            if (newIndex === 0) {
                previousIndex = slides.length - 1;
            } else {
                previousIndex = newIndex - 1;
            }

            if (newIndex === slides.length - 1) {
                nextIndex = 0;
            } else {
                nextIndex = newIndex + 1;
            }

            return isForward;
        }

        function updateDOM(isForward) {

            var startPosition = container.width();

            currentSlide.toggleClass("active", true);

            container.css({
                height: currentSlide.height() + "px"
            });

            currentSlide.css({
                position: "absolute"
            });
            oldSlide.css({
                position: "absolute"
            });

            if (isForward) {
                currentSlide.insertBefore(oldSlide);

            } else {
                currentSlide.insertAfter(oldSlide);

                startPosition = startPosition * -1;
            }

            if (isFading) {
                currentSlide.css({
                    left: "0px",
                    zIndex: "1000",
                    opacity: 0
                });
                oldSlide.css({
                    left: "0px",
                    zIndex: "0",
                    opacity: 1
                });
            } else {
                currentSlide.css({
                    left: startPosition + "px"
                });
            }


            animateDOM(startPosition);
        }

        function animateDOM(startPosition) {
            if (isFading) {
                currentSlide.animate({
                    "opacity": 1
                }, effectDuration);

                oldSlide.animate({
                    "opacity": 0
                }, effectDuration, finishAnimation);

            } else {
                currentSlide.animate({
                    "left": ""
                }, effectDuration);

                oldSlide.animate({
                    "left": (startPosition * -1) + "px"
                }, effectDuration, finishAnimation);

            }
        }

        function finishAnimation() {

            oldSlide.toggleClass("active", false);


            currentSlide.css({
                position: "",
                left: "",
                opacity: ""
            });
            oldSlide.css({
                position: "",
                left: "",
                opacity: ""
            });

            setTexts(nextButtonTexts, $(slides[nextIndex]));
            setTexts(prevButtonTexts, $(slides[previousIndex]));

            navigationItems.each(function (index) {
                var $elm = $(this);
                $elm.toggleClass("active", index === activeIndex);
            });

            isLocked = false;
        }

        function getTexts($slide) {
            var headline = $slide.find("[data-slider-text=headline]").text(),
                linktext = $slide.find("[data-slider-text=linktext]").text();

            return {
                headline: headline,
                linktext: linktext
            };
        }

        function setTexts(button, slide) {
            var text = getTexts(slide);

            button.headline.text(text.headline);
            button.linktext.text(text.linktext);
        }

        function bindEvents() {

            nextButton.click(function () {
                updateIndexes(nextIndex, true);
            });

            prevButton.click(function () {
                updateIndexes(previousIndex, false);
            });

            navigation.on('click', '[data-slide-index]', function () {
                var $elm = $(this),
                    index = parseInt($elm.data('slide-index'));

                updateIndexes(index);
            });
        }

        function bindTouchEvents() {
            var startX = 0,
                nextSlide = null,
                nextSlideIndex = null,
                isForward = true,
                initialPosition = null;

            container.bind("touchstart", function (e) {
                e.preventDefault();
                var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0],
                    elm = $(this).offset(),
                    x = touch.pageX - elm.left;

                if (x < $(this).width() && x > 0) {
                    startX = x;
                }
            });

            container.bind("touchend", function (e) {
                e.preventDefault();
                var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0],
                    elm = $(this).offset(),
                    x = touch.pageX - elm.left,
                    breakPoint = container.width() / 4;


                if (startX - x > breakPoint || x - startX > breakPoint) {
                    calculateNewIndexes(nextSlideIndex, isForward);

                    oldSlide = $(currentSlide);
                    currentSlide = $(slides[nextSlideIndex]);

                    animateDOM(initialPosition);
                } else {
                    oldSlide = $(slides[nextSlideIndex]);

                    animateDOM(initialPosition * -1);
                }

                startX = 0;
                nextSlide = null;
                nextSlideIndex = null;
            });

            container.bind("touchmove", function (e) {
                e.preventDefault();
                var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0],
                    elm = $(this).offset(),
                    x = touch.pageX - elm.left;

                if (x < $(this).width() && x > 0) {
                    var diff = x - startX,
                        nextPosition = 0;

                    container.css({
                        height: currentSlide.height() + "px"
                    });

                    if (diff < 0) {
                        // Drag left:
                        isForward = false;
                        if (nextSlideIndex !== nextIndex) {
                            nextSlideIndex = nextIndex;
                            if (nextSlide !== null) {
                                nextSlide.toggleClass('active', false);
                            }
                            nextSlide = $(slides[nextIndex]);
                            nextSlide.insertAfter(currentSlide);
                            initialPosition = container.width();
                        }

                    } else {
                        // Drag right:
                        isForward = true;
                        if (nextSlideIndex !== previousIndex) {
                            nextSlideIndex = previousIndex;
                            if (nextSlide !== null) {
                                nextSlide.toggleClass('active', false);
                            }
                            nextSlide = $(slides[previousIndex]);
                            nextSlide.insertBefore(currentSlide);
                            initialPosition = (container.width() * -1)
                        }
                    }

                    nextPosition = initialPosition + diff;
                    currentSlide.css({
                        position: "absolute",
                        left: diff + "px"
                    });

                    nextSlide.toggleClass('active', true);
                    nextSlide.css({
                        position: "absolute",
                        left: nextPosition + "px"
                    });
                }
            });
        }

        bindEvents();

        // Use feature detection to wire up touch events, if supported:
        // Touch events make no sense when using anything other than slide as an effect.
        if (isSliding && Modernizr.touch === true) {
            bindTouchEvents();
        }

    }
});