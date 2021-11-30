class TokenService extends ClockifyService {

    constructor() {
    }

    static get urlTokenRefresh() {
        return `${this.apiEndpoint}/auth/token/refresh`;
    }
       

    static async getToken() {
        const token = localStorage.getItem('token');
            
        if (this.isTokenValid(token)) {
            return token;
        }
    
        const refreshToken = localStorage.getItem('refreshToken');
    
        if (this.isTokenValid(refreshToken)) {
            const { data, error} = await this.refreshToken(refreshToken);
            if (!data || error) 
                return null;
            
            aBrowser.storage.local.set({
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
        }
    
        return null;
    }
    
    static async refreshToken(token) {
        const endPoint = this.urlTokenRefresh;
        const body = {
            refreshToken: token
        };
        return await this.apiCall(endPoint, 'POST', body, /*withNoToken*/ true);
    }

    
    static isTokenValid(token) {
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

    static get isLoggedIn()  {
        return localStorage.getItem('token') !== null && localStorage.getItem('token') !== undefined;
    }

}