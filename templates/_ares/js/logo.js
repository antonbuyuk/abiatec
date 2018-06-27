if ($(window).width() > '640' && $('#canvas').length) {
    (function() {
        var lastTime = 0;
        var vendors = ['ms', 'moz', 'webkit', 'o'];
        for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
                window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                    timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    var Nodes = {

        // Settings
        density: 16,

        drawDistance: 24,
        baseRadius: 4,
        maxLineThickness: 4,
        reactionSensitivity: 3,
        lineThickness: 1,

        points: [],
        mouse: { x: -10, y: -10, down: false },

        animation: null,

        canvas: null,
        context: null,

        imageInput: null,
        bgImage: null,
        bgCanvas: null,
        bgContext: null,
        bgContextPixelData: null,

        init: function() {
            // Set up the visual canvas 
            this.canvas = document.getElementById('canvas');
            this.context = canvas.getContext('2d');
            this.context.globalCompositeOperation = "lighter";
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.canvas.style.display = 'block'

            this.imageInput = document.createElement('input');
            this.imageInput.setAttribute('type', 'file');
            this.imageInput.setAttribute('style', 'display: none');
            this.imageInput.style.visibility = 'hidden';
            this.imageInput.addEventListener('change', this.upload, false);
            document.body.appendChild(this.imageInput);

            this.canvas.addEventListener('mousemove', this.mouseMove, false);
            this.canvas.addEventListener('mousedown', this.mouseDown, false);
            this.canvas.addEventListener('mouseup', this.mouseUp, false);
            this.canvas.addEventListener('mouseout', this.mouseOut, false);

            window.onresize = function(event) {
                Nodes.canvas.width = window.innerWidth;
                Nodes.canvas.height = window.innerHeight;
                Nodes.onWindowResize();
            }

            // Load initial input image (the chrome logo!)
            this.loadData('data:image/png;base64,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');
        },

        preparePoints: function() {

            // Clear the current points
            this.points = [];

            var width, height, i, j;

            var colors = this.bgContextPixelData.data;

            for (i = 0; i < this.canvas.height; i += this.density) {

                for (j = 0; j < this.canvas.width; j += this.density) {

                    var pixelPosition = (j + i * this.bgContextPixelData.width) * 4;

                    // Dont use whiteish pixels
                    if (colors[pixelPosition] > 200 && (colors[pixelPosition + 1]) > 200 && (colors[pixelPosition + 2]) > 200 || colors[pixelPosition + 3] === 0) {
                        continue;
                    }

                    var color = 'rgba(' + colors[pixelPosition] + ',' + colors[pixelPosition + 1] + ',' + colors[pixelPosition + 2] + ',' + '1)';
                    this.points.push({ x: j, y: i, originalX: j, originalY: i, color: color });

                }
            }
        },

        updatePoints: function() {

            var i, currentPoint, theta, distance;

            for (i = 0; i < this.points.length; i++) {

                currentPoint = this.points[i];

                theta = Math.atan2(currentPoint.y - this.mouse.y, currentPoint.x - this.mouse.x);

                if (this.mouse.down) {
                    distance = this.reactionSensitivity * 200 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
                        (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));
                } else {
                    distance = this.reactionSensitivity * 100 / Math.sqrt((this.mouse.x - currentPoint.x) * (this.mouse.x - currentPoint.x) +
                        (this.mouse.y - currentPoint.y) * (this.mouse.y - currentPoint.y));
                }


                currentPoint.x += Math.cos(theta) * distance + (currentPoint.originalX - currentPoint.x) * 0.05;
                currentPoint.y += Math.sin(theta) * distance + (currentPoint.originalY - currentPoint.y) * 0.05;

            }
        },

        drawLines: function() {

            var i, j, currentPoint, otherPoint, distance, lineThickness;

            for (i = 0; i < this.points.length; i++) {

                currentPoint = this.points[i];

                // Draw the dot.
                this.context.fillStyle = currentPoint.color;
                this.context.strokeStyle = currentPoint.color;

                for (j = 0; j < this.points.length; j++) {

                    // Distaqnce between two points.
                    otherPoint = this.points[j];

                    if (otherPoint == currentPoint) {
                        continue;
                    }

                    distance = Math.sqrt((otherPoint.x - currentPoint.x) * (otherPoint.x - currentPoint.x) +
                        (otherPoint.y - currentPoint.y) * (otherPoint.y - currentPoint.y));

                    if (distance <= this.drawDistance) {

                        this.context.lineWidth = (1 - (distance / this.drawDistance)) * this.maxLineThickness * this.lineThickness;
                        this.context.beginPath();
                        this.context.moveTo(currentPoint.x, currentPoint.y);
                        this.context.lineTo(otherPoint.x, otherPoint.y);
                        this.context.stroke();
                    }
                }
            }
        },

        drawPoints: function() {

            var i, currentPoint;

            for (i = 0; i < this.points.length; i++) {

                currentPoint = this.points[i];

                // Draw the dot.
                this.context.fillStyle = currentPoint.color;
                this.context.strokeStyle = currentPoint.color;

                this.context.beginPath();
                this.context.arc(currentPoint.x, currentPoint.y, this.baseRadius, 0, Math.PI * 2, true);
                this.context.closePath();
                this.context.fill();

            }
        },

        draw: function() {
            this.animation = requestAnimationFrame(function() { Nodes.draw() });

            this.clear();
            this.updatePoints();
            this.drawLines();
            this.drawPoints();

        },

        clear: function() {
            this.canvas.width = this.canvas.width;
        },

        // The filereader has loaded the image... add it to image object to be drawn
        loadData: function(data) {

            this.bgImage = new Image;
            this.bgImage.src = data;

            this.bgImage.onload = function() {

                //this
                Nodes.drawImageToBackground();
            }
        },

        // Image is loaded... draw to bg canvas
        drawImageToBackground: function() {

            this.bgCanvas = document.createElement('canvas');
            this.bgCanvas.width = this.canvas.width;
            this.bgCanvas.height = this.canvas.height;

            var newWidth, newHeight;

            // If the image is too big for the screen... scale it down.
            if (this.bgImage.width > this.bgCanvas.width - 100 || this.bgImage.height > this.bgCanvas.height - 100) {

                var maxRatio = Math.max(this.bgImage.width / (this.bgCanvas.width - 100), this.bgImage.height / (this.bgCanvas.height - 100));
                newWidth = this.bgImage.width / maxRatio;
                newHeight = this.bgImage.height / maxRatio;

            } else {
                newWidth = this.bgImage.width;
                newHeight = this.bgImage.height;
            }

            // Draw to background canvas
            this.bgContext = this.bgCanvas.getContext('2d');
            this.bgContext.drawImage(this.bgImage, (this.canvas.width - newWidth) / 2, (this.canvas.height - newHeight) / 2, newWidth, newHeight);
            this.bgContextPixelData = this.bgContext.getImageData(0, 0, this.bgCanvas.width, this.bgCanvas.height);

            this.preparePoints();
            this.draw();
        },

        mouseDown: function(event) {
            Nodes.mouse.down = true;
        },

        mouseUp: function(event) {
            Nodes.mouse.down = false;
        },

        mouseMove: function(event) {
            Nodes.mouse.x = event.offsetX || (event.layerX - Nodes.canvas.offsetLeft);
            Nodes.mouse.y = event.offsetY || (event.layerY - Nodes.canvas.offsetTop);
        },

        mouseOut: function(event) {
            Nodes.mouse.x = -1000;
            Nodes.mouse.y = -1000;
            Nodes.mouse.down = false;
        },

        // Resize and redraw the canvas.
        onWindowResize: function() {
            cancelAnimationFrame(this.animation);
            this.drawImageToBackground();
        }
    }

    setTimeout(function() {
        Nodes.init();
    }, 10);
}