let flow;
let interval;
interval = setInterval(heartbeat, 2000, flow);

function doGet(url) {
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Incode-Hardware-Id': flow.token,
            'api-version': '1.0'
        }
    })
        .then((response) => response.json())
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


flow = JSON.parse(document.getElementById('gov_id_selfie').value);

async function heartbeat(f) {
    const statusUrl = `${flow.apiUrl}/omni/get/onboarding/status?id=${flow.interviewId}`;
    const results = await doGet(statusUrl);
    if (results.onboardingStatus === 'ONBOARDING_FINISHED') {
        setTimeout(() => {
            const uuid = document.getElementById('uuid').value;

            postwith(`/interaction/${uuid}/login`, {
                id: flow.token,
                interview: flow.interviewId
            });
        }, 6000)

    }
}
