function getToken() {
    const token = localStorage.getItem('token');

    if (this.isTokenValid(token)) {
        return Promise.resolve(token);
    }

    const refreshToken = localStorage.getItem('refreshToken');

    if (this.isTokenValid(refreshToken)) {

        return this.refreshToken(refreshToken)
            .then(response => response.json()).then(data => {
                aBrowser.storage.sync.set({
                    token: (data.token),
                    userId: (data.userId),
                    refreshToken: (data.refreshToken),
                    userEmail: (data.userEmail)
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userId', data.id);
                localStorage.setItem('userEmail', data.email);
                return data.token;
            })
    }

    return new Promise((resolve, reject) => {
        resolve();
    });
}

function refreshToken(refreshToken) {
    const baseUrl = localStorage.getItem('permanent_baseUrl');
    const refreshTokenUrl = `${baseUrl}/auth/token/refresh`;

    let refreshTokenRequest = new Request(refreshTokenUrl, {
        method: 'POST',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            refreshToken: refreshToken
        })
    });

    return fetch(refreshTokenRequest);
}

function isTokenValid(token) {
    if (!token) {
        return false;
    }

    const base64Url = token.split('.')[1];
    if (!base64Url) {
        return false;
    }
    const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const decodedToken  = JSON.parse(window.atob(base64));
    const timeNow = new Date();

    return decodedToken.exp > timeNow / 1000;
}
