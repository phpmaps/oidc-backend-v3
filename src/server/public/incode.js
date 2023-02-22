let flow;
let interval;

const updateQr = (text) => {
    var qrcode = new QRCode({ content: text, join: true });
    var svg = qrcode.svg();
    document.getElementById("container").innerHTML = svg;

}

function next() {
    document.getElementById("radios").classList.remove("radios");
    document.getElementById("radios").classList.add("radios-none");
    document.getElementById('qr-section').style.visibility = 'visible';

    interval = setInterval(myCallback, 2000, flow);
    document.getElementById('timer').innerHTML =
        05 + ":" + 00;
    startTimer();
}

function back() {
    document.getElementById("radios").classList.add("radios");
    document.getElementById("radios").classList.remove("radios-none");
    document.getElementById('qr-section').style.visibility = 'hidden';
    clearInterval(interval)
}

document.getElementById('nextBtn').addEventListener(
    'click',
    (evt, val) => {
        next()
    },
    false
);

document.getElementById('backBtn').addEventListener(
    'click',
    (evt, val) => {
        back()
    },
    false
);

document.getElementById('id-selfie').addEventListener(
    'change',
    (evt, val) => {
        flow = JSON.parse(document.getElementById('gov_selfie').value);
        updateQr(flow.url)
    },
    false
);


document.getElementById('selfie').addEventListener(
    'change',
    (evt, val) => {
        flow = JSON.parse(document.getElementById('phone_selfie').value);
        updateQr(flow.url)
    },
    false
);

document.getElementById('face-login').addEventListener(
    'change',
    (evt, val) => {
        flow = JSON.parse(document.getElementById('face_login').value);
        updateQr(flow.url)
    },
    false
);

document.getElementById('container').addEventListener(
    'click',
    (evt) => {
        const uuid = document.getElementById('uuid').value;
        postwith(`/interaction/${uuid}/login`, {
            id: flow.token,
            interview: flow.interviewId
        });
    },
    false
)


function startTimer() {
    var presentTime = document.getElementById('timer').innerHTML;
    var timeArray = presentTime.split(/[:]+/);
    var m = timeArray[0];
    var s = checkSecond((timeArray[1] - 1));
    if (s == 59) { m = m - 1 }
    if (m < 0) {
        return
    }

    document.getElementById('timer').innerHTML =
        m + ":" + s;
    setTimeout(startTimer, 1000);

}

function checkSecond(sec) {
    if (sec < 10 && sec >= 0) { sec = "0" + sec }; // add zero in front of numbers < 10
    if (sec < 0) { sec = "59" };
    return sec;
}


function doGet(url) {

    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Incode-Hardware-Id': flow.token,
            'api-version': '1.0'

        }
    }).then((response) => response.json())
        // .then((data) => {
        //     console.log('Success:', data);
        // })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function postwith(to, p) {
    var myForm = document.createElement("form");
    myForm.method = "post";
    myForm.action = to;
    for (var k in p) {
        var myInput = document.createElement("input");
        myInput.setAttribute("name", k);
        myInput.setAttribute("value", p[k]);
        myForm.appendChild(myInput);
    }
    document.body.appendChild(myForm);
    myForm.submit();
    document.body.removeChild(myForm);
}


flow = JSON.parse(document.getElementById('gov_selfie').value);
updateQr(flow.url)

async function myCallback(f) {
    const statusUrl = `https://demo-api.incodesmile.com/0/omni/get/onboarding/status?id=${flow.interviewId}`;
    const results = await doGet(statusUrl);
    console.log(results.onboardingStatus);
    if(results.onboardingStatus === 'ONBOARDING_FINISHED') {
        const uuid = document.getElementById('uuid').value;
        postwith(`/interaction/${uuid}/login`, {
            id: flow.token,
            interview: flow.interviewId
        });

        // fetch(`https://ping.incodedemo.com/interaction/${uuid}/login`, {
        //     method: 'POST',
        //     credentials: "same-origin",
        //     body: {
        //         id: flow.token,
        //         interview: flow.interviewId
        //     }
        //     //other options
        // }).then(response => console.log("Response status: ", response.status));
    }
}

