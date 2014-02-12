/*!!
all the RTL logic the first time the toolbar loaded is not working, because the design object is not ready yet
and we dont know that the toolbar is RTL. 
so, when the design is ready we update the YoxScroll options object using the public updateDirection() function.
and we call init again in order to initialize the plugin behavior according to the new direction.
*/
function YoxScroll(container, el, options, floatDir) {

    this.scroll = {};
    this.step = {};
    
    var containerDimensions,
		currentPos = { left: (floatDir === 'right') ? parseInt(el.style.right) : parseInt(el.style.left), top: el.style.top },
		currentDirection = {},
		currentAngle = Math.PI,
		interval,
		self = this,
		isMoving = false,
		minPosition,
		eventHandlers = { onStop: [], onScrollStart: [], onUpdate: [] };

    options.velocity = options.velocity || 5;
    options.delay = options.delay || (1000 / 40);
    options.stopDistance = options.stopDistance || 250;
    options.stepDistance = options.stepDistance || 30;

    options.direction = {
        horizontal: options.direction && options.direction.horizontal ? options.direction.horizontal : "left",
        vertical: options.direction && options.direction.vertical ? options.direction.vertical : "top" // top to bottom
    };

    // update the plugin property. happens when the toolbar is rtl
    // and we know about it after the toolbar was initialized.
   /* function setDirection(dir) {
        options.direction.horizontal = dir;
    }*/

    function checkMinPosition(orientation) {
        var currentPosition = currentPos[orientation];
        if (currentPosition && !isNaN(currentPosition) && currentPosition < minPosition[orientation]) {
            el.style[options.direction.horizontal] = minPosition[orientation] + "px";
            currentPos[orientation] = minPosition[orientation];
        }
    }

    function setDimensions() {
        containerDimensions = { width: container.clientWidth, height: container.clientHeight };
        minPosition = {
            left: Math.min(options.orientation !== "vertical" ? containerDimensions.width - el.clientWidth : 0, 0),
            top: Math.min(options.orientation !== "horizontal" ? containerDimensions.height - el.clientHeight : 0, 0)
        };

        checkMinPosition("left");
        checkMinPosition("top");

        //triggerEvent("onUpdate", { isLeftLimit: currentPos.left === minPosition.left, isRightLimit: currentPos.left === 0 });
    }


   
    function init() {

        var dirFactor = {
            horizontal: options.direction.horizontal === "right" ? -1 : 1,
            vertical: options.direction.vertical === "bottom" ? -1 : 1
        };

        var sides = {
            left: {
                left: 1 * dirFactor.horizontal,
                right: -1 * dirFactor.horizontal
            },
            top: {
                top: 1 * dirFactor.vertical,
                bottom: -1 * dirFactor.vertical
            }
        };

        setDimensions();
        if (options.eventHandlers) {
            for (var eventName in options.eventHandlers) {
                eventHandlers[eventName].push(options.eventHandlers[eventName]);
            }
        }

        for (orientation in sides) {
            if (orientation === "left" && options.orientation !== "vertical" || orientation === "top" && options.orientation !== "horizontal") {
                var directions = sides[orientation];
                for (direction in directions) {
                    self.scroll[direction] = prepareScroll(orientation, directions[direction]);
                    self.step[direction] = prepareStep(orientation, directions[direction]);
                }
            }
        }
    }
    init();

    // update the plugin property. happens when the toolbar is rtl
    // and we know about it after the toolbar was initialized.
    function setDirection(dir) {
        options.direction.horizontal = dir;
        init();
    }



    function getPosition() {
        return { left: parseInt(el.style[options.direction.horizontal], 10) || 0, top: parseInt(el.style[options.direction.vertical], 10) || 0 };
    }

    function reset() {
        clearInterval(interval);
        interval = null;
        currentPos = getPosition();
    }

    function triggerEvent(eventName, data) {
        var eventHandlersArray = eventHandlers[eventName];
        if (eventHandlersArray) {
            for (var i = 0, count = eventHandlersArray.length; i < count; i++) {
                eventHandlersArray[i](data);
            }
        }
    }

    function move(distance , delay, callback) {
        triggerEvent("onScrollStart");
        var elRect = el.getClientRects()[0],
			moveVertical = options.orientation !== "horizontal" && !isNaN(distance.top) && !!distance.top,
			moveHorizontal = options.orientation !== "vertical" && !isNaN(distance.left) && !!distance.left;

        if (!moveVertical && !moveHorizontal) {
            isMoving = false;
            triggerEvent("onStop", { isLeftLimit: currentPos.left === minPosition.left, isRightLimit: currentPos.left === 0 });
			if (callback){
				callback();
			}
            return;
        }

        var r,
			angle = currentAngle,
			angleStep,
			prepareGetPosition = function (orientation) {
			    var init = currentPos[orientation] || 0;

			    return function (angle) {
			        var newPos = init + r[orientation] * (Math.cos(angle) + 1),
						newPosRound = Math.round(newPos);

			        el.style[options.direction.horizontal] = newPos + "px";

			        currentAngle = angle;
			        if (newPosRound === distance[orientation] + init) {
			            reset();
			            currentAngle = Math.PI;
			            currentDirection = null;
			            isMoving = false;
			            triggerEvent("onStop", { isLeftLimit: newPosRound === minPosition.left, isRightLimit: newPosRound === 0 });
						if (callback){
							callback();
						}						
			        }
			    };
			},
			setPositionTop = moveVertical ? prepareGetPosition("top") : null,
			setPositionLeft = moveHorizontal ? prepareGetPosition("left") : null,
			start = function () {
			    return setInterval(function () {
			        angle += angleStep;
			        if (setPositionTop)
			            setPositionTop(angle);
			        if (setPositionLeft)
			            setPositionLeft(angle);
			    }, delay);
			};

        distance = { top: distance.top || 0, left: distance.left || 0 };
        r = { left: distance.left / 2, top: distance.top / 2 };
        angleStep = Math.PI / (Math.max(Math.abs(distance.left), Math.abs(distance.top)) / options.velocity);

        currentDirection = { left: distance.left / Math.abs(distance.left), top: distance.top / Math.abs(distance.top) };
        return (interval = start());
    }

    function prepareScroll(orientation, direction) {
        var distanceObj = {};
        return function (distance, delay, callback) {
            var distanceToEnd,
				vectorDistance;

            reset();
            distanceToEnd = direction === 1 ? Math.abs(parseInt(el.style[options.direction.horizontal], 10)) : minPosition[orientation] - currentPos[orientation];

            if (typeof (distance) === "undefined" || distance === null) {
                distance = distanceToEnd;
            }
            else {
                vectorDistance = Math.abs(distance) * direction;
                distance = direction === 1 ? Math.min(vectorDistance, distanceToEnd) : Math.max(vectorDistance, distanceToEnd);
            }
            distanceObj[orientation] = Math.round(distance);
			if (typeof (delay) === "undefined" || delay === null){
				delay = options.delay;
			}
            isMoving = true;
            move(distanceObj, delay, callback);
        };
    }

    function prepareStep(orientation, direction) {
        return function () {
            var distanceToEnd = direction === 1
				? Math.abs(parseInt(el.style[options.direction.horizontal], 10))
				: minPosition[orientation] - currentPos[orientation];

            var distance = Math.min(Math.abs(distanceToEnd), options.stepDistance);
            if (!distance) {
                var stopEventData = { isLeftLimit: currentPos.left === minPosition.left, isRightLimit: currentPos.left === 0 };
                triggerEvent("onStop", stopEventData);
            }
            else {
                currentPos[orientation] += direction * distance;

                var distanceObj = {};
                distanceObj[orientation] = direction * distance;

                el.style[options.direction.horizontal] = currentPos[orientation] + "px";
            }
        };
    }

   // this.scroll = {};
  //  this.step = {};

    this.stop = function () {
        if (!isMoving)
            return false;

        if (!currentDirection) {
            var stopEventData = { isLeftLimit: currentPos.left === minPosition.left, isRightLimit: currentPos.left === 0 };

            triggerEvent("onStop", stopEventData);
            return false;
        }

        var prevPos = { left: currentPos.left, top: currentPos.top },
			stopDistance = {};

        reset();

        for (orientation in currentPos) {
            if (!isNaN(currentDirection[orientation])) {
                stopDistance[orientation] = currentDirection[orientation] * Math.min(Math.abs(currentPos[orientation] - prevPos[orientation]) * 2, options.stopDistance);
                currentPos[orientation] = currentPos[orientation] - stopDistance[orientation] / 2;
            }
        }

        for (orientation in currentPos) {
            if (!isNaN(currentDirection[orientation])) {
                if (currentPos[orientation] + stopDistance[orientation] < minPosition[orientation])
                    stopDistance[orientation] = minPosition[orientation] - currentPos[orientation];
                else if (currentPos[orientation] + stopDistance[orientation] > 0)
                    stopDistance[orientation] = Math.abs(currentPos[orientation]);
            }
        }

        currentAngle = Math.max(1.5 * Math.PI, currentAngle);
        move(stopDistance, options.delay);
    };

    this.update = setDimensions;

    function resetOrientation(orientation) {
        var dir = options.direction[orientation];
        if (!isNaN(currentPos[dir])) {
            el.style[dir] = "0";
            currentPos[dir] = 0;
        }
    }
    this.reset = function () {
        resetOrientation("horizontal");
        resetOrientation("vertical");
    };

    this.updateDirection = function (dir) {
        setDirection(dir);
    }

    this.onNewAppsAdd_Scroll = function (callback) {

        $('#scrollPanel').animate({
            'left': 0
        }, function () {
            callback();
        })
    };
}
