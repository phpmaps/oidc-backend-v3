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
        console.log({
            key: k,
            value: p[k]
        })
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
console.log(flow.url);


async function heartbeat(f) {
    const statusUrl = `${flow.apiUrl}/omni/get/onboarding/status?id=${flow.interviewId}`;
    const results = await doGet(statusUrl);
    console.log(results.onboardingStatus);
    if (results.onboardingStatus === 'ONBOARDING_FINISHED') {
        setTimeout(() => {
            const uuid = document.getElementById('uuid').value;
            console.log({
                uuid: uuid,
                id: flow.token,
                interview: flow.interviewId,
                url: `/interaction/${uuid}/login`
            });

            postwith(`http://localhost:3000/interaction/${uuid}/login`, {
                id: flow.token,
                interview: flow.interviewId
            });
            console.log("Finished")
        }, 6000)

    }
}

