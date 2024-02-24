document.addEventListener('DOMContentLoaded', function () {

    let floorCountEl = document.querySelector("#floorsInput");
    let liftCountEl = document.querySelector("#liftsInput");
    const liftsContainerEl = document.querySelector("#lifts-container");
    let liftsData = [], liftsQueue = [];
    const liftDoorTime = 2500, liftPerFloorTime = 2000;



    const generateButton = document.querySelector("#generate");
    generateButton.addEventListener("click", () => {
        destroy();
        const inputData = validateInput();
        if (inputData === -1) return;
        init(inputData.floorCount, inputData.liftCount);
        initializeLifts();
    }
    );


    floorCountEl.addEventListener('change', function () {
        generateButton.disabled = false;
    });
    liftCountEl.addEventListener('change', function () {
        generateButton.disabled = false;
    });

    function validateInput() {
        let floorCount = parseInt(floorCountEl.value);
        let liftCount = parseInt(liftCountEl.value);

        if (isNaN(floorCount) || floorCount <= 1 || !Number.isInteger(floorCount)) {
            floorsError.style.display = 'block';
            generateButton.disabled = true;
            return -1;
        } else {
            floorsError.style.display = 'none';
        }
        if (isNaN(liftCount) || liftCount <= 0 || !Number.isInteger(liftCount)) {
            liftsError.style.display = 'block';
            generateButton.disabled = true;
            return -1;
        } else {
            liftsError.style.display = 'none';
        }
        return { floorCount, liftCount };
    }

    function destroy() {
        liftsData = [];
        liftsQueue = [];
        liftsContainerEl.innerHTML = "";
    }

    function init(floorCount, liftCount) {
        for (let i = 0; i < floorCount; i++) {
            let floorDiv = document.createElement("div");
            floorDiv.classList.add("floor");
            floorDiv.id = `floor${floorCount - 1 - i}`;

            let floorControls = document.createElement("div");
            floorControls.classList.add("floor-controls");

            let floorNumber = document.createElement("div");
            floorNumber.classList.add("floor-number");
            floorNumber.innerText = `${floorCount - 1 - i}`;
            floorControls.appendChild(floorNumber);

            let floorButtonsWrapper = document.createElement("div");
            floorButtonsWrapper.classList.add("floor-buttons-wrapper");

            let upButton, downButton;
            if (i == 0) {
                downButton = document.createElement("button");
                downButton.id = `down-button${floorCount - 1 - i}`;
                downButton.classList.add("floor-button");
                downButton.setAttribute('target-floor', floorCount - 1 - i);
                downButton.innerText = "v";
                downButton.addEventListener("click", (e) => pushToLiftsQueue(e));
                floorButtonsWrapper.appendChild(downButton);
            } else if (i == floorCount - 1) {
                upButton = document.createElement("button");
                upButton.classList.add("floor-button");
                upButton.id = `up-button${floorCount - 1 - i}`;
                upButton.innerText = "^";
                upButton.setAttribute('target-floor', floorCount - 1 - i);
                upButton.addEventListener("click", (e) => pushToLiftsQueue(e));
                floorButtonsWrapper.appendChild(upButton);

            } else {
                upButton = document.createElement("button");
                upButton.classList.add("floor-button");
                upButton.id = `up-button${floorCount - 1 - i}`;
                upButton.innerText = "^";

                downButton = document.createElement("button");
                downButton.id = `down-button${floorCount - 1 - i}`;
                downButton.classList.add("floor-button");
                downButton.innerText = "v";

                downButton.setAttribute('target-floor', floorCount - 1 - i);
                upButton.setAttribute('target-floor', floorCount - 1 - i);

                upButton.addEventListener("click", (e) => pushToLiftsQueue(e));
                downButton.addEventListener("click", (e) => pushToLiftsQueue(e));

                floorButtonsWrapper.appendChild(upButton);
                floorButtonsWrapper.appendChild(downButton);
            }


            floorControls.appendChild(floorButtonsWrapper);
            floorDiv.appendChild(floorControls);

            liftsContainerEl.appendChild(floorDiv);

        }

        let liftWrapper = document.createElement("div");
        liftWrapper.classList.add("lift-wrapper");
        for (let j = 0; j < liftCount; j++) {
            let liftDiv = document.createElement("div");
            liftDiv.classList.add("lift");
            liftDiv.id = `lift${j}`;
            liftDiv.setAttribute("data-current-floor", 0);
            liftDiv.setAttribute("data-is-moving", false);
            liftWrapper.appendChild(liftDiv);

            let doorLeft = document.createElement("span");
            let doorRight = document.createElement("span");
            doorLeft.classList.add("door-left", "door");
            doorRight.classList.add("door-right", "door");
            liftDiv.appendChild(doorLeft);
            liftDiv.appendChild(doorRight);
        }

        let firstFloor = document.querySelector("#floor0");
        firstFloor.appendChild(liftWrapper);
    }


    const initializeLifts = () => {
        for (let i = 0; i < Number(liftCountEl.value); i++) {
            const liftElement = document.getElementById(`lift${i}`);
            liftsData.push({
                liftElement,
                floor: 0,
                isMoving: false
            });
        }
    };

    function pushToLiftsQueue(e) {
        const targetFloor = e.target.getAttribute('target-floor');
        for (let req in liftsQueue) {
            if (liftsQueue[req].getAttribute('target-floor') === targetFloor) {
                return;
            }
        }
        liftsQueue.push(e.target);
        processQueue();
    }


    function processQueue() {
        if (liftsQueue.length === 0) {
            return;
        }

        let liftChoice = getLiftForRequest(liftsQueue[0].getAttribute('floor'));
        if (liftChoice === null) {
            console.log("No lift is idle at the moment");
            return setTimeout(() => {
                console.log("calling a lift again...");
                // all lifts busy at the moment, calling again to look for free lifts now.
                processQueue();
            }, 2200);
        }

        let { liftElement, floor: currFloor, isMoving } = liftChoice;

        let tagetFloorElement = liftsQueue.shift();
        const targetFloor = Number(tagetFloorElement.getAttribute('target-floor'));

        updateLiftData(liftElement, true, targetFloor);

        const floorDiff = Math.abs(targetFloor - currFloor);
        moveLift(floorDiff, targetFloor, liftElement);

        setTimeout(() => {
            animateLiftDoor(liftElement);
            setTimeout(() => {
                updateLiftData(liftElement, false, targetFloor);
                processQueue();
            }, 2 * liftDoorTime); // This timeout here is for travel time for lift to the target floor 
        }, liftPerFloorTime * floorDiff);
    }

    function getLiftForRequest(tagetFloor) {
        let idleLifts = liftsData.filter((lift) => lift.isMoving === false);
        if (idleLifts.length === 0) return null;

        // returning the lift closest to the target floor
        idleLifts.sort((a, b) => {
            return Math.abs(tagetFloor - a.floor) - Math.abs(tagetFloor - b.floor);
        });
        return idleLifts[0];
    }

    function updateLiftData(liftElement, isMoving, floor) {
        for (let i = 0; i < liftsData.length; i++) {
            if (liftsData[i].liftElement === liftElement) {
                liftsData[i].isMoving = isMoving;
                liftsData[i].floor = floor;
            }
        }
    }

    function moveLift(floorDiff, targetFloor, liftElement) {
        if (targetFloor > floorCountEl.value || targetFloor < 0) return;
        const liftHeight = liftElement.firstElementChild.offsetHeight;
        liftElement.style.transform = `translateY(-${targetFloor * (liftHeight + 8)}px)`;
        liftElement.style.transition = `transform ${2 * floorDiff}s ease`;
    }


    function animateLiftDoor(liftElement) {
        let doors = liftElement.children;
        const currentDoorRight = doors[1];
        const currentDoorLeft = doors[0];

        currentDoorLeft.setAttribute(
            "style",
            `transform: translateX(-25px);transition-duration:2500ms`
        );
        currentDoorRight.setAttribute(
            "style",
            `transform: translateX(25px);transition-duration:2500ms`
        );

        setTimeout(() => {
            currentDoorLeft.setAttribute(
                "style",
                `transform: translateX(0px);transition-duration:2500ms`
            );
            currentDoorRight.setAttribute(
                "style",
                `transform: translateX(0px);transition-duration:2500ms`
            );
        }, liftDoorTime);  // This timeout here is for time between two animation (open and closing)
    }
});
