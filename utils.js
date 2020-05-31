function doJsonGet(url, fn, err) {
    fetch(url)
        .then((data) => {
            if (!data.ok) {
                throw Error(data.status);
            }
            return data.json();
        })
        .then((json) => {
            // console.log('got as JSON', JSON.parse(json));
            fn(JSON.parse(json));
        })
        .catch((e) => {
            err(e);
        });
}

function doJsonPost(url, content, fn, err) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
    };
    fetch(url, options)
        .then((data) => {
            if (!data.ok) {
                throw Error(data.status);
            }
            return data.json();
        })
        .then((json) => fn(json))
        .catch((e) => {
            err(e);
        });
}
