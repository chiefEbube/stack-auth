export interface GoogleProfile {
    id: string;
    name: {
        givenName: string;
        familyName: string;
    };
    emails: Array<{ value: string }>;
    photos: Array<{ value: string }>;
}

export interface GoogleUserProfile {
    email: string;
    name: string;
    picture: string;
    sub: string;
}

