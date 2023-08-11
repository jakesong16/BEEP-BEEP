  /*jshint esversion:6*/
function textToSpeech(text) {
  console.log(text)
  if (!textToSpeech.cooldown) {
    if ('speechSynthesis' in window) {
      const synthesis = window.speechSynthesis;

      // Create an utterance
      const utterance = new SpeechSynthesisUtterance();

      // Set default options
      utterance.rate = 1; // Speech rate (0.1 to 10)
      utterance.pitch = 1; // Speech pitch (0 to 2)
      utterance.lang = 'en-US'; // Speech language
      switch (text) {
        case 'detour':
          utterance.text = "Detour ahead";
          break;
        case 'flagger_ahead_sign':
          utterance.text = "Flagger ahead";
          break;
        case 'pedestrian_sign':
          utterance.text = "pedestrian crossing ahead";
          break; 
        case 'road_closed_sign':
          utterance.text = "Road Closed ahead";
          break;
        case 'road_work_ahead_sign':
          utterance.text = "Road work ahead";
          break;
        case 'speed_limit_sign':
          utterance.text = "Speed limit sign ahead";
          break;
        case 'stop_sign':
          utterance.text = "stop sign ahead";
          break;
        case 'traffic-lights':
          utterance.text = "traffic lights ahead";
          break;
        case 'road_work_ahead_sign':
          utterance.text = "pedestrian crossing ahead";
          break;
        case 'yield_sign':
          utterance.text = "yield sign ahead";
          break;
        default:
          utterance.text = ""
          break;
      }

      synthesis.speak(utterance);

      textToSpeech.cooldown = true;
      setTimeout(() => {
        textToSpeech.cooldown = false;
      }, 3000); // Cooldown period of 3 seconds
    } else {
      alert('Speech synthesis is not supported in this browser.');
    }
  } else {
    // Function is on cooldown.
  }
}


$(function () {
    const video = $("video")[0];

    var model;
    var cameraMode = "environment"; // or "user"

    const startVideoStreamPromise = navigator.mediaDevices
        .getUserMedia({
            audio: false,
            video: {
                facingMode: cameraMode
            }
        })
        .then(function (stream) {
            return new Promise(function (resolve) {
                video.srcObject = stream;
                video.onloadeddata = function () {
                    video.play();
                    resolve();
                };
            });
        });

    var publishable_key = "rf_6NnFh3XilOOF9NtIJBxmrdAvTwB2";
    var toLoad = {
        model: "driving-detection-6ea0h",
        version: 2
    };

    const loadModelPromise = new Promise(function (resolve, reject) {
        roboflow
            .auth({
                publishable_key: publishable_key
            })
            .load(toLoad)
            .then(function (m) {
                model = m;
                resolve();
            });
    });

    Promise.all([startVideoStreamPromise, loadModelPromise]).then(function () {
        $("body").removeClass("loading");
        resizeCanvas();
        detectFrame();
    });

    var canvas, ctx;
    const font = "16px sans-serif";

    function videoDimensions(video) {
        // Ratio of the video's intrisic dimensions
        var videoRatio = video.videoWidth / video.videoHeight;

        // The width and height of the video element
        var width = video.offsetWidth,
            height = video.offsetHeight;

        // The ratio of the element's width to its height
        var elementRatio = width / height;

        // If the video element is short and wide
        if (elementRatio > videoRatio) {
            width = height * videoRatio;
        } else {
            // It must be tall and thin, or exactly equal to the original ratio
            height = width / videoRatio;
        }

        return {
            width: width,
            height: height
        };
    }

    $(window).resize(function () {
        resizeCanvas();
    });

    const resizeCanvas = function () {
        $("canvas").remove();

        canvas = $("<canvas/>");

        ctx = canvas[0].getContext("2d");

        var dimensions = videoDimensions(video);
        
        console.log(
            video.videoWidth,
            video.videoHeight,
            video.offsetWidth,
            video.offsetHeight,
            dimensions
        );

        canvas[0].width = video.videoWidth;
        canvas[0].height = video.videoHeight;

        canvas.css({
            width: dimensions.width,
            height: dimensions.height,
            left: ($(window).width() - dimensions.width) / 2,
            top: ($(window).height() - dimensions.height) / 2 + 80
        });

        // document.querySelector(".disp").append(canvas);
      $("body").append(canvas)
    };

    const renderPredictions = function (predictions) {
        var dimensions = videoDimensions(video);

        var scale = 1;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        predictions.forEach(function (prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;

            const width = prediction.bbox.width;
            const height = prediction.bbox.height;

            // Draw the bounding box.
            ctx.strokeStyle = prediction.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(
                (x - width / 2) / scale,
                (y - height / 2) / scale,
                width / scale,
                height / scale
            );
          
           textToSpeech(prediction.class)
            // Draw the label background.
            ctx.fillStyle = prediction.color;
            const textWidth = ctx.measureText(prediction.class).width;
            const textHeight = parseInt(font, 10); // base 10
            ctx.fillRect(
                (x - width / 2) / scale,
                (y - height / 2) / scale,
                textWidth + 8,
                textHeight + 4
            );
        });

        predictions.forEach(function (prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;

            const width = prediction.bbox.width;
            const height = prediction.bbox.height;

            // Draw the text last to ensure it's on top.
            ctx.font = font;
            ctx.textBaseline = "top";
            ctx.fillStyle = "#000000";
            ctx.fillText(
                prediction.class,
                (x - width / 2) / scale + 4,
                (y - height / 2) / scale + 1
            );
        });
    };

    var prevTime;
    var pastFrameTimes = [];
    const detectFrame = function () {
        if (!model) return requestAnimationFrame(detectFrame);

        model
            .detect(video)
            .then(function (predictions) {
                requestAnimationFrame(detectFrame);
                renderPredictions(predictions);

                if (prevTime) {
                    pastFrameTimes.push(Date.now() - prevTime);
                    if (pastFrameTimes.length > 30) pastFrameTimes.shift();

                    var total = 0;
                    _.each(pastFrameTimes, function (t) {
                        total += t / 1000;
                    });

                    var fps = pastFrameTimes.length / total;
                    $("#fps").text(Math.round(fps));
                }
                prevTime = Date.now();
            })
            .catch(function (e) {
                console.log("CAUGHT", e);
                requestAnimationFrame(detectFrame);
            });
    };
});
